import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.categoryRule.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(rules);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בטעינת כללים' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword, minAmount, maxAmount, category } = await req.json();

    if (!category) {
      return NextResponse.json({ error: 'קטגוריה נדרשת' }, { status: 400 });
    }
    if (!keyword?.trim() && minAmount == null && maxAmount == null) {
      return NextResponse.json({ error: 'נדרשת לפחות מילת מפתח או טווח סכום' }, { status: 400 });
    }

    const rule = await prisma.categoryRule.create({
      data: {
        keyword: keyword?.trim().toLowerCase() ?? '',
        minAmount: minAmount != null ? Number(minAmount) : null,
        maxAmount: maxAmount != null ? Number(maxAmount) : null,
        category,
      },
    });

    return NextResponse.json(rule);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בשמירת כלל' }, { status: 500 });
  }
}
