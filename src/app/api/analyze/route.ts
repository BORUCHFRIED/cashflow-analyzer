import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORY_LABELS } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(
  transactions: Array<{ date: string; description: string; amount: number; category: string }>,
  mode: string,
  currency: string,
  extraContext?: string
): string {
  const income = transactions.filter(t => t.amount > 0);
  const expenses = transactions.filter(t => t.amount < 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : '0';

  const txList = transactions
    .map(t => `  - ${new Date(t.date).toLocaleDateString('he-IL')} | ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)} ${currency} | ${CATEGORY_LABELS[t.category] || t.category}`)
    .join('\n');

  const summary = `מטבע: ${currency}
סה"כ הכנסות: ${totalIncome.toFixed(2)} ${currency}
סה"כ הוצאות: ${totalExpenses.toFixed(2)} ${currency}
תזרים נטו: ${net.toFixed(2)} ${currency}
שולי רווח: ${margin}%

רשימת עסקאות:
${txList}

${extraContext ?? ''}`;

  const modePrompts: Record<string, string> = {
    full: `אתה אנליסט פיננסי מנוסה. נתח את תזרים המזומנים הבא בצורה מקיפה.
כלול: מגמות מרכזיות, הכנסות מול הוצאות, ביצועים לפי קטגוריה, תובנות עסקיות, והמלצות לשיפור.
השב בעברית, בפורמט מסודר עם כותרות.

${summary}`,

    savings: `אתה יועץ פיננסי עם התמחות בצמצום עלויות. בהתבסס על הנתונים הבאים, זהה הזדמנויות חיסכון ספציפיות.
לכל המלצה כלול: הסכום הפוטנציאלי לחיסכון, הסיבה לחיסכון, וצעדים מעשיים ליישום.
השב בעברית, בצורת רשימה ממוספרת.

${summary}`,

    risk: `אתה מנהל סיכונים פיננסיים. זהה סיכונים ואיומים בתזרים המזומנים הבא.
כלול: סיכוני נזילות, תלות בלקוחות בודדים, הוצאות בלתי צפויות, ומדדי אזהרה.
דרג כל סיכון (נמוך/בינוני/גבוה) והצע פעולות מתקנות.
השב בעברית.

${summary}`,
  };

  return modePrompts[mode] ?? modePrompts.full;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactions, mode, currency, extraContext } = body;

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

    const prompt = buildPrompt(transactions, mode, currency, extraContext);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          });

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error(err);
    return new Response('שגיאה בניתוח AI', { status: 500 });
  }
}
