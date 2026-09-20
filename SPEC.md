# EzyFix — build spec (prototype)

Small Fixes. Big Help. Team Echo.

This file is the source of truth. If code and this file disagree, this file wins. If something here is unclear, ask before guessing. Do not add features that are not in this file.

---

## 1. What we're building

A mobile-first web app where people find local service professionals (plumbers, electricians, carpenters, painters) using manual filters. Every pro shows two separate, easy-to-read signals:

- **Trust**: vouches from real customers, with written feedback and the voucher's name and area.
- **Skill**: verified qualifications the pro adds (professional certifications, ITI or diploma, trade licences, training courses, work references).

Pros are ranked by "Best match", which adds trust points and skill points. A new pro with 0 vouches can still rank well by adding verified qualifications.

No AI. No star ratings anywhere. No real payments. A mock Pro plan is in scope.

---

## 2. Scope

**In scope**
- Find pros with filters and sorting
- Pro profile page (details, qualifications, vouches with feedback)
- Pro sign-up and profile management (including adding qualifications)
- Admin screen to approve or reject qualifications and remove vouches
- Customer contact logging and the vouch flow
- Mock Pro plan (subscription, ranking priority, visibility controls)

**Out of scope (do not build)**
- AI features of any kind
- Real payments or external payment providers (a mock Pro plan is in scope)
- Real SMS or OTP verification
- Chat, maps, geolocation, push notifications
- Star ratings or numeric review scores
- Multi-language UI

---

## 3. Tech and structure

- React 18 + Vite, JavaScript (JSX, no TypeScript)
- Tailwind CSS using its official Vite setup
- React Router
- Vitest for unit tests (jsdom for repo tests)
- lucide-react for icons
- No other dependencies without asking first
- Data sits behind a repo interface (section 5.5). Default implementation uses localStorage. A Supabase implementation is optional and comes late.

```
src/
  main.jsx
  App.jsx
  lib/
    config.js          constants (services, areas, thresholds, labels, plans)
    scoring.js         pure functions: trust, skill, score, filter, sort, rank, plans
    validation.js      pure functions: form and vouch validation
  data/
    repo.js            exports the active repo (chosen by VITE_DATA_SOURCE)
    localRepo.js       localStorage implementation
    supabaseRepo.js    optional, later
    seed.js            demo dataset (section 10)
  components/          TrustChip, SkillChip, ProBadge, ProCard, FilterBar, VouchCard,
                       QualificationForm, VouchForm, WhyRankPanel, Toast, etc.
  pages/               Find, ProProfile, Join, Manage, Admin, Plans
tests/                 scoring, validation, repo
```

Rules for the structure:
- All scoring, filtering, sorting and validation logic lives in `src/lib/`. Components never do scoring math.
- Components never touch localStorage directly. They call repo functions only.
- All repo functions are `async`, so the Supabase swap needs no UI changes.
- Computed values (vouch count, levels, score, rank, isPro) are never stored.

---

## 4. Domain rules

All constants live in `src/lib/config.js`. Change them there only.

### 4.1 Lists
- `SERVICES`: Plumber, Electrician, Carpenter, Painter
- `AREAS`: Lake View, Market Road, Church Junction, Station Road
- `LANGUAGES`: Malayalam, English, Hindi, Tamil
- `VOUCH_TAGS`: On time, Fair price, Clean work, Good communication, Would hire again

### 4.2 Trust (from vouches)
Count only vouches with `status = active`, and count each distinct `voucherPhone` once.
Pro affects ranking and visibility only, never trust or skill levels.

| Vouches | Trust level | Label |
|---|---|---|
| 0 | 0 | New |
| 1 to 2 | 1 | Community vouched |
| 3 or more | 2 | Highly trusted |

### 4.3 Skill (from qualifications)
Only qualifications with `status = approved` count. Each qualification gives points by type, all set to 1 by default in `QUALIFICATION_TYPES`. `skillPoints` is capped at `MAX_SKILL_POINTS = 4`.
Pro affects ranking and visibility only, never trust or skill levels.

| Skill points | Skill level | Label |
|---|---|---|
| 0 | 0 | Starter |
| 1 | 1 | Skilled |
| 2 or more | 2 | Expert |

Qualification types (key: label):
- `professional_certification`: Professional certification
- `iti_diploma`: ITI, diploma or degree
- `trade_licence`: Trade licence
- `training_course`: Training course
- `work_reference`: Work reference

