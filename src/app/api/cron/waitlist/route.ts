import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Find all expired offers
    const expiredWaitlists = await prisma.waitlist.findMany({
      where: {
        status: 'OFFERED',
        offerExpiresAt: { lt: new Date() },
      },
      include: { event: true },
    });

    if (expiredWaitlists.length === 0) return NextResponse.json({ success: true, message: 'No expired offers' });

    // Setup Nodemailer for waitlist emails
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });

    for (const expired of expiredWaitlists) {
      // Mark as EXPIRED
      await prisma.waitlist.update({
        where: { id: expired.id },
        data: { status: 'EXPIRED' },
      });

      // Find next in line
      const nextWaitlister = await prisma.waitlist.findFirst({
        where: {
          eventId: expired.eventId,
          category: expired.category,
          status: 'WAITING',
        },
        orderBy: { joinedAt: 'asc' },
        include: { customer: true },
      });

      if (nextWaitlister) {
        const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        await prisma.waitlist.update({
          where: { id: nextWaitlister.id },
          data: {
            status: 'OFFERED',
            offeredAt: new Date(),
            offerExpiresAt,
          },
        });

        // Send email
        const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/event/${nextWaitlister.eventId}/waitlist-checkout?waitlistId=${nextWaitlister.id}`;
        
        const info = await transporter.sendMail({
          from: '"Ticket Booking" <noreply@unthinkable.co>',
          to: nextWaitlister.customer.email,
          subject: `Waitlist Offer: ${expired.event.name}`,
          html: `
            <h1>Good news!</h1>
            <p>A ${expired.category} seat has become available for <strong>${expired.event.name}</strong>.</p>
            <p>You have 2 hours to claim it.</p>
            <a href="${checkoutLink}">Complete Booking Now</a>
          `,
        });
        console.log('Forwarded Waitlist Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }

    return NextResponse.json({ success: true, processed: expiredWaitlists.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
