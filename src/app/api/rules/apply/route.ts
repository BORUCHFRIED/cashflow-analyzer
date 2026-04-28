import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { accountId, month } = await req.json();

    // Load all rules and uncategorized transactions
    const [rules, transactions] = await Promise.all([
      prisma.categoryRule.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.transaction.findMany({
        where: { accountId, month, category: '' },
      }),
    ]);

    if (!rules.length || !transactions.length) {
      return NextResponse.json({ matched: 0 });
    }

    let matched = 0;
    const updates: Promise<unknown>[] = [];

    for (const tx of transactions) {
      const desc = tx.description.toLowerCase();
      const matchedRule = rules.find(r => desc.includes(r.keyword));
      if (matchedRule) {
        updates.push(
          prisma.transaction.update({
            where: { id: tx.id },
            data: { category: matchedRule.category },
          })
        );
        matched++;
      }
    }

    await Promise.all(updates);
    return NextResponse.json({ matched });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בהחלת כללים' }, { status: 500 });
  }
}
