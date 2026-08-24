import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ORGANISER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { organiserId: session.userId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' }
        },
        seats: true,
      }
    });

    const stats = events.map(event => {
      const totalRevenue = event.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalBookings = event.bookings.length;
      const soldSeats = event.seats.filter(s => s.status === 'BOOKED').length;
      const totalSeats = event.seats.length;
      
      return {
        id: event.id,
        name: event.name,
        date: event.date,
        totalRevenue,
        totalBookings,
        soldSeats,
        totalSeats,
        occupancy: totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0
      };
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
