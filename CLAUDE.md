# CLAUDE.md

The rules for StellaXafe's hospital demos: a website and an app per hospital,
built by StellaXafe Technologies Limited for Anthony.

**The rules of the Rhema app apply here too, word for word:**
`billiondollarprof/rhema`, file `CLAUDE.md` (how to talk to Anthony, he is in
charge, one task at a time, nothing is done until it has been used,
screenshots at phone and desktop widths, light and dark, no em dashes).
These lines only add what is particular to the demos. `AGENTS.md` points
here.

**The humanizer runs on every line a person reads** (Anthony, 2026-11-27:
"the humanizer should be a standard... every agent knows that they have to
read that humanizer"). It lives in the Rhema repository at
`.claude/skills/humanizer`. His voice wins over it.

## The demos

- **One folder per demo** in `sites/`: `<hospital>-web` (the website) and,
  later, `<hospital>-app` (the app). Plain files, no build step.
- **One Cloudflare Worker serves them all** (`src/worker.js`), on the
  StellaXafe Cloudflare account. The address picks the folder:
  `mascap-web.stellaxafe.com` serves `sites/mascap-web/`. A new hospital is a
  new folder plus its address in `wrangler.jsonc`.
- **No database, no secret, no backend** (Anthony, 2026-11-27: "we don't
  need a back end for this thing. This is demo."). Made up data only.
- **Every page is noindex** and the Worker adds `X-Robots-Tag: noindex`.
  Demos are for the hospital we pitch, not for Google.
- **Say it is a demo.** The footer says "Concept demo prepared for ... Not the
  official website". Sample videos say so when played. Photos are samples.
- **Real public facts only** for the hospital itself: its name, logo,
  addresses, phone numbers and its real public reviews, quoted as written.
  Never a real patient.

## Branches

`main` deploys (Cloudflare builds it on every push once the repository is
connected). Look at every change in a browser at phone and desktop widths,
and press every button, before it goes to `main`.
