
# EzyFix: Small Fixes. Big Help.

**Team Echo** · Track: Civic & Local Problems
Gautam Kishor · Adhil Muhammed M · Liya Roy · Jeswin Jose

## Problem Statement

Finding a reliable local plumber, electrician, carpenter or painter is a gamble.

- Star ratings come from strangers, so five stars from someone you will never meet says very little about who to trust.
- Word of mouth works, but it doesn't scale. A neighbor may never have needed an electrician, and then you are searching cold.
- A bad hire is expensive twice: you pay again to fix botched work, on top of the time and money already lost.

Existing directory apps rely on anonymous ratings, and paying advertisers can rank higher. People need a way to see who is actually trusted and actually skilled.

## Project Description

EzyFix is a mobile-first web app where people find local service professionals and see two separate, easy-to-read signals on every profile:

- **Trust** comes from vouches by real neighbors, each with their name, area and written feedback. Levels are New (0 vouches), Community Vouched (1-2) and Highly Trusted (3+).
- **Skill** comes from qualifications the pro adds: professional certifications, ITI or diploma, trade licences, training courses and work references. An admin reviews each one, and only approved proofs count. Levels are New, Skilled and Expert.

**How it works**

1. **Log in with Aadhaar verification.** Every user verifies their identity with an OTP. Only a hash and the last 4 digits are kept, never the full number. The OTP is a mock in this prototype.
2. **Find a pro.** Filter by service, area, trust badge, minimum skill level and "Available now", and sort by Best match, Most trusted or Most skilled.
3. **Open the profile.** See skills, qualifications and vouches with feedback, and a "Why this rank" breakdown for full transparency.
4. **Call, then vouch.** Contacting a pro is logged. Only a verified user who has contacted a pro can leave a vouch, one per verified identity, and self-vouching is blocked.
5. **Pros grow their profile.** A pro adds qualifications (pending until an admin approves them) and can start the **Pro plan** (mock subscription, no real payment).
6. **Pro plan.** Only Pro pros are ranked and listed first, and show all vouches with feedback. Free pros are listed but not ranked and show only their latest vouch. Pro never changes Trust or Skill levels, which can only be earned.

**What makes it useful**

- No star ratings anywhere. Trust comes from named neighbors.
- Badges are earned, never bought.
- New pros with proof of skill still get discovered.
- The ranking rules are visible in a "How ranking works" sheet.

---

## Google AI Usage

### Tools / Models Used

- Google Antigravity IDE (agent-driven development)
- [Gemini model used inside Antigravity, e.g. Gemini 3 Pro. Add the exact model name from your Antigravity settings]

## Tech Stack used

- React 18 + Vite (JavaScript, JSX)
- Tailwind CSS
- React Router
- lucide-react (icons)
- Vitest (unit and repo tests, jsdom)
- localStorage data layer behind a repo interface (Supabase implementation planned)
- Google Fonts: Lora and Inter

### How Google AI Was Used

We built EzyFix with Google Antigravity's agent. We wrote a full product spec (`SPEC.md`) and split the work into small "bricks", each with a prompt, a file boundary and a "done when" checklist (see `ANTIGRAVITY-PROMPTS.md`). For every brick, the Antigravity agent planned the change, wrote the code and the tests, and ran `npm run test` and `npm run build`. Domain rules such as trust levels, skill levels, ranking and the Pro plan are pure, unit-tested functions, so the agent's output was checked against the spec each time.


---

### GitHub repo link of the project

[Link of the github repository](https://github.com/AdhilMuhammedM/EzyFix.git)

## Proof of Google AI Usage

Screenshots of Antigravity agent sessions, prompts and plans are in the `/proofs` folder.

## Screenshots

Add project screenshots in `/screenshots` folder. Suggested set:

| Screen | File |
| --- | --- |
| Login with Aadhaar verification | `screenshots/01-login.png` |
| Find page with ranked and "Not ranked" pros | `screenshots/02-find.png` |
| Pro profile with vouches and "Why this rank" | `screenshots/03-profile.png` |
| Manage page (qualifications and plan) | `screenshots/04-manage.png` |
| Plans page (Free vs Pro) | `screenshots/05-plans.png` |
| Admin review of qualifications | `screenshots/06-admin.png` |

---

## Demo Video

Upload your demo video to Google Drive and paste the shareable link here (max 3 minutes). [Watch Demo](C:\Users\adhil\OneDrive\Desktop)

---


Open the local URL shown in the terminal. Use your browser's mobile view (390px wide) for the intended layout.

**Other commands**

```bash
npm run test    # unit tests for scoring, ranking, vouch rules and the repo
npm run build   # production build
```

**Demo notes**

- The app seeds 12 sample pros on first load. To restore them, go to Admin, then Reset demo data.
- Aadhaar login uses a mock OTP: [state the demo Aadhaar number and OTP here]. No real identity data is collected.
- The Pro subscription is a demo, and no payment is taken.
- Admin passcode is the value of `VITE_ADMIN_PASSCODE` in your `.env`. It is a demo gate, not real security.
- Try the pro flow with **Jomon Thomas**: [phone] with manage code `DEMO01`.
````

