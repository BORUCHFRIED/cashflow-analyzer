import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currency, transactions, month } = body as {
      currency: string;
      transactions: Array<{ date: string; description: string; amount: number }>;
      month: string;
    };

    if (!currency || !transactions?.length || !month) {
      return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 });
    }

    // Ensure account exists
    let account = await prisma.account.findUnique({ where: { currency } });
    if (!account) {
      account = await prisma.account.create({ data: { currency } });
    }

    const created = await prisma.$transaction(
      transactions.map(t =>
        prisma.transaction.create({
          data: {
            accountId: account!.id,
            date: new Date(t.date),
            description: t.description,
            amount: t.amount,
            category: '',
            month,
          },
        })
      )
    );

    return NextResponse.json({
      count: created.length,
      transactions: created.map(t => ({ ...t, date: t.date.toISOString() })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בשמירת עסקאות' }, { status: 500 });
  }
}
