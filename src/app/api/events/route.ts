import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      include: {
        venue: true,
        pricing: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
