import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: { customerId: session.userId },
      include: {
        event: {
          include: { venue: true },
        },
        seats: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
