# 🎟️ Ticket Booking System

### A Production-Oriented, Concurrency-Safe Event Ticket Booking Platform

<p align="center">
  <strong>Built by Ayush M Singh</strong>
</p>

<p align="center">
  A full-stack ticket booking platform engineered around <strong>concurrency-safe seat reservations</strong>, <strong>temporary seat holds</strong>, <strong>automated waitlist allocation</strong>, <strong>QR-based digital tickets</strong>, and <strong>role-based dashboards</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Authentication-JWT-orange?style=flat-square"/>
  <img src="https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square"/>
  <img src="https://img.shields.io/badge/Email-Nodemailer-red?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-Educational-lightgrey?style=flat-square"/>
</p>

---

## 📌 Overview

**Ticket Booking System** is a full-stack event ticketing application inspired by modern platforms such as BookMyShow.

The application focuses not only on the booking experience, but also on the **backend engineering challenges behind ticketing systems**—particularly race-condition prevention, seat locking, transaction safety, waitlist management, expiration handling, and automated ticket delivery.

The platform supports multiple user roles and provides separate workflows for customers, organisers, and administrators.

### Core Engineering Highlights

* ⚡ Atomic, concurrency-safe seat reservation
* 🔒 Temporary seat locking with TTL
* 🧾 Booking history and cancellation
* 🎫 QR-code based digital tickets
* 📧 Automated email ticket delivery
* 🕐 Automated waitlist offer expiration
* 🔄 Automatic waitlist forwarding
* 👥 Role-based authentication and authorization
* 📊 Organiser analytics dashboard
* 🛡️ Zod request validation
* 🎨 Modern glassmorphic responsive interface

---

# ✨ Key Features

## 🎟️ Smart Seat Booking

The system provides an interactive seat map where users can view and select seats dynamically.

Each seat maintains a lifecycle:

```text
AVAILABLE
    │
    ▼
  HELD
    │
    ▼
 BOOKED
```

Seats can also return to `AVAILABLE` when a temporary hold expires or a confirmed booking is cancelled.

### Seat States

| State          | Meaning                              |
| -------------- | ------------------------------------ |
| 🟢 `AVAILABLE` | Seat can be selected                 |
| 🟡 `HELD`      | Temporarily reserved during checkout |
| 🔴 `BOOKED`    | Successfully purchased               |
| ⭐ `PREMIUM`    | Premium-category seating             |
| 🔵 `STANDARD`  | Standard-category seating            |

---

# 🔐 Concurrency-Safe Booking

One of the most important engineering problems in a ticketing platform is preventing two users from purchasing the same seat simultaneously.

For example:

```text
User A ───────┐
              │
              ▼
        Seat A-10
              ▲
              │
User B ───────┘
```

A naive implementation could allow both requests to see the seat as available.

This project prevents that using **database-level atomic updates inside Prisma transactions**.

Conceptually:

```typescript
const { count } = await tx.eventSeat.updateMany({
  where: {
    id: { in: seatIds },
    status: "AVAILABLE"
  },
  data: {
    status: "HELD",
    heldByUserId: userId,
    heldUntil: new Date(Date.now() + 10 * 60 * 1000)
  }
});

if (count !== seatIds.length) {
  throw new Error("One or more seats are no longer available.");
}
```

The important principle is:

> **A seat is acquired only if the database still considers it AVAILABLE at the time of the atomic update.**

This prevents common race conditions in concurrent booking scenarios.

---

# ⏱️ Temporary Seat Holds

When a customer selects seats, the system places them into a temporary `HELD` state.

### Hold Duration

**10 minutes**

```text
Seat Selected
      │
      ▼
    HELD
      │
      ├──────────────► Checkout Completed
      │                        │
      │                        ▼
      │                     BOOKED
      │
      └──────────────► 10 Minutes Expired
                               │
                               ▼
                           AVAILABLE
```

The hold timestamp is stored using:

```text
heldUntil
```

Expired seats are cleaned up when the seat map is requested, reducing the need for constant background polling.

---

# 🔄 Automated Waitlist System

When a particular ticket category becomes unavailable, customers can join a waitlist.

The waitlist operates on a **first-come, first-served** basis.

### Waitlist Flow

