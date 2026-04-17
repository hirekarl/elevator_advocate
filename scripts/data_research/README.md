# Data Research Scripts

Standalone Python scripts for exploring the NYC elevator complaint dataset.
No Django environment needed — just a SODA app token.

**Setup:**
```bash
# From the repo root
export SODA_APP_TOKEN=your_token_here
# or add it to your .env file — scripts load it automatically

cd scripts/data_research
python <script_name>.py
```

---

## Scripts

### `seasonal_trends.py` — The Summer Spike
**Narrative:** *"NYC elevator complaints spike 33% in July. Summer is the worst time
to be in a building with a history of failures — and that window is weeks away."*

Shows monthly complaint counts by year (2018–2025) and calculates each month's
deviation from the annual average. Use this to open any conversation about urgency
and timing. The July premium is consistent across every year in the dataset.

```bash
python seasonal_trends.py
python seasonal_trends.py --year 2024   # single year
```

---

### `district_hotspots.py` — Worst Buildings Per District
**Narrative:** *"Here are the buildings in your district that have failed their
tenants the most in the last 12 months."*

Shows the top 10 buildings by complaint count for each of the six priority council
districts (Sanchez D17, Stevens D16, Farías D18, Banks D42, Hudson D35,
De La Rosa D10). Use this when briefing a specific councilmember or preparing
for a meeting with a community organization.

```bash
python district_hotspots.py                    # all six priority districts
python district_hotspots.py --borough bronx    # one borough
python district_hotspots.py --months 6         # shorter window (default: 12)
```

---

### `building_timeline.py` — One Building's Full Story
**Narrative:** *"This isn't a one-time problem. Look at the pattern over three years."*

Shows every complaint on record for a specific address: date, category, and a
year-over-year summary. Use this when you have a specific building to spotlight —
in a council briefing, a press clip, or a Housing Court case.

```bash
python building_timeline.py --address "341 EAST 162 ST" --borough bronx
python building_timeline.py --address "150 LEFFERTS AVE" --borough brooklyn
```

---

### `city_overview.py` — The Scale of the Problem
**Narrative:** *"This isn't a District 17 problem. It's a city-wide failure of
accountability — and the data proves it."*

Shows the top 25 buildings city-wide, a borough-level breakdown, and a summary
stat table. Use this for Pursuit demos, press pitches, or any audience that needs
to understand the full scope before you narrow to a specific district.

```bash
python city_overview.py                  # last 12 months
python city_overview.py --months 24      # two-year view
python city_overview.py --top 50         # expand the leaderboard
```

---

## Notes

- All scripts use active SODA codes `6S` and `6M`. Codes `81` and `63` are retired
  (2007 and 2016) and return no results on current data.
- Community board numbers in SODA encode borough + board: first digit is borough
  (1=Manhattan, 2=Bronx, 3=Brooklyn, 4=Queens), last two digits are the board.
- District assignments from community board are inferred. For precise council
  district data, geocode addresses against the NYC Council district boundaries API.
- 2025 data may show lower recent counts due to reporting lag. Focus claims on
  2023–2024 for the most defensible numbers.
