# Archery Competition Registration App – Plan for Claude Code

## Overview

A Next.js app where users register for an archery competition through an AI-powered chat interface. Claude acts as a friendly Finnish-speaking registration assistant that collects participant info conversationally, recommends the right competition class, and provides payment and directions info.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **AI**: Anthropic Messages API via a secure backend route
- **Storage**: Google Sheets via `googleapis` package — stores registrations and tracks seats per class
- **Email**: Resend (`npm install resend`) for confirmation and organizer notification emails
- **Hosting**: Vercel (free tier)

---

## Project Structure

```
/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── register/
│   │   └── page.tsx              # Chat page
│   └── api/
│       ├── chat/
│       │   └── route.ts          # Anthropic API proxy
│       └── submit/
│           └── route.ts          # Save/email registration data
├── components/
│   ├── LandingHero.tsx
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   └── TypingIndicator.tsx
├── lib/
│   ├── systemPrompt.ts           # Claude's system prompt with all event info
│   └── sheets.ts                 # Google Sheets API helper (read/write/seat check)
└── types/
    └── index.ts
```

---

## Pages

### Landing Page (`/`)
- Competition name, date, location displayed prominently
- Short description of the event
- Single **"Register"** button → navigates to `/register`
- Visual style: nature/forest theme, dark greens and browns, archery iconography

### Chat Page (`/register`)
- Chat window; Claude opens the conversation automatically
- User types replies, sends with Enter or a Send button
- Loading indicator while waiting for Claude's response
- Full message history visible throughout

---

## Backend – API Routes

### `POST /api/chat`
```ts
// Body:    { messages: { role: "user" | "assistant", content: string }[] }
// Returns: { reply: string }
// Uses:    ANTHROPIC_API_KEY from environment
// Model:   claude-sonnet-4-20250514
// Note:    Never expose the API key to the frontend
```

### `POST /api/submit`
```ts
// Body:    { name, birthYear, club, category, email, waitlist?: boolean, preferredCategory?: string }
// Action:  1. Check seat availability in Google Sheets
//          2. If full → return { error: "full", category }
//          3. If available → append row to Registrations sheet
//          4. Send confirmation email to participant (Resend)
//          5. Send notification email to organizer (Resend)
// Note:    No filesystem writes — Vercel serverless functions have no persistent disk

// WAITLIST case (waitlist: true):
//          1. Append row to Waitlist sheet (name, preferredCategory, email, timestamp)
//          2. Send waitlist confirmation email to participant
//          3. Send waitlist notification to organizer
```

### `GET /api/availability`
```ts
// Returns: { [category]: { max: number, registered: number, available: boolean } }
// Used by: Chat page to optionally show live seat counts
//          Claude can be told to check this before confirming a class
```

---

## System Prompt  (`lib/systemPrompt.ts`)

Fill in the bracketed values with real event details before running.

```
You are the registration assistant for [CLUB NAME].
You help archers sign up for [EVENT NAME], held on [DATE] at [VENUE, ADDRESS].
Always respond in Finnish. Use informal "sinä" address. Ask only one question at a time.
Be warm, enthusiastic, and knowledgeable about archery.

COMPETITION CATEGORIES & FEES:
- Recurve Men / Women (RMI / RNA): XX €
- Compound Men / Women (CMI / CNA): XX €
- Traditional / Longbow (PJ): XX €
- Junior (under 18, all styles): XX €
- Veteran (over 60, all styles): XX €

INFORMATION TO COLLECT (one at a time, in natural conversation):
1. First name and last name
2. Year of birth  (to verify junior/veteran eligibility)
3. Club name, or "no club"
4. Competition category  (always present the full list — see below)
5. Email address  (for confirmation)

CATEGORY SELECTION RULES:
When asking about category, always present the full list of available classes:

  1. Recurve Miehet (RMI)
  2. Recurve Naiset (RNA)
  3. Compound Miehet (CMI)
  4. Compound Naiset (CNA)
  5. Perinnejousi / Longbow (PJ)
  6. Juniori – alle 18 v, kaikki jousityypit (JUN)
  7. Veteraani – yli 60 v, kaikki jousityypit (VET)

Note: these are the only available classes at this event — not all IFAA classes are offered.
Based on birth year, highlight the relevant junior or veteran option if applicable, but let the user make the final choice.

WHEN A CLASS IS FULL:
- Clearly tell the user that the chosen class is unfortunately full.
- Suggest the most suitable alternative class from the available list.
- Tell the user that their preferred class (the full one) and contact details will be noted on a waiting list, and that they will be contacted by email if a spot becomes available.
- Ask if they want to: (a) register for the suggested alternative class, or (b) be added to the waiting list for their preferred class only.
- If they choose the waiting list, collect their email and confirm they have been added — do NOT proceed with full registration or payment instructions.

PAYMENT INSTRUCTIONS:
Bank account: [IBAN]
Recipient:    [CLUB NAME]
Reference:    participant's name + category  (e.g. "Matti Virtanen Recurve")
Deadline:     [DATE]

DIRECTIONS TO VENUE:
Address: [FULL ADDRESS]
By car:  [DIRECTIONS + PARKING INFO]
By public transport: [DIRECTIONS]
GPS: [COORDINATES]

EVENT SCHEDULE:
- Registration desk opens: [TIME]
- Competition starts:      [TIME]
- Awards ceremony:         [TIME]

BEHAVIOR RULES:
- When all 5 data points are collected, present a clear summary and payment instructions.
- Do not make up any information not provided above.
- Always respond in Finnish, regardless of what language the user writes in.
```