### 4.4 Best match
`score = trustLevel + skillLevel` (0 to 4).

Sort modes apply within the Pro group. Free group is always `fullName asc`.
Tiebreakers within the Pro group:
- `best`: score desc, then vouchCount desc, then skillPoints desc, then fullName asc
- `trust`: vouchCount desc, then skillPoints desc, then fullName asc
- `skill`: skillPoints desc, then vouchCount desc, then fullName asc

Default sort is `best`.

### 4.5 Filters
Search by name (contains, case-insensitive), service, area (matches `homeArea` or any of `areasServed`), trust badge, minimum skill level, and "Available now". Filters combine with AND. Filters live in the URL query string.

### 4.6 Rank
`rankOf(proId, list)` returns the 1-based position in a `best`-sorted list of Pro pros with the same service. It returns `null` for a Free pro. It is used in the pro's own dashboard.
`projectedRank(proId, list)` returns the 1-based rank the pro would have if they were Pro (used to encourage upgrade).

### 4.7 Plans
- Two plans: Free and Pro.
- A pro is Pro only while `proUntil` is in the future. Plan is never stored, it is computed: `isProActive(pro, now)`.
- Pro pros are ranked and listed first. Free pros are listed after them, unranked, sorted by `fullName asc`, in every sort mode.
- Free pros show only the `FREE_VISIBLE_VOUCHES` newest vouches (with feedback) on their public profile, plus the total vouch count and how many are hidden. Pro pros show all vouches. The pro's own Manage page and the Admin page always show everything.
- Trust level, skill level and score are calculated exactly as before, from all active vouches and approved qualifications, for both plans.

---

## 5. Data model

### 5.1 Pro
| Field | Notes |
|---|---|
| id | uuid |
| fullName | 2 to 60 chars |
| phone | **private**. Valid 10-digit Indian mobile (`^[6-9]\d{9}$`), unique across pros |
| service | one of SERVICES |
| homeArea | one of AREAS |
| areasServed | array of AREAS, must include homeArea |
| yearsExperience | integer 0 to 60 |
| languages | array of LANGUAGES, at least 1 |
| skills | array of free-text tags, max 6, each max 24 chars |
| bio | max 300 chars |
| visitCharge | optional number in rupees |
| availableNow | boolean |
| manageCode | **private**. 6 uppercase letters or digits, generated on sign-up |
| proUntil | ISO string or null, **public**. Missing or null means Free |
| createdAt | ISO string |

### 5.2 Qualification
| Field | Notes |
|---|---|
| id, proId | |
| type | one of the qualification types |
| title | 3 to 80 chars |
| issuer | 2 to 80 chars |
| year | 1980 to current year |
| credentialNumber | optional, **private** (owner and admin only) |
| documentDataUrl | optional image or PDF, max 2 MB, **private** (owner and admin only) |
| status | `pending`, `approved` or `rejected` |
| rejectReason | shown to the owner only |
| submittedAt, reviewedAt | ISO strings |

### 5.3 Contact
Logged when a customer taps Call.
| Field | Notes |
|---|---|
| id, proId | |
| customerName, customerArea | |
| customerPhone | **private** |
| createdAt, lastContactedAt | |

One contact per (proId, customerPhone). Tapping Call again only updates `lastContactedAt`.

### 5.4 Vouch
| Field | Notes |
|---|---|
| id, proId, contactId | |
| voucherName | 2 to 60 chars, public |
| voucherPhone | **private** |
| voucherArea | one of AREAS, public |
| jobDone | 3 to 80 chars, public (for example "Fixed a leaking kitchen tap") |
| jobMonth | `YYYY-MM`, not in the future, public |
| tags | array from VOUCH_TAGS, max 5, public |
| feedback | 20 to 500 chars, public |
| status | `active` or `removed` |
| removedReason | admin only |
| createdAt | ISO string |

