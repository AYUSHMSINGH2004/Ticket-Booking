import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import QRCode from 'qrcode';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const bookSchema = z.object({
  seatIds: z.array(z.string()),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { seatIds } = bookSchema.parse(body);

    if (seatIds.length === 0) return NextResponse.json({ error: 'No seats selected' }, { status: 400 });

    const event = await prisma.event.findUnique({
      where: { id },
      include: { pricing: true },
    });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Validate that seats are HELD by this user and not expired
    const seats = await prisma.eventSeat.findMany({
      where: {
        id: { in: seatIds },
      }
    });

    for (const seat of seats) {
      if (seat.status !== 'HELD' || seat.heldByUserId !== session.userId || (seat.heldUntil && seat.heldUntil < new Date())) {
        return NextResponse.json({ error: `Seat ${seat.row}${seat.col} hold has expired or is invalid.` }, { status: 400 });
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const seat of seats) {
      const price = event.pricing.find(p => p.category === seat.category)?.price || 0;
      totalAmount += price;
    }

    // Create booking and update seats
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          customerId: session.userId,
          eventId: id,
          totalAmount,
          status: 'CONFIRMED',
        },
      });

      await tx.eventSeat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: 'BOOKED',
          bookingId: newBooking.id,
          heldUntil: null, // Clear hold
        },
      });

      return newBooking;
    });

    // Generate QR Code
    const qrData = JSON.stringify({ bookingId: booking.id, eventId: id, seats: seats.map(s => `${s.row}${s.col}`) });
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
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Ticket Booking" <noreply@unthinkable.co>',
      to: session.email,
      subject: `Booking Confirmed: ${event.name}`,
      html: `
        <h1>Your booking is confirmed!</h1>
        <p>Event: <strong>${event.name}</strong></p>
        <p>Seats: ${seats.map(s => s.row + s.col).join(', ')}</p>
        <p>Total: $${totalAmount}</p>
        <p>Please present the attached QR code at the venue.</p>
      `,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrCodeUrl.split('base64,')[1],
          encoding: 'base64',
        }
      ]
    });

    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ 
      success: true, 
      booking, 
      previewUrl: nodemailer.getTestMessageUrl(info) 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
