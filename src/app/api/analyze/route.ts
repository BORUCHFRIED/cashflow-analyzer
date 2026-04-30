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

function summarise(txs: Array<{ amount: number; description: string; category: string; date: Date }>) {
  const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income, expenses, net: income - expenses };
}

export async function POST(req: NextRequest) {
  try {
    const { currency, month, messages } = await req.json();

    if (!currency || !month) {
      return new Response('נתונים חסרים', { status: 400 });
    }

    // Fetch ALL transactions for this account from DB
    const account = await prisma.account.findUnique({ where: { currency } });
    if (!account) {
      return new Response('חשבון לא נמצא', { status: 404 });
    }

    const [allTx, customCats] = await Promise.all([
      prisma.transaction.findMany({ where: { accountId: account.id }, orderBy: { date: 'asc' } }),
      prisma.customCategory.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

    const allCategoryNames = [
      ...CATEGORIES.map(c => CATEGORY_LABELS[c]),
      ...customCats.map(c => c.name),
    ];

    if (!allTx.length) {
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('אין עסקאות לניתוח.')); c.close(); } }),
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // Group by month
    const byMonth = new Map<string, typeof allTx>();
    for (const t of allTx) {
      const m = t.month;
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m)!.push(t);
    }

    const currentTx = byMonth.get(month) ?? [];
    const { income: cIncome, expenses: cExpenses, net: cNet } = summarise(currentTx);

    // Current month — full transaction list
    const currentDetail = currentTx.length
      ? currentTx.map(t => {
          const d = new Date(t.date);
          const dateStr = `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
          return `  ${dateStr} | ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} | ${CATEGORY_LABELS[t.category] || t.category || 'לא מסווג'}`;
        }).join('\n')
      : '  (אין עסקאות בחודש זה)';

    // Historical months — summary only
    const sortedMonths = Array.from(byMonth.keys()).sort();
    const historySections = sortedMonths
      .filter(m => m !== month)
      .map(m => {
        const txs = byMonth.get(m)!;
        const { income, expenses, net } = summarise(txs);
        // Top 5 transactions by absolute amount
        const top = [...txs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);
        const topStr = top.map(t => `    • ${t.description}: ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}`).join('\n');
        return `${monthLabel(m)} (${txs.length} עסקאות):
  הכנסות: ${income.toFixed(2)} | הוצאות: ${expenses.toFixed(2)} | נטו: ${net.toFixed(2)}
  5 עסקאות גדולות:
${topStr}`;
      }).join('\n\n');

    const systemPrompt = `אתה אנליסט פיננסי מנוסה. עוזר לבעל עסק לנתח את הנתונים הפיננסיים שלו.
השב תמיד בעברית, בצורה ברורה וישירה.
מטבע: ${currency}

כל הקטגוריות הזמינות במערכת: ${allCategoryNames.join(' | ')}

══ החודש הנוכחי שהמשתמש צופה בו: ${monthLabel(month)} ══
הכנסות: ${cIncome.toFixed(2)} | הוצאות: ${cExpenses.toFixed(2)} | תזרים נטו: ${cNet.toFixed(2)}
מספר עסקאות: ${currentTx.length}

עסקאות מלאות של החודש הנוכחי:
${currentDetail}

══ נתונים היסטוריים (כל שאר החודשים) ══
${historySections || 'אין נתונים היסטוריים עדיין.'}`;

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
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (err) {
    console.error(err);
    return new Response('שגיאה בניתוח AI', { status: 500 });
  }
}
