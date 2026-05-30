import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const custom = await prisma.customCategory.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(custom);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error loading categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    const category = await prisma.customCategory.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(category);
  } catch (err: unknown) {
    // Unique constraint = duplicate name
    if ((err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 });
  }
}
