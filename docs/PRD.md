# Event System: Product Requirements Document

Status: Draft v0.1 · Date: 2026-11-07

## 1. Overview

A web platform where an admin creates and publishes events (public or private, free or paid). Visitors browse public events, register or buy tickets, and use a live support widget on the landing page to ask questions. The admin answers those questions from an inbox in the dashboard.

## Decisions (confirmed 2026-11-07)

- **One admin** only, so there is no roles system.
- **No attendee accounts.** Visitors register with name and email only.
- **USD only.**
- **One price per event.** There are no ticket tiers.
- **No payment routing for now.** The price is stored and shown, but there is no online checkout in v1. Visitors register and the admin tracks payment status manually. Paystack/Stripe integration is deferred to a later phase (the sections below keep it as a future option).
- Private-event access is still open. The working default is an unguessable link plus an optional access code.

## 2. Goals

1. Let the admin create, edit, publish and cancel events with minimal friction.
2. Support public events (listed) and private events (hidden, accessible only via invite link or code).
3. Let attendees pay for tickets online.
4. Give visitors instant, low-friction support through a chat widget answered by the admin.
5. Ship a polished, on-brand experience that works well on mobile.

Non-goals (v1): multi-organizer marketplace, native mobile apps, seating charts, refunds automation, multi-language, AI auto-replies.

## 3. Users

| Role | Description |
|---|---|
| Admin | Single operator (expandable to a few). Manages events, attendees, orders and support chat. |
| Visitor / Attendee | Browses events, registers or buys tickets, chats with support. No account required for v1 (email at checkout). |

## 4. Core features

### 4.1 Event management (Admin)
- Create / edit / delete / duplicate events.
- Fields: title, slug, description (rich text), cover image, gallery (optional), category, start and end date/time, timezone, venue or online link, capacity, status (draft, published, cancelled, past).
- **Visibility**: `public` (listed on site and searchable) or `private` (not listed; reachable via unguessable URL, optionally plus an access code).
- **Pricing**: free, or a single price (v1) with currency. Optional extension: multiple ticket tiers (e.g. Regular, VIP) with separate prices and quantities.
- Capacity limit with "sold out" state; optional registration deadline.
- Attendee list per event with search and CSV export.
- Private events: generate/regenerate invite link, optionally an access code, and send/copy invites.

### 4.2 Public site (Visitor)
- Landing page: hero, featured/upcoming public events, how it works, FAQ, footer, support widget.
- Events listing with filters (date, category, price: free/paid) and search.
- Event detail page: info, price, remaining spots, register/buy CTA, share.
- Private event page: accessible only by link (and code if set); shows `noindex`.
- Registration (v1): name, email, phone, quantity. No online payment. For paid events, the confirmation page shows the USD price and "payment pending" status, and the admin contacts the attendee or marks them paid manually. Free events are confirmed instantly.
- Confirmation page and email with ticket (QR code) and event details. For paid events the ticket is issued when the admin marks the registration as paid (or immediately, with a "payment pending" label, if the admin prefers).
- Future phase: online checkout via a payment provider.

### 4.3 Support chat widget
- Floating button on landing page (and optionally all public pages) that opens a chat panel.
- First open: visitor enters name and email (optional first message); an anonymous session is stored in a cookie so the conversation resumes on return.
- Realtime messaging both ways, typing indicator, timestamps, delivery/read state.
- Optional pre-set quick questions (e.g. "How do I get my ticket?", "Is this event private?").
- Offline state: when admin is away, show expected response time and capture email so replies are also sent by email.
- Admin inbox in dashboard: list of conversations (unread badge, last message, status open/resolved), full thread view, reply, resolve/reopen, visitor details, link to related event/order if known.
- Notifications to admin for new messages (in-app sound/badge; email fallback).
- Rate limiting and basic spam protection (honeypot/captcha, message length cap).

### 4.4 Registrations and payment tracking
- Registration record per sign-up: attendee, event, quantity, amount due (USD), status (registered, payment pending, paid, cancelled).
- Admin marks a registration as paid manually (with optional note, e.g. "bank transfer").
- Admin registrations view with filters and CSV export.
- Out of scope for v1: payment gateway, webhooks, automated refunds.

### 4.5 Admin dashboard
- Overview: upcoming events, tickets sold, revenue, unread chats.
- Sections: Events, Attendees/Orders, Support Inbox, Settings (profile, payment keys, email templates, brand info).
- Secure login (email + password with session; 2FA is a later enhancement).

### 4.6 Ticket check-in (stretch)
- QR code on ticket; admin scans or enters code to mark attendee as checked in.

## 5. Key user flows

