import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { date, description, amount, category, notes } = body;

    const data: Record<string, unknown> = {};
    if (date !== undefined) data.date = new Date(date);
    if (description !== undefined) data.description = description;
    if (amount !== undefined) data.amount = Number(amount);
    if (category !== undefined) data.category = category;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ ...updated, date: updated.date.toISOString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error updating transaction' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting transaction' }, { status: 500 });
  }
}