### 5.5 Repo interface (all async)
```
listPros()                                  -> Pro[]  (public fields only, includes proUntil)
getPro(id)                                  -> Pro | null (public fields only, includes proUntil)
createPro(data)                             -> { pro, manageCode }
getProByManageAccess({ phone, manageCode }) -> Pro | null
updatePro(id, manageCode, patch)            -> Pro
subscribePro(id, manageCode, { days })      -> Pro (mock: sets proUntil to max(now, current proUntil) + PRO_DURATION_DAYS)
cancelPro(id, manageCode)                   -> Pro (sets proUntil to null)
listQualifications(proId, { scope })        -> Qualification[]   scope: 'public' (approved only) | 'owner' | 'admin'
addQualification(proId, manageCode, data)   -> Qualification   (status pending)
deleteQualification(id, manageCode)         -> void   (pending only)
listPendingQualifications(adminPasscode)    -> Qualification[]
reviewQualification(adminPasscode, id, decision, reason?) -> Qualification
listVouches(proId, { includeRemoved })      -> Vouch[]   (voucherPhone never returned)
addContact(data)                            -> Contact
getContact(proId, customerPhone)            -> Contact | null
addVouch(data)                              -> Vouch    (enforces section 7)
removeVouch(adminPasscode, id, reason)      -> Vouch
getCallNumber(proId, customerPhone)        -> string | null   (only returns the pro's phone if a contact exists)
resetDemoData(adminPasscode)                -> void
```
`listPros` and `getPro` never return `phone` or `manageCode`. `listVouches` never returns `voucherPhone`. The pro's phone is only revealed through `getCallNumber`, after a contact is logged, in the call dialog and the `tel:` link.

### 5.6 On-device storage keys
- `ezyfix.db.v1`: the whole demo database (local repo)
- `ezyfix.customer`: `{ name, phone, area }` for the customer on this device
- `ezyfix.manage`: `{ proId, phone, manageCode }` for the pro on this device

---

## 6. Screens

### 6.1 Find (`/`)
- Header, then FilterBar: name search, service, area, trust badge, minimum skill level, "Available now" chip, sort control (Best match, Most trusted, Most skilled)
- One-line hint under the sort control that explains the current sort. In "Best match" it says that new pros with proof of skill still show up. It links to a "How ranking works" sheet.
- Results count updated so it does not imply free pros are ranked.
- Pro cards: Pro pros listed first with rank numbers in the selected sort order, displaying ProBadge.
- Divider with heading "Not ranked" and one line: "These pros are on the free plan. They are listed but not ranked." followed by Free cards (no rank number, no "Why this rank" toggle, showing the same TrustChip and SkillChip).
- "Why this rank" (on Pro cards) expands to show trust points, skill points and total score.
- Empty state that suggests widening filters.
- "How ranking works" sheet includes part 4, "Pro plan": explains that Pro is a paid plan deciding who is ranked and listed first, and never changes Trust or Skill.

### 6.2 Pro profile (`/pro/:id`)
- Details: name, service, home area and areas served, years of experience, languages, skills tags, bio, visit charge, availability. ProBadge in header for Pro pros.
- Chips and WhyRankPanel (for a Free pro, shows trust points, skill points and score as before, plus the line "Not ranked. This pro is on the free plan.")
- **Skill section**: approved qualifications (type, title, issuer, year, "Verified" tag). Pending and rejected are never shown publicly.
- **Trust section**: heading shows true total ("N vouches from neighbors"). Pro pros show all vouches. Free pros show only `FREE_VISIBLE_VOUCHES` newest vouches, followed by a note: "{hiddenCount} more vouches are visible when this pro is on the Pro plan."
- Sticky bottom bar with "Call" and "Vouch"
- Not-found state for an unknown id

### 6.3 Join (`/join`)
Pro sign-up form with all Pro fields, inline validation, then a success screen showing the manage code once, with a copy button, a warning to save it, and a line "Want to be ranked? See the Pro plan." with a link to `/plans`. New pros start on the Free plan.

### 6.4 Manage (`/manage`)
- Access: uses `ezyfix.manage` if present, otherwise asks for phone and manage code
- Plan card at top: Free plan or "Pro active until {date}".
- Free pro view: replaces rank card with "You're not ranked yet." plus "With Pro you would rank #{projected} of {M} {service}s." from `projectedRank`, and a "See the Pro plan" button to `/plans`.
- Pro pro view: displays Trust and Skill chips, skill progress toward Expert, rank among Pro pros of the same service, plus a "Cancel Pro" button with confirmation (calls `cancelPro`).
- Qualification list with status (Pending review, Approved, Rejected with reason) and an add form
- Edit profile details and the Available now toggle
- Vouches received (read only, always shows every vouch with feedback)