---

## Data Flow

```
User types message
  → ChatWindow sends full message history to POST /api/chat
    → API route calls Anthropic with system prompt + history
      → Returns Claude's reply
        → ChatWindow appends reply and re-renders

When Claude signals registration is complete (detect keyword in reply):
  → Frontend extracts collected fields from conversation
  → Frontend POSTs fields to /api/submit

  NORMAL REGISTRATION PATH:
    → Check seat count for category in Google Sheets (Seats tab)
    → IF FULL:
        → Return { error: "full" }
        → Claude informs user, presents available class list, suggests alternative
        → Claude offers: (a) register for alternative, or (b) join waitlist for preferred class
    → IF AVAILABLE:
        → Append row to Registrations tab
        → Send confirmation email to participant (Resend)
        → Send notification email to organizer (Resend)
        → Return { success: true }

  WAITLIST PATH (user chose to join waitlist):
    → Append row to Waitlist tab (name, preferredCategory, email, timestamp)
    → Send waitlist confirmation email to participant
    → Send waitlist notification email to organizer
    → Return { success: true, waitlisted: true }
```

---

## Environment Variables (`.env.local`)

```
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
ORGANIZER_EMAIL=organizer@club.fi
FROM_EMAIL=ilmoittaudu@yourdomain.fi      # must be a domain verified in Resend

GOOGLE_SHEET_ID=1BxiMVs0XRA...            # from the sheet URL
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## Implementation Order

1. `npx create-next-app archery-registration --typescript --tailwind --app`
2. `npm install googleapis resend`
3. Set up Google Sheet (see Google Sheets Setup section below)
4. Write `lib/sheets.ts` — helper functions for reading seat counts and appending rows
5. Create `/api/chat/route.ts` and test Anthropic connection
6. Write `lib/systemPrompt.ts` with all event details filled in
7. Build `LandingHero` component with Register button
8. Build `ChatWindow` + `MessageBubble` + `TypingIndicator`
9. Wire chat page to `/api/chat`
10. Detect registration completion and POST to `/api/submit`
11. Implement seat check + Sheets write + Resend emails in `/api/submit`
12. Handle "class full" response back in the chat UI
13. Style with Tailwind (forest/nature theme)
14. Test full conversation flow end-to-end

---

## Google Sheets Setup

### Spreadsheet structure
Create one Google Sheet with three tabs:

**Tab 1: `Registrations`**
| Timestamp | Name | Birth Year | Club | Category | Email |
|-----------|------|------------|------|----------|-------|
| (filled automatically) | | | | | |

**Tab 2: `Seats`**
| Category | Max | Registered |
|----------|-----|------------|
| Recurve Men | 20 | `=COUNTIF(Registrations!E:E, "Recurve Men")` |
| Recurve Women | 20 | |
| Compound Men | 15 | |
| Compound Women | 15 | |
| Traditional/Longbow | 20 | |
| Junior | 10 | |
| Veteran | 10 | |

> Use `=COUNTIF(Registrations!E:E, A2)` pattern in each Registered cell for accurate per-class counts.

**Tab 3: `Waitlist`**
| Timestamp | Name | Preferred Category | Email |
|-----------|------|--------------------|-------|
| (filled automatically) | | | |

### Google Cloud service account setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API** under APIs & Services
4. Go to **Credentials** → Create Credentials → **Service Account**
5. Download the JSON key file
6. Copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` env var
7. Copy `private_key` → `GOOGLE_PRIVATE_KEY` env var (keep the `\n` newlines)
8. **Share the Google Sheet** with the service account email (Editor access)
9. Copy the Sheet ID from the URL → `GOOGLE_SHEET_ID` env var

