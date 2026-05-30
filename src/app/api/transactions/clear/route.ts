import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const month = searchParams.get('month');

    if (!accountId || !month) {
      return NextResponse.json({ error: 'accountId and month are required' }, { status: 400 });
    }

    const { count } = await prisma.transaction.deleteMany({
      where: { accountId, month },
    });

    return NextResponse.json({ deleted: count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting month data' }, { status: 500 });
  }
}
