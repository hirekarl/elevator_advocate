# Outreach: Council Member Dr. Nantasha Williams (District 27)

## Strategic Context

**Dr. Nantasha Williams's role:** Member, **Committee on Housing and Buildings** — the committee with direct legislative jurisdiction over elevator safety, building maintenance standards, and DOB enforcement. Also Chair of Cultural Affairs, Libraries & International Relations.

**District:** 27 — Jamaica, St. Albans, Hollis, South Jamaica (Queens). Dense residential stock with significant public housing presence; NYCHA buildings in Jamaica have documented elevator reliability issues.

**Why D27:** The only Queens member on the Housing & Buildings Committee. This is a straight committee pitch — Williams has direct institutional jurisdiction over the problem Elevator Advocate is designed to address.

**Status:** Not yet contacted. Draft ready to send — all data placeholders filled (April 24, 2026).

---

## Engagement Email Draft

**Recipient:** Council Member Dr. Nantasha Williams
**From:** Karl Johnson
**Subject:** Elevator data for District 27 — 37 chronic offenders identified, dataset available

---

Dear Council Member Williams,

My name is Karl Johnson. I'm a District 17 resident in the Bronx and a fellow at Pursuit, and I've been building a civic tool I believe your committee should know about — particularly before summer.

It's called **Elevator Advocate** ([elevatoradvocate.nyc](https://www.elevatoradvocate.nyc)). The platform gives tenants a way to document elevator outages in real time, verify them through a two-report consensus mechanism, and generate 311 scripts and council outreach tailored to their building's specific complaint history. It's free, mobile-first, and available in English and Spanish.

I've completed district-wide elevator reliability audits for two districts so far. District 17 in the Bronx surfaced **120 chronic offenders** out of 552 buildings — buildings with at least one complaint in the last 12 months and three or more over the last three years. The top address, 601 East 156 Street, logged 8 complaints in the last year against a backdrop of 24 over three years.

District 27 tells its own story. Of 231 buildings analyzed, **37 qualify as chronic offenders** — a 16% rate. The top address, **89-20 161 Street**, logged **6 complaints in the last 12 months** and 34 over three years. The full ranked dataset is available here:

District 27 report (methodology, priority targets, owner data): https://github.com/hirekarl/elevator_advocate/blob/main/docs/advocacy/districts/district_27/district_27_final_report.md

Full building-level dataset for all 231 buildings — complaint counts, loss of service figures, and legal owner information from MapPLUTO — as a downloadable CSV file (aggregated April 24, 2026): https://github.com/hirekarl/elevator_advocate/blob/main/docs/advocacy/districts/district_27/district_27_data_snapshot.csv

Your committee has the jurisdiction to translate this kind of data into something enforceable. The platform already calculates a "Loss of Service" metric for each building — a ratio of documented outage time to total service period. We believe this metric, refined with expert input, could serve as a standard threshold for triggering DOB audits or owner accountability actions. But we're a prototype, not a finished product, and we know the methodology needs scrutiny from people with housing policy expertise. That's part of what I'm hoping this conversation opens up.

The platform's full source code and data analysis tools are publicly available on GitHub: https://github.com/hirekarl/elevator_advocate. Everything your staff would need to examine or replicate the analysis is there.

NYC elevator complaints spike every summer — July averages well above the annual rate, a pattern that holds without exception in city data going back to 2018. The window to act before that spike is short.

I'd welcome a 20-minute conversation with you or a member of your housing staff.

Thank you for your work on behalf of tenants across the city.

In service,

**Karl Johnson**
District 17 Resident, The Bronx | Pursuit AI-Native Fellow
[https://www.elevatoradvocate.nyc](https://www.elevatoradvocate.nyc)

---

## Notes on This Outreach

**Framing:** Straight committee pitch — Williams has direct jurisdiction, so no constituent angle or political-moment hook is needed. The ask is institutional: Elevator Advocate as a data source that could inform the committee's oversight work.

**D17 as proof of concept:** Lead with the Bronx pilot to establish the methodology is real and tested, then pivot to D27 data as the locally relevant hook.

**Before sending — prerequisites:**
- ~~Run `generate_district_reports --district 27`~~ — **COMPLETE** (April 24, 2026). 231 buildings, 37 chronic offenders.
- ~~Export D27 CSV~~ — **COMPLETE** at `docs/advocacy/districts/district_27/district_27_data_snapshot.csv`
- Note: D27 final report (`district_27_final_report.md`) has not yet been generated — create it before sending if you want the report link to resolve.

**Timing:** Send after D14 (Pierina Ana Sanchez) — she is the committee chair and the higher-leverage first contact. Williams is the logical Queens follow-up once the Bronx outreach is in motion.
