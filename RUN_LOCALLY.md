# PulseLink - Run Locally (Free, No Antigravity Needed)

## Prerequisites
Install Node.js (v18 or newer) from https://nodejs.org — free, 2 min install.

## Steps (copy-paste each line into Terminal/Command Prompt, inside this project folder)

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Then open: http://localhost:3000

New: an Emergency Live Map lives at http://localhost:3000/map (also in the sidebar).

## If any step shows an error
Copy the FULL error text and share it — do not retry blindly.

Common fixes:
- "port 3000 already in use" -> close other apps or run: npm run dev -- -p 3001
- prisma generate network error -> just retry once, needs internet for first-time setup only
- "command not found: npx" -> Node.js not installed correctly, reinstall from nodejs.org

## Note on the database
Schema changed in this update (new Hospital table, lat/lng fields on Ambulance
and EmergencyRequest). If you already had a dev.db from before, `prisma migrate dev`
will prompt to reset it — that's expected and fine, `npm run seed` repopulates
everything including the new hospitals and coordinates.
