import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const row = await prisma.aIContext.findUnique({ where: { id: 'main' } });
  return NextResponse.json({ instructions: row?.instructions ?? '' });
}

export async function PUT(req: NextRequest) {
  const { instructions } = await req.json();
  const row = await prisma.aIContext.upsert({
    where: { id: 'main' },
    update: { instructions },
    create: { id: 'main', instructions },
  });
  return NextResponse.json({ instructions: row.instructions });
}