### `lib/sheets.ts` — key functions
```ts
import { google } from 'googleapis';

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });

// Check if seats are available for a category
export async function checkAvailability(category: string): Promise<boolean> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Seats!A:C',
  });
  const row = res.data.values?.find(r => r[0] === category);
  if (!row) return false;
  return parseInt(row[2]) < parseInt(row[1]);
}

// Append a new registration row
export async function appendRegistration(data: Registration): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Registrations!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString(), data.name, data.birthYear, data.club, data.category, data.email]]
    }
  });
}

// Append a waitlist entry
export async function appendWaitlist(data: { name: string; preferredCategory: string; email: string }): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Waitlist!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[new Date().toISOString(), data.name, data.preferredCategory, data.email]]
    }
  });
}
```

---



### One-time setup
1. Push the project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import the GitHub repo
3. Vercel auto-detects Next.js — no build config needed
4. Add environment variables in Vercel dashboard under **Settings → Environment Variables**:

```
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
ORGANIZER_EMAIL=organizer@club.fi
FROM_EMAIL=ilmoittaudu@yourdomain.fi
GOOGLE_SHEET_ID=1BxiMVs0XRA...
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

5. Click **Deploy** — the app is live at `https://archery-registration.vercel.app`

### Resend setup
1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your domain under **Domains** (adds a DNS TXT record — takes a few minutes)
3. Create an API key under **API Keys** → copy it to Vercel env vars as `RESEND_API_KEY`
4. Alternatively, use the **Vercel + Resend integration**: Vercel dashboard → Integrations → Resend → Connect. This auto-injects `RESEND_API_KEY` into your environment.

### Usage in `/api/submit/route.ts`
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Confirmation to participant
await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: participantEmail,
  subject: 'Ilmoittautuminen vastaanotettu – [EVENT NAME]',
  html: `<p>Hei ${name}, ilmoittautumisesi on vastaanotettu! ...</p>`
});

// Notification to organizer
await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: process.env.ORGANIZER_EMAIL,
  subject: `Uusi ilmoittautuminen: ${name} – ${category}`,
  html: `<p>Nimi: ${name}<br>Luokka: ${category}<br>Seura: ${club}<br>Email: ${participantEmail}</p>`
});
```

### Continuous deployment
Every `git push` to the `main` branch automatically triggers a new Vercel deployment.
Use feature branches for changes — Vercel creates a preview URL for each pull request.

### Custom domain (optional)
In Vercel dashboard → **Settings → Domains** → add your domain (e.g. `ilmoittaudu.seura.fi`).
Update your DNS with the CNAME record Vercel provides.

---

## Key Notes for Claude Code

- The system prompt must contain **all** event information — Claude has no other data source
- The API key must only live in the backend route, never in client-side code
- Keep the full conversation history in React state and send it with every request (Claude has no memory between calls)
- The chat language is **Finnish** — enforce this in the system prompt, not in the frontend
- **No filesystem writes** — Vercel serverless functions are stateless; Google Sheets is the only persistence layer
- Vercel has a **10-second timeout** on serverless functions by default; set `export const maxDuration = 30` in API route files to be safe
- **Google Sheets race condition**: two simultaneous submissions could both pass the seat check before either writes. For a small competition this is an acceptable risk, but if needed, add a double-check after writing (read back the count and send a "waitlist" email if over limit)
- The `GOOGLE_PRIVATE_KEY` env var must preserve literal `\n` characters — in Vercel dashboard paste the raw key including newlines, Vercel handles escaping automatically
