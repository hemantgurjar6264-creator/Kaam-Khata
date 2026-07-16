# Kaam Khata — Digital Income & Employment Verification for India's Informal Workforce

**Theme:** Rozgaar (रोज़गार) — Work, Income & Economic Dignity

## The Problem

India has 450M+ informal workers — daily-wage labourers, domestic help, construction
workers, gig workers. Almost none of them have a formal record of the work they do.
That invisible gap has three real consequences:

- Banks decline loans because there's no income proof.
- Employers can deny payment in a dispute because the worker has no evidence of work done.
- Workers can't show an employment history for scheme eligibility (e.g. e-Shram) or for a
  new employer.

Most existing apps in this space (Apna, Urban Company, etc.) solve **job discovery**, not
**proof and trust**. Kaam Khata targets that second, mostly unaddressed gap.

## The Solution

A worker logs a day's work in under a minute — date, hours, employer's phone number, and
an optional photo or voice note. The app generates a **WhatsApp confirmation link** the
employer can open and tap "confirm" on — no app install required on their end. Confirmed
entries build a cumulative, verifiable **work history**, summarised into a shareable
**Proof Card** with a simple, explainable credit-readiness score — usable for micro-loans,
scheme applications, or showing a new employer a track record.

## Demo Flow (for judges)

1. Open `/` — read the problem, click **"Aaj ka kaam log karo"**.
2. Fill the work-log form (a few sample entries are pre-seeded so the dashboard isn't empty).
3. On submit, click **"WhatsApp par bhejo"** — this opens a real `wa.me` link pre-filled
   with a message containing the confirmation link.
4. Open that confirmation link (simulating the employer) at `/confirm/:id` and tap
   **"Haan, sahi hai"** — the entry stamps as Confirmed.
5. Go to `/dashboard` to see the updated ledger and credit-readiness score.
6. Go to `/proof` and click **"Proof Card download / print karo"** to generate a
   passbook-style PDF via the browser print dialog.

## Tech Stack

- React 18 + Vite
- React Router v6
- Tailwind CSS
- lucide-react icons
- `localStorage` as a stand-in data layer (see note below)

## Important demo note

This prototype uses `localStorage` instead of a real backend so it can be deployed as a
static site with zero infrastructure for the hackathon. That means the "employer confirms"
step only works in the **same browser** the entry was created in. In production this would
be:

- A real backend (Node/Express or similar) + database (Postgres/Firestore) for entries.
- The WhatsApp message sent via the **Twilio WhatsApp Business API** instead of a `wa.me`
  deep link, so the confirmation works across devices.
- Real auth (OTP-based, given the audience) instead of the single mock worker profile.

## Run locally

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
```

This outputs a static `dist/` folder — deploy it directly to Vercel, Netlify, or GitHub
Pages. No environment variables or backend are required for the demo build.

## Roadmap

- e-Shram card integration for direct scheme-eligibility checks.
- Partnerships with micro-lenders (e.g. Kaleidofin, Avanti Finance) to accept the Proof Card.
- Multilingual voice-first logging for additional regional languages.
- Real OTP auth and a backend with audit-safe entry history.
