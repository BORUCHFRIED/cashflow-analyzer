import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = [
  { fromCurrency: 'GBP', toCurrency: 'ILS', rate: 4.72 },
  { fromCurrency: 'USD', toCurrency: 'ILS', rate: 3.73 },
];

async function getOrCreateDefaults(month: string) {
  // Try month-specific rates first
  let rates = await prisma.exchangeRate.findMany({ where: { month } });
  if (rates.length > 0) return rates;

  // Fall back to global defaults, creating them if missing
  let globals = await prisma.exchangeRate.findMany({ where: { month: 'global' } });
  if (globals.length === 0) {
    await prisma.exchangeRate.createMany({
      data: DEFAULTS.map(d => ({ ...d, month: 'global' })),
    });
    globals = await prisma.exchangeRate.findMany({ where: { month: 'global' } });
  }
  return globals;
}

export async function GET(req: NextRequest) {
  try {
    const month = new URL(req.url).searchParams.get('month') ?? 'global';
    const rates = await getOrCreateDefaults(month);
    return NextResponse.json(rates);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בקריאת שערי חליפין' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { GBP_ILS, USD_ILS, month = 'global' } = await req.json() as {
      GBP_ILS: number;
      USD_ILS: number;
      month?: string;
    };

    await prisma.$transaction([
      prisma.exchangeRate.upsert({
        where: { fromCurrency_toCurrency_month: { fromCurrency: 'GBP', toCurrency: 'ILS', month } },
        update: { rate: GBP_ILS },
        create: { fromCurrency: 'GBP', toCurrency: 'ILS', rate: GBP_ILS, month },
      }),
      prisma.exchangeRate.upsert({
        where: { fromCurrency_toCurrency_month: { fromCurrency: 'USD', toCurrency: 'ILS', month } },
        update: { rate: USD_ILS },
        create: { fromCurrency: 'USD', toCurrency: 'ILS', rate: USD_ILS, month },
      }),
    ]);

    const rates = await prisma.exchangeRate.findMany({ where: { month } });
    return NextResponse.json(rates);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בעדכון שערי חליפין' }, { status: 500 });
  }
}
