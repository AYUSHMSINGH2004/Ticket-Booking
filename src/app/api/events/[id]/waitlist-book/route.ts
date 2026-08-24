import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import QRCode from 'qrcode';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const schema = z.object({ waitlistId: z.string() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { waitlistId } = schema.parse(body);

    // Verify waitlist
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
    });

    if (!waitlist || waitlist.customerId !== session.userId || waitlist.eventId !== id) {
      return NextResponse.json({ error: 'Invalid waitlist record' }, { status: 400 });
    }

    if (waitlist.status !== 'OFFERED' || !waitlist.offerExpiresAt || waitlist.offerExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Offer expired or invalid' }, { status: 400 });
    }

    // Find 1 available seat in the category
    const seat = await prisma.eventSeat.findFirst({
      where: {
        eventId: id,
        category: waitlist.category,
        status: 'AVAILABLE', // Wait, earlier we set the cancelled seat to AVAILABLE. Let's grab it.
      }
    });

    if (!seat) {
      return NextResponse.json({ error: 'No seats available anymore.' }, { status: 400 });
    }

    const eventPricing = await prisma.eventCategoryPrice.findUnique({
      where: { eventId_category: { eventId: id, category: waitlist.category } }
    });

    const totalAmount = eventPricing?.price || 0;

    // Transaction to book seat and fulfill waitlist
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Lock/Update seat
      const { count } = await tx.eventSeat.updateMany({
        where: { id: seat.id, status: 'AVAILABLE' },
        data: { status: 'BOOKED' }
      });
      if (count === 0) throw new Error('CONCURRENCY_ERROR');

      // 2. Create booking
      const newBooking = await tx.booking.create({
        data: { customerId: session.userId, eventId: id, totalAmount, status: 'CONFIRMED' }
      });

      // 3. Update seat with bookingId
      await tx.eventSeat.update({
        where: { id: seat.id },
        data: { bookingId: newBooking.id }
      });

      // 4. Mark waitlist as fulfilled
      await tx.waitlist.update({
        where: { id: waitlist.id },
        data: { status: 'FULFILLED' }
      });

      return newBooking;
    });

    // Generate QR Code
    const qrData = JSON.stringify({ bookingId: booking.id, eventId: id, seats: [`${seat.row}${seat.col}`] });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCodeUrl },
    });

    // Send Email via Ethereal
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });

    const info = await transporter.sendMail({
      from: '"Ticket Booking" <noreply@unthinkable.co>',
      to: session.email,
      subject: `Booking Confirmed from Waitlist!`,
      html: `
        <h1>Your booking is confirmed!</h1>
        <p>Your waitlist offer has been successfully redeemed.</p>
        <p>Seat: ${seat.row}${seat.col}</p>
        <p>Please present the attached QR code at the venue.</p>
      `,
      attachments: [{ filename: 'ticket-qr.png', content: qrCodeUrl.split('base64,')[1], encoding: 'base64' }]
    });

    return NextResponse.json({ success: true, booking, previewUrl: nodemailer.getTestMessageUrl(info) });

  } catch (error: any) {
    if (error.message === 'CONCURRENCY_ERROR') {
      return NextResponse.json({ error: 'Seat was grabbed by someone else. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
