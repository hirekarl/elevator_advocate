# Outreach: Councilmember Pierina Ana Sanchez (District 14)

## Strategic Context

**Pierina Ana Sanchez's role:** Chair, **Committee on Housing and Buildings** — the committee with direct legislative jurisdiction over elevator safety, building maintenance standards, and DOB enforcement.

Unlike the Justin Sanchez outreach (constituent-engagement framing), this is a **committee pitch**. The ask is institutional: Elevator Advocate as a data source that could inform the committee's oversight work and potentially support a "Loss of Service" standard in city housing policy.

**Why now:** The D17 pilot audit is complete and demonstrates the methodology concretely. The D14 analysis has now also been run (April 24, 2026) — 671 buildings, 154 chronic offenders, top address 2240 Walton Avenue (12 complaints in 12 months / 26 over 3 years). The email leads with D14 data rather than offering to run it.

**Status:** Not yet contacted. Draft ready below. D14 prerequisite: COMPLETE.

---

## Engagement Email Draft

**Recipient:** Councilmember Pierina Ana Sanchez
**From:** Karl Johnson
**Subject:** Elevator data for District 14 — 154 chronic offenders identified, dataset available

---

Dear Councilmember Sanchez,

My name is Karl Johnson. I'm a District 17 resident and a fellow at Pursuit, and I've been building a civic tool I believe your committee should know about — particularly before summer.

It's called **Elevator Advocate** ([elevatoradvocate.nyc](https://www.elevatoradvocate.nyc)). The platform gives tenants a way to document elevator outages in real time, verify them through a two-report consensus mechanism, and generate 311 scripts and council outreach tailored to their building's specific complaint history. It's free, mobile-first, and available in English and Spanish.

I've run the same analysis for both **District 17** and **District 14**.

District 17 surfaced **120 chronic offenders** out of 552 buildings — buildings with at least one complaint in the last 12 months and three or more over the last three years. The top address, 601 East 156 Street, logged 8 complaints in the last year against a backdrop of 24 over three years.

District 14 tells a more urgent story. Of 671 buildings analyzed, **154 qualify as chronic offenders** — a 23% rate. The top address, **2240 Walton Avenue** (University Heights), logged **12 complaints in the last 12 months** and 26 over three years. Two other buildings — 1726 Davidson Avenue and 1600 Sedgwick Avenue — have 3-year complaint counts of 19 and 26 respectively. The full ranked dataset is available here:

District 14 report (methodology, priority targets, owner data): https://github.com/hirekarl/elevator_advocate/blob/main/docs/advocacy/districts/district_14/district_14_final_report.md

Full building-level dataset for all 671 buildings — complaint counts, loss of service figures, and legal owner information from MapPLUTO — as a downloadable CSV file (aggregated April 24, 2026): https://github.com/hirekarl/elevator_advocate/blob/main/docs/advocacy/districts/district_14/district_14_data_snapshot.csv

Your committee has the jurisdiction to translate this kind of data into something enforceable. The platform already calculates a "Loss of Service" metric for each building — a ratio of documented outage time to total service period. We believe this metric, refined with expert input, could serve as a standard threshold for triggering DOB audits or owner accountability actions. But we're a prototype, not a finished product, and we know the methodology needs scrutiny from people with housing policy expertise. That's part of what I'm hoping this conversation opens up.

The platform's full source code and data analysis tools are publicly available on GitHub: https://github.com/hirekarl/elevator_advocate. The `scripts/data_research/` directory contains standalone scripts and Jupyter notebooks for exploring the NYC-wide complaint dataset. The district-level pipeline — which generated the D14 and D17 analyses — is in `backend/buildings_app/management/commands/`. Everything your staff would need to examine or replicate the analysis is there.

NYC elevator complaints spike every summer — July averages 33% above the annual rate, a pattern that holds without exception in city data going back to 2018. The window to act before that spike is short.

I'd welcome a 20-minute conversation with you or a member of your housing staff.

Thank you for your work on behalf of tenants across the city.

In service,

**Karl Johnson**
District 17 Resident | Pursuit AI-Native Fellow
[https://www.elevatoradvocate.nyc](https://www.elevatoradvocate.nyc)

---

## Notes on This Outreach

**Framing differences from Justin Sanchez email:**
- This is a committee pitch, not a constituent ask — the tone is peer-to-peer between a civic builder and the relevant legislative authority
- The D17 audit is the proof of concept; the offer to run D14 is the hook
- The methodology transparency ask is positioned as a policy opportunity: "help us define what a LoS threshold should be"
- No mention of the Justin Sanchez outreach (no need to reference it; if he responds and makes an intro, that's a bonus)

**Before sending — prerequisite:**
- ~~Run `generate_district_reports --district 14`~~ — **COMPLETE** (April 24, 2026). 671 buildings, 154 chronic offenders.
- CSV at `docs/advocacy/districts/district_14/district_14_data_snapshot.csv`
- Full report at `docs/advocacy/districts/district_14/district_14_final_report.md`

**Next targets after this (Housing & Buildings Committee members):**
| Priority | Member | District | Notes |
|---|---|---|---|
| 3 | Yusef Salaam | 9 (Harlem/West Bronx) | Large NYCHA footprint |
| 4 | Shaun Abreu | 7 (Upper Manhattan) | Also chairs Transportation & Infrastructure |
| 5 | Oswald Feliz | 15 (Bronx) | Bronx district, significant complaint volume |
| 6 | Kevin C. Riley | 12 (Norwood/Fordham) | Also chairs Land Use |
