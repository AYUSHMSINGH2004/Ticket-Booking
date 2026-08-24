import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // First, auto-release any held seats that have expired.
    // In SQLite we can just run an update directly.
    await prisma.eventSeat.updateMany({
      where: {
        eventId: id,
        status: 'HELD',
        heldUntil: {
          lt: new Date(),
        },
      },
      data: {
        status: 'AVAILABLE',
        heldByUserId: null,
        heldUntil: null,
      },
    });

    const seats = await prisma.eventSeat.findMany({
      where: { eventId: id },
      orderBy: [
        { row: 'asc' },
        { col: 'asc' },
      ],
    });

    return NextResponse.json(seats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
