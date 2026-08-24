import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const holdSchema = z.object({
  seatIds: z.array(z.string()),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { seatIds } = holdSchema.parse(body);

    if (seatIds.length === 0) {
      return NextResponse.json({ error: 'No seats selected' }, { status: 400 });
    }

    // Atomic update to hold seats. SQLite doesn't support SELECT FOR UPDATE well with Prisma,
    // so we use an atomic UPDATE WHERE status = AVAILABLE OR (HELD and EXPIRED).
    // Prisma `updateMany` returns the count of updated rows.
    
    // Calculate expiry 10 minutes from now
    const holdExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // We have to update each seat and verify they were all successfully held by this user.
    // To prevent partial holds (where some succeed and some fail), we should ideally do this in a transaction.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Release expired holds for these specific seats first
      await tx.eventSeat.updateMany({
        where: {
          id: { in: seatIds },
          status: 'HELD',
          heldUntil: { lt: new Date() },
        },
        data: { status: 'AVAILABLE', heldByUserId: null, heldUntil: null },
      });

      // 2. Try to hold all of them atomically
      const { count } = await tx.eventSeat.updateMany({
        where: {
          id: { in: seatIds },
          status: 'AVAILABLE',
        },
        data: {
          status: 'HELD',
          heldByUserId: session.userId,
          heldUntil: holdExpiry,
        },
      });

      // 3. If count doesn't match requested length, it means someone else took at least one seat
      if (count !== seatIds.length) {
        throw new Error('CONCURRENCY_ERROR');
      }

      return true;
    });

    return NextResponse.json({ success: true, heldUntil: holdExpiry });
  } catch (error: any) {
    if (error.message === 'CONCURRENCY_ERROR') {
      return NextResponse.json({ error: 'One or more seats are no longer available. Please select again.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
