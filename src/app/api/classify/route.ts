import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_SIZE = 40;

async function classifyBatch(
  transactions: Array<{ id: string; description: string; amount: number }>
): Promise<Array<{ id: string; category: string }>> {
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
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { transactions } = await req.json() as {
      transactions: Array<{ id: string; description: string; amount: number }>;
    };

    if (!transactions?.length) {
      return NextResponse.json({ error: 'No transactions to classify' }, { status: 400 });
    }

    // Process in batches
    const allResults: Array<{ id: string; category: string }> = [];
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);
      const results = await classifyBatch(batch);
      allResults.push(...results);
    }

    // Update in database
    await prisma.$transaction(
      allResults.map(r =>
        prisma.transaction.update({
          where: { id: r.id },
          data: { category: r.category },
        })
      )
    );

    return NextResponse.json({ results: allResults });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Auto-classification error' }, { status: 500 });
  }
}
