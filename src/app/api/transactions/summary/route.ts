import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const all = await prisma.transaction.findMany({
    select: { month: true, accountId: true },
  });
  const counts: Record<string, number> = {};
  for (const t of all) {
    const key = t.month;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return NextResponse.json({ total: all.length, byMonth: counts });
}
