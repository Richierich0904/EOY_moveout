# Le-SWAP — a campus marketplace for boarding schools

Buy, sell and give away stuff with other students. Nothing ships, nothing gets thrown out in June.

It is built for a school, which means it is built for minors. Only verified students can see anything, organisers can moderate everything, and the game side rewards real handoffs rather than clever tricks.

## What it does

| Feature | Why it matters here |
|---|---|
| **School-email sign-up** with real name, dorm and class year | Only student addresses on the school domain can join (last name, first initial, class year, for example `smithj27@mercersburg.edu`). The class year is read from the address and the typed last name must match it. A code is emailed to the address and expires after 15 minutes. |
| **Students only** | Visitors see a welcome page with no student information. Listings, profiles, rankings and photos all need a login. Search engines are told to stay out. |
| **Free pile** | Most end-of-year stuff is worth $0. Capturing it is what makes the app feel alive. |
| **Wanted board** | In a tiny market, demand-side posts drive half the trades. |
| **Fall handoff** | Leavers list in May, the item goes into summer storage, the buyer collects at move-in. |
| **Move-out mode** (bulk listing) | Ten items in two minutes during the one week everyone is packing. |
| **Textbooks by course code** | Search `MATH 301` and find exactly the book you need. |
| **Saved-search alerts** | Catching an item fast matters more than browsing when supply is lumpy. |
| **Impact page and dorm cup** | Items and kilograms kept out of landfill, by dorm. |
| **No payments, no shipping** | Students meet at a public spot on campus and pay each other in person. The site never holds money. |

### Keeping it safe

| Feature | How it works |
|---|---|
| **Rules and a not-allowed list** (`/rules`) | Students agree to them at sign-up. Posts that mention a not-allowed word (`BANNED_WORDS`) are held until an organiser approves them. |
| **Report** | On every listing, wanted post, chat and profile. Reports go to the organisers' queue. The other person isn't told who reported them. |
| **Block** | A blocked student can't message you, and you stop seeing each other's posts. |
| **Organisers** (`/admin`) | Emails in `ADMIN_EMAILS`. They work through reports, approve or reject held posts, remove listings, pause accounts, and can read any conversation. Students are told so in every chat, and every organiser action is written to a log. |
| **Photos** | Re-saved on upload, which strips hidden data such as GPS location and rejects files that aren't images. Deleted from disk when the listing or account goes. |
| **Help and privacy pages** (`/help`, `/privacy`) | Safety habits, who to talk to (`SAFETY_CONTACT_NAME`), and plain-words privacy. |
| **Account settings** | Change name, dorm and password, hide from the rankings, or delete the account and everything on it. |

### The fun layer

| Feature | How it works |
|---|---|
| **Points and rankings** | 3 points for a confirmed giveaway, 2 for a confirmed sale. Weekly, monthly and school-year tables, in school time. Ties share the prize. Students can hide themselves. |
| **Receipt confirmation** | A handoff only counts once the receiver taps "Yes, I received it". The receiver must be someone who messaged about the listing, and can say "I didn't get this" instead. |
| **Fair-play limits** | A handoff counts only if the listing has a photo, the same two students have fewer than 2 counted handoffs that month, and the seller has fewer than 5 that day. A confirmed handoff is locked. |
| **Credits and boosts** | Credits are earned (1 per counted handoff, ranking prizes, draw prizes, 3 as a welcome gift) and never bought, transferred or cashed out. A student spends 3 to boost one listing to the top of the shelves for 3 days. Boosted listings carry a "Boosted" tag, and sorting by price ignores boosts. |
| **Giveaway draw** (`/draw`) | Every 3 counted giveaways earns an entry. Free to enter, organisers set prizes and the deadline, winners are picked automatically. |
| **Badges** | Giver, Generous, Textbook hero, Summer saver and so on, from confirmed handoffs only. |

## Run it on your own computer

```bash
npm install
npm run reset     # wipe local data and add fresh demo data (password for demo accounts: password123)
npm run dev       # http://localhost:3000
```

