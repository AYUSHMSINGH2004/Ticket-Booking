import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const waitlistSchema = z.object({
  category: z.string(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { category } = waitlistSchema.parse(body);

    // Check if event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Verify category exists in pricing
    const pricing = await prisma.eventCategoryPrice.findUnique({
      where: {
        eventId_category: { eventId: id, category },
      }
    });

    if (!pricing) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });

    // Create Waitlist entry
    const waitlist = await prisma.waitlist.create({
      data: {
        eventId: id,
        category,
        customerId: session.userId,
      }
    });

    return NextResponse.json({ success: true, waitlist });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You are already on the waitlist for this category.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
