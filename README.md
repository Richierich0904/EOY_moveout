# Swap — a campus marketplace for boarding schools

Buy, sell and give away stuff with other students. Nothing ships, nothing gets thrown out in June.

Built to beat a generic Depop clone on the things only a campus marketplace can do:

| Feature | Why it matters here |
|---|---|
| **School-email sign-up** with real name, house and class year | Trust is free when everyone is a verified student. No anonymous usernames. |
| **Free pile** | Most end-of-year stuff is worth $0. Capturing it is what makes the app feel alive. |
| **Wanted board** | In a tiny market, demand-side posts drive half the trades. Sellers get pinged when they list a match. |
| **Fall handoff** | Leavers list in May, the item goes into summer storage, the buyer collects at move-in. Directly solves the end-of-year dump. |
| **Move-out mode** (bulk listing) | Ten items in two minutes during the one week everyone is packing. |
| **Textbooks by course code** | Search `MATH 301` and find exactly the book you need. |
| **Saved-search alerts** | Catching an item fast matters more than browsing when supply is lumpy. |
| **Price suggestions** | Based on what the same category actually sold for *on this campus*. |
| **Impact page** | Items and kilograms kept out of landfill. This is your pitch to the school for official endorsement. |
| **No payments, no shipping** | Meet at the dining hall, pay with cash or whatever app you both use. Keeps you out of the legal mess of holding minors' money. |

## Run it

```bash
npm install
npm run seed      # optional demo data; demo accounts use password "password123"
npm run dev       # http://localhost:3000
```

Copy `.env.example` to `.env.local` to set the school name, houses, allowed email domains and meetup spots.

While `SMTP_URL` is not set, the email verification code is printed to the server console **and shown on the verify page**, so you can try the whole flow locally. Before launch, set `SMTP_URL` and implement `sendVerifyEmail` in `src/actions/auth.ts` (nodemailer is the usual choice).

## Deploy

It's a single Node process with a SQLite file, so any small VPS, Fly.io, Railway or Render instance works:

```bash
npm run build && npm start
```

Set `DATA_DIR` to a persistent volume. Both the database (`app.db`) and uploaded photos live there. Back that folder up and you've backed up everything.

Serverless hosts (Vercel etc.) won't work as-is because the filesystem isn't persistent. If you need that, swap `src/lib/db.ts` for Postgres and `src/lib/upload.ts` for S3; nothing else touches storage directly.

## Code map

```
src/lib/config.ts     school settings, categories, impact weights
src/lib/db.ts         SQLite connection + schema (auto-created on first run)
src/lib/auth.ts       sessions, password hashing, email-domain check
src/lib/listings.ts   search/filter queries, price suggestion, impact stats
src/lib/social.ts     wanted posts, messaging, notifications, alert fan-out
src/lib/upload.ts     photo storage
src/actions/*.ts      server actions (all writes go through here)
src/app/**            pages
src/components/**     UI
scripts/seed.ts       demo data
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Launch playbook (the part that actually decides whether this wins)

1. Get the school to make it the official platform. Lead with the impact page.
2. Seed 100+ listings house by house *before* anyone else sees the link.
3. Launch in the first week of September or the last two weeks of May. Not February.
4. Put the link in the orientation packet and in every house group chat.
