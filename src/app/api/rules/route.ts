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
    const { keyword, category } = await req.json();
    if (!keyword?.trim() || !category) {
      return NextResponse.json({ error: 'מילת מפתח וקטגוריה נדרשות' }, { status: 400 });
    }
    const rule = await prisma.categoryRule.upsert({
      where: { keyword: keyword.trim().toLowerCase() },
      update: { category },
      create: { keyword: keyword.trim().toLowerCase(), category },
    });
    return NextResponse.json(rule);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בשמירת כלל' }, { status: 500 });
  }
}