1. **Admin creates event**: Dashboard, New event, fill details, choose public/private, set price, save as draft or publish, copy link.
2. **Visitor buys ticket**: Landing, event, Buy, details, Paystack, webhook confirms, email with QR ticket.
3. **Private event access**: Admin shares link, visitor opens it (enters code if required), registers/pays.
4. **Support chat**: Visitor opens widget, enters name/email, sends message, admin sees it in inbox in realtime, replies, visitor sees reply live (or by email if gone).

## 6. Data model (draft)

- `User` (admin): id, email, passwordHash, role
- `Event`: id, title, slug, description, coverImage, startsAt, endsAt, timezone, location, isOnline, visibility, accessCode?, priceUsd (0 = free), capacity, status, createdBy
- `Registration`: id, eventId, name, email, phone, quantity, amountUsd, status, paymentNote?, createdAt
- `Ticket`: id, registrationId, code (QR), checkedInAt?
- `ChatConversation`: id, visitorName, visitorEmail, sessionToken, status, lastMessageAt, adminUnread, visitorUnread
- `ChatMessage`: id, conversationId, sender (visitor/admin), body, createdAt, readAt?

## 7. Proposed tech (to be confirmed)

- Frontend + backend: Next.js (App Router) + TypeScript, Tailwind CSS
- Database: PostgreSQL (e.g. Neon) with Prisma or Drizzle
- Auth: Auth.js or Auth0 for admin
- Realtime chat: WebSockets via a managed service (Pusher/Ably) or SSE + polling fallback
- Payments: none in v1 (provider to be chosen later)
- Email: Resend or similar
- File storage: Cloudinary or S3-compatible for event images
- Hosting: Vercel

## 8. Design direction

Brand palette:

| Token | Hex | Use |
|---|---|---|
| Background / surface | `#f4eff0` | Page background, cards on dark |
| Primary (crimson) | `#b10f32` | Primary buttons, links, active states, key accents |
| Ink (near-black brown) | `#1e120f` | Text, dark sections, footer, admin sidebar |
| Accent (amber) | `#f7aa14` | Highlights, badges (e.g. "Paid", "Sold out soon"), chat unread dot, small emphasis |

Guidelines: crimson is the dominant action colour; amber used sparingly; ensure text contrast (white on `#b10f32` and `#1e120f` on `#f4eff0` both pass AA; do not use amber for text on the light background). Mobile-first, generous spacing, large event imagery. 
UI inspiration (client screenshot of a community browse page) sets these patterns:
- Warm, pale pink-grey page background with white, softly rounded cards and generous radii.
- Pill-shaped filter chips; the active chip gets a crimson label with a light crimson fill and border. Use this for event filters (All, Upcoming, Free, Paid, This week).
- Top navigation with text tabs (active tab in crimson), one solid crimson primary button, and a small gold badge pill. Use the amber pill for "Paid / $price" and "Sold out soon" tags.
- Left sidebar with icons in light circular backgrounds and plain labels. Use it for the admin dashboard (Events, Registrations, Support Inbox, Settings).
- Small red count badge on a nav item. Use it for unread chats.
- Grid / list view toggle for browsing, and a soft promo card in the sidebar.
- Light and dark mode toggle (dark theme built on `#1e120f`) is a nice-to-have.

## 9. Non-functional requirements

- Performance: landing page LCP under 2.5s on 4G; images optimized.
- Security: server-side validation, hashed passwords, CSRF protection, webhook signature checks, private events excluded from listings, sitemap and search indexing; chat input sanitized; rate limiting.
- Availability: chat messages never lost; failed sends retried.
- Accessibility: WCAG AA, keyboard-usable widget and forms.
- Privacy: collect minimum personal data; deletion on request.

## 10. Success metrics

- Time for admin to publish an event: under 3 minutes.
- Checkout completion rate on paid events.
- Median first-response time in support chat.
- Share of conversations resolved in-session.

## 11. Milestones

1. **M1 Foundations**: project setup, design tokens, auth, DB schema.
2. **M2 Events**: admin CRUD, public listing and detail pages, private link access.
3. **M3 Payments**: Paystack checkout, webhook, tickets and emails.
4. **M4 Support chat**: widget, realtime, admin inbox, email fallback.
5. **M5 Polish and launch**: dashboard analytics, QA, accessibility, deploy.

## 12. Open questions

1. Private events: link only, link plus access code, or an admin-approved invite list?
2. For paid events with no online payment, should tickets be issued immediately (labelled "payment pending") or only after the admin marks payment received?
3. When payments are added later, which provider (Stripe suits USD)?
4. Chat: should chat history be emailed to visitors?
5. Preferred stack, or is the proposed one acceptable?
6. Domain, logo and brand name?