```text
Category Sold Out
       │
       ▼
Join Waitlist
       │
       ▼
WAITING
       │
       │ Seat Becomes Available
       ▼
OFFERED
       │
       ├──────────────► User Completes Booking
       │                       │
       │                       ▼
       │                   FULFILLED
       │
       └──────────────► 2 Hours Expired
                               │
                               ▼
                           EXPIRED
                               │
                               ▼
                     Next Waitlist User
```

### Automated Offer System

When seats become available:

1. The oldest waiting user is selected.
2. Their waitlist status becomes `OFFERED`.
3. A two-hour expiration window is created.
4. An email containing a secure checkout link is sent.
5. If the user does not complete checkout:

   * the offer expires;
   * the system moves to the next user;
   * a new offer is generated.

This creates a practical automated queue-management mechanism.

---

# 📧 Email Ticket Delivery

After a successful booking, the system generates a digital ticket and sends it through email.

The application uses:

* **Nodemailer**
* **SMTP**
* **QR Code generation**

The ticket can also be accessed from the user's booking history.

---

# 📱 QR Code Ticketing

Every successful booking can have an associated QR code.

```text
Successful Booking
        │
        ▼
 Generate QR Code
        │
        ├──────────► Booking History
        │
        └──────────► Email Ticket
```

QR generation is handled using the `qrcode` package.

---

# 👥 Role-Based Architecture

The application supports multiple user roles.

## 👤 CUSTOMER

Customers can:

* Register
* Login
* Browse events
* View event details
* View seat availability
* Hold seats
* Book tickets
* View booking history
* Cancel bookings
* Join waitlists
* Complete waitlist offers
* Receive digital tickets

---

## 🎤 ORGANISER

Organisers receive a dedicated dashboard containing event-level statistics such as:

* Total bookings
* Revenue
* Seat occupancy
* Event performance

---

## 🛡️ ADMIN

Administrators have global-level access and can manage the broader ticketing ecosystem.

The Prisma data model also supports venue administration and event ownership.

---

# 🎨 User Interface

The application uses a modern **dark glassmorphic design system**.

### UI Characteristics

* 🌑 Dark-themed interface
* 🪟 Glassmorphic cards
* ✨ Smooth interactive states
* 🎟️ Interactive seat map
* 📱 Responsive layouts
* 🎞️ Framer Motion animations
* 🎨 Tailwind CSS styling
* 🧩 Reusable React components

The seat map dynamically communicates seat availability and category information to make the booking experience intuitive.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       Client        │
                         │  Next.js / React    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    App Router       │
                         │   Pages + APIs      │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
          │    Auth     │    │   Booking   │    │   Events    │
          │    APIs     │    │    APIs     │    │    APIs     │
          └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │       Prisma        │
                         │   Transaction ORM   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Database       │
                         │ SQLite / PostgreSQL │
                         └─────────────────────┘

                 ┌─────────────────────────────────┐
                 │ External Services               │
                 │                                 │
                 │ Nodemailer → Email Delivery     │
                 │ QRCode     → Digital Tickets    │
                 └─────────────────────────────────┘
```

---

# 🧩 Project Architecture

```text
Ticket-Booking/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db
│
├── public/
│   └── static assets
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── cron/
│   │   │   ├── events/
│   │   │   └── organiser/
│   │   │
│   │   ├── event/
│   │   ├── history/
│   │   ├── login/
│   │   ├── organiser/
│   │   ├── register/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   └── components/
│       └── reusable React components
│
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── eslint.config.mjs
├── System_Design.md
└── README.md
```

---

# 🛠️ Tech Stack

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Frontend          | React 19                                           |
| Framework         | Next.js 16 App Router                              |
| Language          | TypeScript                                         |
| Styling           | Tailwind CSS 4                                     |
| UI Animation      | Framer Motion                                      |
| Icons             | Lucide React                                       |
| ORM               | Prisma 6                                           |
| Database          | SQLite / PostgreSQL-compatible Prisma architecture |
| Authentication    | JWT                                                |
| Password Security | bcryptjs                                           |
| Validation        | Zod                                                |
| Email             | Nodemailer                                         |
| QR Tickets        | qrcode                                             |
| Date Handling     | date-fns                                           |
| Runtime           | Node.js                                            |

---

# 🔑 Authentication

The application implements custom JWT-based authentication.

### Authentication Flow

```text
Registration
     │
     ▼
Password Hashing
     │
     ▼
User Stored in Database
     │
     ▼
Login
     │
     ▼
Credentials Verified
     │
     ▼
JWT Generated
     │
     ▼
