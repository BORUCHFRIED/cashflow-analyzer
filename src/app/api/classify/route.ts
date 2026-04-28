import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactions } = body as {
      transactions: Array<{ id: string; description: string; amount: number }>;
    };

    if (!transactions?.length) {
      return NextResponse.json({ error: 'אין עסקאות לסיווג' }, { status: 400 });
    }

    const prompt = `You are a financial transaction categorizer. Classify each transaction into exactly one of these categories:
${CATEGORIES.join(', ')}

Rules:
- Positive amounts are income → use Sales Revenue or Service Revenue
- Negative amounts are expenses → use the most appropriate expense category
- Salaries/wages → Staff & Salaries
- Rent/office costs → Rent & Office
- Advertising/marketing → Marketing & Ads
- Raw materials/suppliers → Suppliers & Materials
- Software/cloud/hosting/SaaS → Infrastructure & Software
- Bank loans/interest → Loans & Finance
- Taxes/VAT/compliance → Taxes & Compliance
- If unsure → General Expenses

Transactions to classify:
${transactions.map((t, i) => `${i + 1}. ID:${t.id} | "${t.description}" | Amount: ${t.amount}`).join('\n')}

Respond with a JSON array only, no explanation:
[{"id": "...", "category": "..."}, ...]`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'תגובת AI לא תקינה' }, { status: 500 });
    }

    const results: Array<{ id: string; category: string }> = JSON.parse(jsonMatch[0]);

    // Update in database
    await prisma.$transaction(
      results.map(r =>
        prisma.transaction.update({
          where: { id: r.id },
          data: { category: r.category },
        })
      )
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בסיווג אוטומטי' }, { status: 500 });
  }
}