### 6.5 Admin (`/admin`)
- Passcode gate using `VITE_ADMIN_PASSCODE` (demo only, not real security)
- Pending qualifications with all details and document preview: approve, or reject with a reason
- All vouches: remove with a reason
- Demo tools: reset demo data

### 6.6 Plans (`/plans`)
- Two comparison cards: Free and Pro.
  * Free: listed in Find but not ranked, earns Trust and Skill badges, latest vouch shown on profile, manage profile and add qualifications.
  * Pro: ranked by Best match and listed first, Pro badge, all vouches with feedback shown on profile, rank insights in the dashboard. Price shown as "₹199 per month (demo price)".
- Button logic:
  * If `ezyfix.manage` exists, button on Pro card is "Start Pro (demo)", which opens confirmation dialog "Demo only. No payment is taken." with button "Activate Pro for 30 days". Calling it invokes `subscribePro`, displays toast, and routes to `/manage`.
  * If not signed in, button is "Log in to start Pro" and links to `/manage`.
  * If already Pro, displays "Pro active until {date}" instead of the button.

---

## 7. Vouch rules

1. The customer must be identified on the device (name, phone, area). This is asked the first time they tap Call.
2. A contact must exist for this pro and this customer phone. Otherwise vouching is blocked with the message "You can vouch after you contact this pro through EzyFix."
3. One active vouch per phone per pro.
4. `voucherPhone` must not equal the pro's phone.
5. At most `MAX_VOUCHES_PER_PHONE_PER_DAY = 3` vouches per phone per day.
6. `MIN_HOURS_AFTER_CONTACT = 0` in the demo (a constant, so it can change later).
7. Validation limits are in section 5.4.
8. The public view shows name, area, job, month, tags, feedback and date. The phone is never shown.
9. The vouch form includes a consent line: "Show my name and area on this pro's profile. My phone stays private."
10. Admin can remove a vouch. Removed vouches do not count.

The same rules are enforced in `addVouch` (repo), not only in the UI.

---

## 8. Qualification rules

- A submitted qualification is `pending`. It counts only when `approved`.
- The owner can delete a pending qualification. Approved ones can only be removed by an admin.
- Required: type, title, issuer, year. Optional: credential number and document.
- Maximum 8 submitted qualifications per pro.
- Documents are images or PDFs up to 2 MB, stored as data URLs in the local repo.
- Admin rejects duplicates, unreadable documents and anything that doesn't match the claimed type.

---

## 9. Design system

Mobile first. Design at 390px wide. On desktop, centre the app in a column of max 480px.

**Colors**
- Navy `#072339` (text, primary buttons, header)
- Amber `#FDB60C` (accent, wordmark dot, progress bars, ProBadge background)
- Off-white `#F8F8F6` (page background)
- White cards with a 1px `#E6E6E0` border and 12px radius

**Type**
- Headings: a serif (Lora from Google Fonts)
- Body: a clean sans (Inter from Google Fonts)
- Sentence case everywhere, no ALL CAPS

**Badges and Chips**
- ProBadge: crown icon plus text "Pro", amber background (`#FDB60C`), navy text (`#072339`). Must look clearly different from TrustChip and SkillChip, and never rely on color alone. Plain "Free plan" label where needed.
- Trust chips include a shield icon. New = pink `#F1D9D3`, Community vouched = gold `#F8E3A6`, Highly trusted = sage `#D6E3D3`. Text is navy.
- Skill chips include three small pips, with 1, 2 or 3 filled for Starter, Skilled and Expert. Starter = light grey `#ECEBE6`, Skilled = light blue `#DCE8F5`, Expert = light violet `#E4DFF5`. Text is navy.
- Trust and skill chips must always look clearly different from each other.

**Copy**
- Never use star icons or the word "rating" for pros
- Do not use words like "boost" or "sponsored" for Pro
- Buttons start with a verb: "Call", "Vouch for Anil", "Add qualification", "Start Pro (demo)"
- Errors say what happened and what to do, in one sentence

**Accessibility**
- Every input has a label
- Buttons have accessible names
- Contrast meets WCAG AA
- No information is conveyed by color alone

---

## 10. Seed data

