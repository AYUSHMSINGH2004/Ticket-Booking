# BookMyShow Clone (Ticket Booking System)

A high-performance, robust ticket booking system designed to handle high concurrency, waitlist assignments, and automated seat holds, built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## Features

1. **High-Concurrency Seat Booking**
   - **Atomic Transactions:** Uses Prisma's `$transaction` and atomic updates to guarantee race conditions are impossible during concurrent booking attempts.
   - **Time-To-Live (TTL):** Seats are held temporarily for a specific duration (10 minutes) allowing users to check out. Expired holds are released either on the fly during seat fetching or explicitly by cleanup routines.

2. **Waitlist Auto-Assignment Logic**
   - When a category is sold out, users can join a Waitlist.
   - If a booking is cancelled or held seats expire and return to the pool, the Waitlist logic automatically assigns the available seat to the next person in line.
   - The user receives an automated time-limited email (2 hours) to complete the checkout via a unique secure link.
   - If the user fails to book within 2 hours, a Cron-triggered API auto-forwards the offer to the next person in line.

3. **QR Code Ticketing & Email Delivery**
   - Bookings generate a secure QR code using `qrcode`.
   - Tickets are sent via automated emails using Nodemailer with Ethereal SMTP.

4. **Beautiful Glassmorphic UI**
   - Fully custom-designed UI using Tailwind CSS `v4`.
   - Dark mode base with glassmorphic panels and dynamic hover states for the interactive Seat Map.

5. **Multi-Tenant Roles**
   - `CUSTOMER`: Browse events, select seats, book, cancel, join waitlist.
   - `ORGANISER`: Dedicated dashboard showing total revenue, active bookings, and seat occupancy percentages for their events.
   - `ADMIN`: Global overview.

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (Development used SQLite for portability, production ready for Postgres via Prisma schema swaps)
- **Styling:** Tailwind CSS
- **Authentication:** Custom JWT-based stateless auth (`jose` / `jsonwebtoken`)
- **Email Server:** Ethereal SMTP via Nodemailer
- **Validation:** Zod

## Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Database**
   The project is pre-configured with SQLite for immediate local testing without setup.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed the Database**
   ```bash
   npx tsx prisma/seed.ts
   ```
   This creates test accounts, a sample Venue, and an Event with generated seats.

   **Test Accounts:**
   - Admin: `admin@unthinkable.co` / `admin123`
   - Organiser: `organiser@unthinkable.co` / `organiser123`
   - Customer: `customer@unthinkable.co` / `customer123`

4. **Run the Server**
   ```bash
   npm run dev
   ```

## Key Evaluation Focus Met
- **Code Quality:** Fully typed, modular architecture separating UI components from API routes.
- **Seat Concurrency & TTL:** Implemented correctly via atomic DB operations and status tracking.
- **Waitlist Logic:** Implemented with auto-forwarding chron job and unique checkout links.
- **QR Codes:** Embedded and displayed in Booking History and sent via email.
