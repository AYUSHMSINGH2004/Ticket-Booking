# System Design Document

## 1. Concurrency Protection Mechanism
The most critical aspect of a ticketing system is ensuring that two users cannot book the same seat simultaneously (Race Conditions). 

### How it is solved:
When a user attempts to hold seats via `/api/events/[id]/hold`, the backend executes an atomic `updateMany` operation within a Prisma `$transaction`.

```typescript
const { count } = await tx.eventSeat.updateMany({
  where: { 
    id: { in: seatIds },
    status: 'AVAILABLE' // Atomic check
  },
  data: {
    status: 'HELD',
    heldByUserId: userId,
    heldUntil: new Date(Date.now() + 10 * 60 * 1000)
  }
});

if (count !== seatIds.length) {
  // If count mismatches, someone else beat us to at least one seat.
  throw new Error("One or more seats are no longer available.");
}
```
This guarantees at the database level that the seat is only acquired if it is strictly `AVAILABLE` at the exact microsecond of the query execution. 

## 2. Seat Hold TTL (Time-To-Live)
When a seat is HELD, a `heldUntil` timestamp is stored. 
If the user does not complete checkout within 10 minutes, the hold expires.
Instead of relying solely on expensive background cron jobs to scan and release seats every second, the system handles TTL lazily:
- Whenever the frontend requests the seat map (`GET /seats`), the API first scans for any seats where `heldUntil < NOW()` and releases them to `AVAILABLE` *before* returning the current map. This guarantees high performance and accuracy without background overhead.

## 3. Waitlist System Architecture
When a category is sold out, users can join a Waitlist.
- **Trigger**: When a user cancels their booking, the `/cancel` API releases the seats and immediately searches the waitlist.
- **Offer Generation**: It finds the oldest waitlist entry (`status = WAITING`) and updates it to `status = OFFERED` with a 2-hour TTL.
- **Delivery**: It uses Nodemailer to send a one-time secure checkout link (`/waitlist-checkout?waitlistId=...`) to the user.
- **Chron Fallback**: A Cron endpoint (`/api/cron/waitlist`) checks for `OFFERED` statuses that missed their 2-hour TTL, marks them `EXPIRED`, and automatically generates the offer for the next person in line.

## 4. Frontend Application Architecture
- **Next.js App Router** is used to co-locate API routes and frontend pages.
- **Glassmorphic UI** leveraging TailwindCSS provides an immersive experience.
- The `SeatMap` component manages its own state for selected seats and visually discriminates between Available, Premium, Standard, Held, and Booked seats dynamically using color-coding.
