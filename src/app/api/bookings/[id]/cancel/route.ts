import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { seats: true, event: true },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.customerId !== session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 });

    // Cancel booking and free seats
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await tx.eventSeat.updateMany({
        where: { bookingId: id },
        data: {
          status: 'AVAILABLE',
          bookingId: null,
          heldByUserId: null,
          heldUntil: null,
        },
      });
    });

    // Waitlist Logic: Auto-offer to the next person for the specific categories cancelled
    // First, find unique categories in the cancelled seats
    const categoriesCancelled = [...new Set(booking.seats.map(s => s.category))];
    
    // Setup Nodemailer for waitlist emails
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });

    for (const category of categoriesCancelled) {
      // Find one seat of this category that is now available
      const availableSeatCount = booking.seats.filter(s => s.category === category).length;
      
      // We will try to offer it to up to `availableSeatCount` people in the waitlist
      const waitlisters = await prisma.waitlist.findMany({
        where: {
          eventId: booking.eventId,
          category,
          status: 'WAITING',
        },
        orderBy: { joinedAt: 'asc' },
        take: availableSeatCount,
        include: { customer: true },
      });

      for (const waitlister of waitlisters) {
        // Offer expires in 2 hours
        const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        await prisma.waitlist.update({
          where: { id: waitlister.id },
          data: {
            status: 'OFFERED',
            offeredAt: new Date(),
            offerExpiresAt,
          },
        });

        // Send email with time-limited link
        const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/event/${booking.eventId}/waitlist-checkout?waitlistId=${waitlister.id}`;
        
        const info = await transporter.sendMail({
          from: '"Ticket Booking" <noreply@unthinkable.co>',
          to: waitlister.customer.email,
          subject: `Waitlist Offer: ${booking.event.name}`,
          html: `
            <h1>Good news!</h1>
            <p>A ${category} seat has become available for <strong>${booking.event.name}</strong>.</p>
            <p>You have 2 hours to claim it.</p>
            <a href="${checkoutLink}">Complete Booking Now</a>
          `,
        });
        console.log('Waitlist Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
