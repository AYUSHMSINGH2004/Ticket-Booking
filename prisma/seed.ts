import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@unthinkable.co' },
    update: {},
    create: {
      email: 'admin@unthinkable.co',
      name: 'Super Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const orgPassword = await bcrypt.hash('org123', 10);
  const organiser = await prisma.user.upsert({
    where: { email: 'organiser@unthinkable.co' },
    update: {},
    create: {
      email: 'organiser@unthinkable.co',
      name: 'Event Organiser',
      passwordHash: orgPassword,
      role: 'ORGANISER',
    },
  });

  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@unthinkable.co' },
    update: {},
    create: {
      email: 'customer@unthinkable.co',
      name: 'Valued Customer',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('Seed data created:');
  console.log(`Admin: ${admin.email} / admin123`);
  console.log(`Organiser: ${organiser.email} / org123`);
  console.log(`Customer: ${customer.email} / customer123`);

  // Create a Venue
  const venue = await prisma.venue.create({
    data: {
      name: 'Unthinkable Arena',
      location: 'Gurugram, India',
      capacity: 50,
      adminId: admin.id,
    },
  });

  // Create an Event
  const event = await prisma.event.create({
    data: {
      name: 'Rock Concert 2026',
      description: 'The biggest rock concert of the year.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      venueId: venue.id,
      organiserId: organiser.id,
    },
  });

  // Event Pricing
  await prisma.eventCategoryPrice.createMany({
    data: [
      { eventId: event.id, category: 'PREMIUM', price: 2000 },
      { eventId: event.id, category: 'STANDARD', price: 1000 },
    ],
  });

  // Create Seats
  const seatData = [];
  for (let r = 0; r < 5; r++) {
    const row = String.fromCharCode(65 + r); // A, B, C, D, E
    for (let c = 1; c <= 10; c++) {
      seatData.push({
        eventId: event.id,
        row,
        col: c,
        category: r < 2 ? 'PREMIUM' : 'STANDARD', // Rows A and B are PREMIUM
        status: 'AVAILABLE',
      });
    }
  }

  await prisma.eventSeat.createMany({
    data: seatData,
  });

  console.log(`Venue, Event, Pricing, and ${seatData.length} Seats created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
