import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency');
  const month = searchParams.get('month');

  try {
    if (currency) {
      // Upsert account
      let account = await prisma.account.findUnique({ where: { currency } });
      if (!account) {
        account = await prisma.account.create({ data: { currency } });
      }

      const where = month
        ? { accountId: account.id, month }
        : { accountId: account.id };

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      return NextResponse.json({
        ...account,
        transactions: transactions.map(t => ({
          ...t,
          date: t.date.toISOString(),
        })),
      });
    }

    // Return all accounts without transactions
    const accounts = await prisma.account.findMany({ orderBy: { currency: 'asc' } });
    return NextResponse.json(accounts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