Authenticated API Requests
```

Passwords are never stored directly in plaintext.

The application uses `bcryptjs` for password hashing and JWT-based session authentication.

---

# 🗃️ Database Model

The application uses Prisma ORM with the following primary entities:

```text
User
 │
 ├── Bookings
 ├── Waitlists
 ├── Venues
 └── Events

Venue
 │
 └── Events
      │
      ├── Event Seats
      ├── Bookings
      ├── Waitlists
      └── Category Pricing

Booking
 │
 └── Event Seats

Waitlist
 │
 └── Customer + Event + Category
```

### Core Models

* `User`
* `Venue`
* `Event`
* `EventCategoryPrice`
* `EventSeat`
* `Booking`
* `Waitlist`

---

# 🔌 API Architecture

The application follows a modular REST-style API structure.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Events

```text
GET  /api/events
GET  /api/events/:id
GET  /api/events/:id/seats
POST /api/events/:id/hold
POST /api/events/:id/book
POST /api/events/:id/waitlist
POST /api/events/:id/waitlist-book
```

### Bookings

```text
GET  /api/bookings
POST /api/bookings
POST /api/bookings/:id/cancel
```

### Waitlist Automation

```text
POST /api/cron/waitlist
```

### Organiser

```text
GET /api/organiser/stats
```

---

# 🧠 Engineering Decisions

## 1. Database-Level Concurrency Control

Seat availability is not trusted solely at the frontend.

The database performs the final availability check through atomic updates.

This is critical because:

```text
Frontend validation ≠ concurrency protection
```

Multiple clients may submit requests simultaneously.

The database transaction therefore becomes the final authority.

---

## 2. Lazy TTL Cleanup

Instead of continuously checking every held seat, expired holds are released when relevant seat availability is requested.

This reduces unnecessary background processing while maintaining accurate availability.

---

## 3. Queue-Based Waitlist Allocation

Waitlist allocation uses chronological ordering so users receive offers based on when they joined the queue.

This creates predictable and fair ticket allocation.

---

## 4. Role-Based Access

Different application capabilities are separated by user roles:

```text
CUSTOMER
   │
   ├── Browse
   ├── Book
   ├── Cancel
   └── Waitlist

ORGANISER
   │
   └── Event Analytics

ADMIN
   │
   └── Global Management
```

---

# 📂 Important Project Files

| File                                             | Purpose                             |
| ------------------------------------------------ | ----------------------------------- |
| `prisma/schema.prisma`                           | Database schema                     |
| `prisma/seed.ts`                                 | Initial database seed               |
| `src/app/page.tsx`                               | Main application page               |
| `src/app/event/[id]/page.tsx`                    | Event and seat booking interface    |
| `src/app/history/page.tsx`                       | Booking history                     |
| `src/app/organiser/page.tsx`                     | Organiser dashboard                 |
| `src/app/api/events/[id]/hold/route.ts`          | Seat hold logic                     |
| `src/app/api/events/[id]/book/route.ts`          | Booking logic                       |
| `src/app/api/events/[id]/waitlist/route.ts`      | Waitlist management                 |
| `src/app/api/events/[id]/waitlist-book/route.ts` | Waitlist checkout                   |
| `src/app/api/cron/waitlist/route.ts`             | Waitlist expiration automation      |
| `System_Design.md`                               | Detailed architecture documentation |

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

Verify:

```bash
node --version
npm --version
git --version
```

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/ticket-booking.git
cd ticket-booking
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

Add the appropriate SMTP configuration if email delivery is required.

> ⚠️ Never commit `.env` files or production secrets to GitHub.

---

## 4️⃣ Generate Prisma Client

```bash
npx prisma generate
```

---

## 5️⃣ Initialize the Database

```bash
npx prisma db push
```

---

## 6️⃣ Seed Sample Data

```bash
npx tsx prisma/seed.ts
```

The seed script creates sample users, venue data, event data, pricing, and seats.

---

## 7️⃣ Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Demo Accounts

The seed configuration provides sample accounts for testing.

| Role         | Email                      | Password       |
| ------------ | -------------------------- | -------------- |
| 👑 Admin     | `admin@unthinkable.co`     | `admin123`     |
| 🎤 Organiser | `organiser@unthinkable.co` | `organiser123` |
| 👤 Customer  | `customer@unthinkable.co`  | `customer123`  |

> These credentials are intended only for local development/testing. Never use default credentials in production.

---

# 📊 Booking Lifecycle

```text
                 ┌──────────────┐
                 │    Browse    │
                 │    Events    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ Select Seats │
                 └──────┬───────┘
                        │
                        ▼
                ┌────────────────┐
                │ Atomic Seat Hold│
                └───────┬────────┘
                        │
                ┌───────┴────────┐
                │                │
                ▼                ▼
          Checkout OK      Hold Expires
                │                │
                ▼                ▼
            BOOKED          AVAILABLE
                │
                ▼
          QR Ticket Created
                │
                ▼
          Email Delivered
