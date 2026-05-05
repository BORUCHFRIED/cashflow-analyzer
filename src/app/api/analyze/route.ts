import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { CATEGORY_LABELS, CATEGORIES } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const names = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return `${names[m - 1]} ${y}`;
}

function summarise(txs: Array<{ amount: number }>) {
  const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income, expenses, net: income - expenses };
}

type Tx = { amount: number; description: string; category: string; date: Date; month: string };

function currencySection(
  cur: string,
  txs: Tx[],
  focusMonth: string,
  isCurrent: boolean,
): string {
  const byMonth = new Map<string, Tx[]>();
  for (const t of txs) {
    if (!byMonth.has(t.month)) byMonth.set(t.month, []);
    byMonth.get(t.month)!.push(t);
  }

  const currentTx = byMonth.get(focusMonth) ?? [];
  const { income, expenses, net } = summarise(currentTx);

  const txLines = currentTx.length
    ? currentTx.map(t => {
        const d = new Date(t.date);
        const ds = `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
        return `    ${ds} | ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} | ${CATEGORY_LABELS[t.category] || t.category || 'לא מסווג'}`;
      }).join('\n')
    : '    (אין עסקאות בחודש זה)';

  const sortedMonths = Array.from(byMonth.keys()).sort();
  const history = sortedMonths
    .filter(m => m !== focusMonth)
    .map(m => {
      const mtxs = byMonth.get(m)!;
      const { income: hi, expenses: he, net: hn } = summarise(mtxs);
      const top = [...mtxs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);
      const topStr = top.map(t => `      • ${t.description}: ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}`).join('\n');
      return `    ${monthLabel(m)} (${mtxs.length} עסקאות): הכנסות ${hi.toFixed(2)} | הוצאות ${he.toFixed(2)} | נטו ${hn.toFixed(2)}\n${topStr}`;
    }).join('\n');

  const marker = isCurrent ? ' ◄ החשבון הנוכחי' : '';
  return `══ חשבון ${cur}${marker} ══
  ${monthLabel(focusMonth)}: הכנסות ${income.toFixed(2)} ${cur} | הוצאות ${expenses.toFixed(2)} ${cur} | נטו ${net.toFixed(2)} ${cur} | עסקאות: ${currentTx.length}
  עסקאות מלאות:
${txLines}
  היסטוריה:
${history || '    אין נתונים היסטוריים'}`;
}

export async function POST(req: NextRequest) {
  try {
    const { currency, month, messages } = await req.json();
    if (!currency || !month) return new Response('נתונים חסרים', { status: 400 });

    // Always fetch ALL accounts and their transactions
    const [accounts, customCats, aiCtx] = await Promise.all([
      prisma.account.findMany(),
      prisma.customCategory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.aIContext.findUnique({ where: { id: 'main' } }),
    ]);
    const businessInstructions = aiCtx?.instructions?.trim() ?? '';

    const allCategoryNames = [
      ...CATEGORIES.map(c => CATEGORY_LABELS[c]),
      ...customCats.map(c => c.name),
    ];

    const txsByAccount = await Promise.all(
      accounts.map(a =>
        prisma.transaction.findMany({ where: { accountId: a.id }, orderBy: { date: 'asc' } })
          .then(txs => ({ currency: a.currency, txs }))
      )
    );

    const totalTx = txsByAccount.reduce((s, a) => s + a.txs.length, 0);
    if (totalTx === 0) {
      return new Response(
        new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('אין עסקאות לניתוח.')); c.close(); } }),
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const sections = txsByAccount.map(({ currency: cur, txs }) =>
      currencySection(cur, txs, month, cur === currency || currency === 'CONSOLIDATED')
    ).join('\n\n');

    const viewingNote = currency === 'CONSOLIDATED'
      ? 'תצוגה מאוחדת (כל המטבעות)'
      : `צופה כרגע בחשבון ${currency}`;

    const systemPrompt = `אתה אנליסט פיננסי מנוסה עם גישה מלאה לכל החשבונות של העסק.
השב תמיד בעברית, בצורה ברורה וישירה.
${viewingNote} — חודש: ${monthLabel(month)}

כל הקטגוריות הזמינות: ${allCategoryNames.join(' | ')}
${businessInstructions ? `\n══ הוראות עסקיות קבועות ══\n${businessInstructions}\n` : ''}
יש לך גישה לנתונים של כל המטבעות — GBP, ILS, USD — כולל עסקאות מלאות והיסטוריה.

${sections}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: systemPrompt,
            messages,
            stream: true,
          });
          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) { controller.error(err); }
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (err) {
    console.error(err);
    return new Response('שגיאה בניתוח AI', { status: 500 });
  }
}
