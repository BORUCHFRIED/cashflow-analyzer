import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currency, transactions } = body as {
      currency: string;
      transactions: Array<{ date: string; description: string; amount: number; category?: string }>;
      month?: string; // ignored — each transaction's month is derived from its own date
    };

    if (!currency || !transactions?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Ensure account exists
    let account = await prisma.account.findUnique({ where: { currency } });
    if (!account) {
      account = await prisma.account.create({ data: { currency } });
    }

    const created = await prisma.$transaction(
      transactions.map(t => {
        const d = new Date(t.date);
        const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        return prisma.transaction.create({
          data: {
            accountId: account!.id,
            date: d,
            description: t.description,
            amount: t.amount,
            category: t.category ?? '',
            month,
          },
        });
      })
    );

    return NextResponse.json({
      count: created.length,
      transactions: created.map(t => ({ ...t, date: t.date.toISOString() })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error saving transactions' }, { status: 500 });
  }
}
