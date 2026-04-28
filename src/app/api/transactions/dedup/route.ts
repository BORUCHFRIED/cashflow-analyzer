import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Groups by accountId + date (day only) + description + amount and removes extras.
// POST { dry_run: true }  → just report counts, delete nothing
// POST { dry_run: false } → delete duplicates and report
export async function POST(req: NextRequest) {
  const { dry_run } = await req.json().catch(() => ({ dry_run: true }));

  const all = await prisma.transaction.findMany({
    select: { id: true, accountId: true, date: true, description: true, amount: true },
    orderBy: { createdAt: 'asc' }, // keep oldest copy
  });

  // Group by accountId + day + description + amount
  const groups = new Map<string, string[]>();
  for (const t of all) {
    const day = new Date(t.date).toISOString().slice(0, 10);
    const key = `${t.accountId}|${day}|${t.description}|${t.amount}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t.id);
  }

  // Collect ids to delete (all but the first in each group)
  const toDelete: string[] = [];
  for (const ids of groups.values()) {
    if (ids.length > 1) toDelete.push(...ids.slice(1));
  }

  if (dry_run) {
    return NextResponse.json({ duplicates_found: toDelete.length, deleted: 0, dry_run: true });
  }

  await prisma.transaction.deleteMany({ where: { id: { in: toDelete } } });
  return NextResponse.json({ duplicates_found: toDelete.length, deleted: toDelete.length, dry_run: false });
}