Seed on first load when `ezyfix.db.v1` is missing. Use obviously fake phone numbers: pros use `9000000001` to `9000000012` in table order (so Jomon K is `9000000004`), and vouchers use `9100000001` onward, all distinct. Write a realistic short bio for each pro. Each vouch needs a distinct voucher name, a distinct fake phone, an area, a job, a month within the last 12 months, 1 to 3 tags, and 1 to 3 sentences of natural feedback.

Pro pros get `proUntil = seed time + 365 days`. Free pros get `proUntil = null`.

| # | Name | Service | Home area | Plan | Vouches | Approved qualifications | Available | Expected result |
|---|---|---|---|---|---|---|---|---|
| 1 | Anil Varghese | Plumber | Lake View | Pro | 5 | 1 (ITI or diploma) | yes | Ranked #1, Highly trusted, Skilled, score 3 |
| 2 | Biju Thomas | Plumber | Market Road | Free | 2 | 0 | no | Not ranked, Community vouched, Starter, score 1 |
| 3 | Shibu Raj | Plumber | Lake View | Pro | 0 | 2 (ITI or diploma, trade licence) | yes | Ranked #3, New, Expert, score 2 |
| 4 | Jomon K | Plumber | Church Junction | Free | 0 | 0 | yes | Not ranked, New, Starter, score 0. **Demo pro**, manage code `DEMO01` |
| 5 | Kiran Das | Plumber | Station Road | Pro | 3 | 0 | yes | Ranked #2, Highly trusted, Starter, score 2 |
| 6 | Suresh Nair | Electrician | Market Road | Pro | 3 | 2 (trade licence, training course) | yes | Ranked #1, Highly trusted, Expert, score 4 |
| 7 | Rahul Menon | Electrician | Station Road | Free | 1 | 0 | yes | Not ranked, Community vouched, Starter, score 1 |
| 8 | Faisal Rahman | Electrician | Lake View | Free | 0 | 1 (training course) | yes | Not ranked, New, Skilled, score 1 |
| 9 | Mathew Joseph | Carpenter | Church Junction | Pro | 4 | 0 | yes | Ranked #1, Highly trusted, Starter, score 2 |
| 10 | Deepak S | Carpenter | Station Road | Free | 0 | 0 | no | Not ranked, New, Starter, score 0 |
| 11 | Ravi Kumar | Painter | Market Road | Pro | 2 | 1 (professional certification) | yes | Ranked #1, Community vouched, Skilled, score 2 |
| 12 | Sajan Paul | Painter | Lake View | Pro | 0 | 2 (professional certification, work reference) | yes | Ranked #2, New, Expert, score 2 |

Also seed 2 pending qualifications for Suresh Nair, so the admin screen has content on first load. Give the seeded approved qualifications realistic titles, issuers and years.

New expected Plumber Best match order: Anil (#1), Kiran (#2), Shibu (#3), then Biju and Jomon (not ranked).

---

## 11. Known limitations (be honest in the demo)

- No real identity check. Phone numbers are not verified by OTP, so the vouch rules raise the effort to fake a vouch but don't make it impossible.
- Admin passcode and manage codes are client-side and are demo-only, not real security.
- The Pro subscription is a mock. No payment is taken.
- With the local repo, data lives in each browser. A vouch or pro added on one phone doesn't appear on another.
- Verification is a manual admin review, not automated document checking.

Phase 2 fixes: phone OTP, server-side checks, a shared database with row-level security, and automated pattern checks on vouches.

---

## 12. Whole-prototype demo path (acceptance test)

1. Find, Plumber: ranked Anil #1, Kiran #2, Shibu #3, then a separate "Not ranked" group with Biju and Jomon and no rank numbers.
2. Sort Most skilled: Shibu first among ranked. Biju and Jomon still below.
3. Open Biju's profile: Community vouched chip, 2 vouches counted, only 1 vouch shown, plus a note that 1 more is hidden because Biju is on the free plan. Open Anil: all 5 vouches shown.
4. Call Anil, then vouch with feedback. It appears with name, area, feedback.
5. `/manage` as Jomon (`DEMO01`): Free plan, not ranked, message "With Pro you would rank #4 of 4 plumbers". Add two qualifications: Pending review, nothing changes.
6. `/admin`: approve both. Jomon is Expert but still not ranked in Find.
7. Jomon opens `/plans`, taps "Start Pro (demo)", confirms. Find now shows ranked: Anil, Kiran, Jomon, Shibu, then Biju unranked.