```

---

# 🔄 Cancellation & Waitlist Lifecycle

```text
       Booking Cancelled
               │
               ▼
        Seats Released
               │
               ▼
      Check Waitlist Queue
               │
               ▼
      Oldest WAITING User
               │
               ▼
            OFFERED
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    Booked        2 Hours Expire
        │             │
        ▼             ▼
   FULFILLED       EXPIRED
                      │
                      ▼
               Next User
```

---

# 🛡️ Validation & Reliability

The backend uses **Zod** for request validation.

The application also separates:

* Authentication
* Authorization
* Validation
* Database operations
* API routes
* UI components

This helps keep the application modular and easier to maintain.

---

# 📈 Scalability Considerations

The architecture is designed with several production-oriented principles:

### Database Transactions

Critical booking operations are transaction-based.

### Atomic Updates

Seat acquisition uses atomic database operations.

### Stateless Authentication

JWT authentication reduces server-side session dependency.

### Modular API Routes

Business operations are separated into independent endpoints.

### PostgreSQL Migration Path

Although the included development configuration uses SQLite for easy local setup, Prisma provides a straightforward path toward PostgreSQL for production workloads.

### Background Automation

Waitlist expiration is exposed through a dedicated cron endpoint, allowing deployment platforms or external schedulers to trigger the process.

---

# 🔮 Future Improvements

Potential production enhancements include:

* [ ] Redis-based distributed seat locking
* [ ] PostgreSQL deployment
* [ ] Payment gateway integration
* [ ] Real-time seat availability using WebSockets
* [ ] Redis caching
* [ ] Distributed job queue
* [ ] Advanced admin dashboard
* [ ] Ticket PDF generation
* [ ] QR ticket verification endpoint
* [ ] Google / GitHub OAuth
* [ ] Rate limiting
* [ ] Automated integration testing
* [ ] Docker containerization
* [ ] CI/CD pipeline
* [ ] Production observability and monitoring

---

# 🧪 Available Scripts

```bash
# Start development server
npm run dev

# Create production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

---

# 📚 Documentation

Detailed architectural decisions and concurrency mechanisms are documented separately in:

```text
System_Design.md
```

The document covers:

* Concurrency protection
* Atomic seat reservation
* TTL-based seat holds
* Waitlist architecture
* Frontend architecture
* Seat lifecycle

---

# 🔒 Security Considerations

For production deployment, the following should be configured:

* Strong randomly generated JWT secrets
* Secure environment variables
* Production database credentials
* HTTPS
* Secure cookies/tokens
* Rate limiting
* Input validation
* Proper CORS configuration
* Production SMTP credentials
* Removal of development credentials
* Database backups
* Application monitoring

---

# 💡 What This Project Demonstrates

This project demonstrates practical full-stack engineering concepts including:

```text
Frontend Engineering
        +
Backend API Design
        +
Database Modeling
        +
Transaction Management
        +
Concurrency Control
        +
Authentication
        +
Authorization
        +
Queue Management
        +
Email Automation
        +
QR Ticket Generation
        +
Responsive UI
```

It is designed to demonstrate how a real-world ticketing platform can handle the difficult parts of booking systems—not just the UI.

---

# 👨‍💻 Author

## Ayush M Singh

**Computer Science & Engineering (Data Science)**

Passionate about:

* Full-Stack Development
* Data Science
* Artificial Intelligence & Machine Learning
* Backend Engineering
* System Design
* Problem Solving

<p align="center">
  <strong>Built with TypeScript, Next.js, Prisma & a focus on reliable backend engineering.</strong>
</p>

---

# ⭐ Support

If you find this project useful or interesting:

⭐ **Star the repository**

🍴 **Fork the project**

💬 **Share feedback**

---

<p align="center">
  <sub>© 2026 Ayush M Singh. Built for learning, engineering practice, and demonstration of production-oriented software design.</sub>
</p>