Copy `.env.example` to `.env.local` to change settings. To try the organiser pages with the demo data, add `ADMIN_EMAILS=maya@demo.school`.

The demo accounts use `@demo.school` addresses and can only log in. To try signing up, use a student-shaped address such as `studentt27@mercersburg.edu` with the name "Test Student".

In development no email is sent. The sign-up code is shown on the verify page and printed in the terminal, and so are password-reset codes (terminal only).

To run the production build locally with demo data, set `DEMO_MODE=1` (a banner on every page says so):

```bash
npm run build
DEMO_MODE=1 ADMIN_EMAILS=maya@demo.school npm start
```

## Before real students use it

The school name, email domain, student address shape and time zone are already set for Mercersburg Academy. A production build (`npm start`) keeps **sign-up closed** until a mail service is set, and never shows codes on screen.

1. `ALLOWED_EMAIL_DOMAINS` and `STUDENT_EMAIL_PATTERN`: already `mercersburg.edu` and the student address shape. Change them only if the school's addresses change.
2. `SMTP_URL` and `MAIL_FROM`: a mail service to send the codes. Any SMTP provider works.
3. `ADMIN_EMAILS`: the organisers. At least one adult.
4. `SAFETY_CONTACT_NAME` and `SAFETY_CONTACT_EMAIL`: the adult students are pointed to.
5. `SCHOOL_NAME` and `SCHOOL_TZ`: already Mercersburg Academy and `America/New_York`.
6. `HANDOFF_SPOTS`: public places on campus. Never dorm rooms.
7. `DATA_DIR`: a persistent folder, backed up.
8. Serve it over HTTPS, and leave `DEMO_MODE` unset.
9. Have the school read `/rules`, `/help` and `/privacy` and adjust the wording in `src/app/{rules,help,privacy}/page.tsx` to match school policy.

## Deploy

It's a single Node process with a SQLite file, so any small VPS, Fly.io, Railway or Render instance works:

```bash
npm run build && npm start
```

Set `DATA_DIR` to a persistent volume. Both the database (`app.db`) and uploaded photos live there. Back that folder up and you've backed up everything.

Serverless hosts (Vercel etc.) won't work as-is because the filesystem isn't persistent. If you need that, swap `src/lib/db.ts` for Postgres and `src/lib/upload.ts` for S3; nothing else touches storage directly.

## Code map

```
src/middleware.ts       the login wall (first check; pages confirm with requireViewer)
src/lib/config.ts       school settings, limits, credit and fair-play numbers
src/lib/db.ts           SQLite connection + schema (auto-created and migrated on start)
src/lib/auth.ts         sessions, password hashing, who may see what
src/lib/student-email.ts  who may join: the student address shape, class year, last-name check
src/lib/mail.ts         sending codes by email
src/lib/time.ts         school time zone: weeks, months, deadlines, dates
src/lib/listings.ts     search/filter queries, boosts in the sort order, impact stats
src/lib/social.ts       wanted posts, messaging, notifications, alert fan-out
src/lib/game.ts         credits ledger, draw entries and draws, dorm cup
src/lib/progress.ts     points, rankings, shared prizes, streaks, badges
src/lib/moderation.ts   reports, blocks, held posts, paused accounts, organiser log
src/lib/upload.ts       photo cleaning and storage
src/lib/housekeeping.ts periodic chores: settle rankings, run due draws, clear old sessions
src/actions/*.ts        server actions (all writes go through here)
src/app/**              pages
src/components/**       UI
scripts/seed.ts         demo data
```

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Launch playbook

1. Get the school to make it the official platform. Lead with the safety section above and the impact page.
2. Agree who the organisers are and who reads reports each day.
3. Seed 100+ listings dorm by dorm *before* anyone else sees the link.
4. Launch in the first week of September or the last two weeks of May. Not February.
5. Put the link in the orientation packet and in every dorm group chat.
