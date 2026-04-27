import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = [
  { fromCurrency: 'GBP', toCurrency: 'ILS', rate: 4.72 },
  { fromCurrency: 'USD', toCurrency: 'ILS', rate: 3.73 },
];

export async function GET() {
  try {
    let rates = await prisma.exchangeRate.findMany();

    if (rates.length === 0) {
      await prisma.exchangeRate.createMany({ data: DEFAULTS });
      rates = await prisma.exchangeRate.findMany();
    }

    return NextResponse.json(rates);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בקריאת שערי חליפין' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { GBP_ILS, USD_ILS } = body as { GBP_ILS: number; USD_ILS: number };

    await prisma.$transaction([
      prisma.exchangeRate.upsert({
        where: { fromCurrency_toCurrency: { fromCurrency: 'GBP', toCurrency: 'ILS' } },
        update: { rate: GBP_ILS },
        create: { fromCurrency: 'GBP', toCurrency: 'ILS', rate: GBP_ILS },
      }),
      prisma.exchangeRate.upsert({
        where: { fromCurrency_toCurrency: { fromCurrency: 'USD', toCurrency: 'ILS' } },
        update: { rate: USD_ILS },
        create: { fromCurrency: 'USD', toCurrency: 'ILS', rate: USD_ILS },
      }),
    ]);

    const rates = await prisma.exchangeRate.findMany();
    return NextResponse.json(rates);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בעדכון שערי חליפין' }, { status: 500 });
  }
}
