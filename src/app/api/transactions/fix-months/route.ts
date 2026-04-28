import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const all = await prisma.transaction.findMany({ select: { id: true, date: true, month: true } });

    let fixed = 0;
    for (const t of all) {
      const d = new Date(t.date);
      const correctMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (t.month !== correctMonth) {
        await prisma.transaction.update({ where: { id: t.id }, data: { month: correctMonth } });
        fixed++;
      }
    }

    return NextResponse.json({ total: all.length, fixed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'שגיאה בתיקון חודשים' }, { status: 500 });
  }
}
