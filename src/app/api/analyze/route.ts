import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORY_LABELS } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transactions, currency, messages } = await req.json();

    if (!transactions?.length) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('אין עסקאות לניתוח עבור החודש הנבחר.'));
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const income = transactions.filter((t: { amount: number }) => t.amount > 0);
    const expenses = transactions.filter((t: { amount: number }) => t.amount < 0);
    const totalIncome = income.reduce((s: number, t: { amount: number }) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s: number, t: { amount: number }) => s + Math.abs(t.amount), 0);
    const net = totalIncome - totalExpenses;

    const txList = transactions
      .map((t: { date: string; description: string; amount: number; category: string }) =>
        `  - ${new Date(t.date).toLocaleDateString('he-IL')} | ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} ${currency} | ${CATEGORY_LABELS[t.category] || t.category || 'לא מסווג'}`
      )
      .join('\n');

    const systemPrompt = `אתה אנליסט פיננסי מנוסה ויועץ עסקי. אתה עוזר לבעל עסק לנתח את תזרים המזומנים שלו.
השב תמיד בעברית, בצורה ברורה וישירה.

נתוני החודש הנוכחי (${currency}):
סה"כ הכנסות: ${totalIncome.toFixed(2)} ${currency}
סה"כ הוצאות: ${totalExpenses.toFixed(2)} ${currency}
תזרים נטו: ${net.toFixed(2)} ${currency}
מספר עסקאות: ${transactions.length}

רשימת עסקאות מלאה:
${txList}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: systemPrompt,
            messages: messages,
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
