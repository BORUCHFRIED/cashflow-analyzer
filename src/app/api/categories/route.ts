import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const custom = await prisma.customCategory.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(custom);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בטעינת קטגוריות' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'שם קטגוריה נדרש' }, { status: 400 });
    }
    const category = await prisma.customCategory.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(category);
  } catch (err: unknown) {
    // Unique constraint = duplicate name
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'קטגוריה בשם זה כבר קיימת' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'שגיאה ביצירת קטגוריה' }, { status: 500 });
  }
}
