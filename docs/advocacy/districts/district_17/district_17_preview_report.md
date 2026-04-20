# Advocacy Brief: District 17 "Loss of Service" Preview

**Date**: April 20, 2026  
**Subject**: Preliminary Findings on Elevator Reliability in Council District 17  
**Lead Analyst**: Sol (Lead Orchestrator)

## 1. Executive Summary (Preliminary)
This brief provides an early look at elevator service metrics across NYC Council District 17. By synthesizing real-time tenant reports with 7,700+ historical city records, we have identified a significant "reliability gap" in specific residential clusters.

*   **Total Buildings Tracked**: 551
*   **Historical Reports Synced**: 7,737
*   **Average District Loss of Service (LoS)**: 0.02% (Baseline)
*   **Primary Advocacy Target**: 1150 Tiffany Street (LoS: 0.56% — 28x the district average)

## 2. Methodology: The "Dignity Through Data" Model
Our analysis moves beyond anecdotal complaints to provide "court-ready" data using a three-tier verification protocol:

### Tier 1: The Consensus Rule
To eliminate "noise" and false reports, an outage is only canonically **Verified** when two independent residents report the same status within a rolling 2-hour window.

### Tier 2: The Two-Hop Identity Protocol
Official city data (SODA) is often fragmented. We use a "Two-Hop" resolution system to ensure data integrity:
1.  **Hop 1**: Map Building Identification Numbers (BINs) to Tax Lots (BBLs) using **NYC Planning Footprints**.
2.  **Hop 2**: Map BBLs to legal entities via **MapPLUTO** to identify the owners and management companies responsible for the neglect.

### Tier 3: Loss of Service (LoS) Calculation
We calculate **LoS %** as the ratio of (Total Down Time / Total Period Time) * 100. This metric translates technical outages into a human-rights narrative: the percentage of time a building is effectively inaccessible to mobility-impaired residents.

## 3. Preliminary Top Offenders
The following buildings show patterns of chronic failure in the last 30 days:

| Address | Recent Complaints | LoS % | AI Insight |
|:---|:---:|:---:|:---|
| **1150 Tiffany Street** | 2 | 0.56% | "Chronic malfunctions... demanding urgent intervention." |
| **1090 Franklin Avenue** | 2 | 0.28% | [Analysis in Progress] |
| **1334 Wilkins Avenue** | 1 | 0.28% | "Persistent failures... demand urgent remediation." |
| **1490 Boston Road** | 1 | 0.28% | "Critical service failure... requires immediate intervention." |

## 4. Technical Implementation
The analysis is orchestrated by a multi-agent system powered by **Gemini 2.5 Flash**:

1.  **High-Performance Ingestion**: We pre-filter 75,000+ Bronx records by a targeted list of District 17 BINs, reducing geocoding overhead by over 80%.
2.  **Supervisor-Worker Pattern**: A Lead Orchestrator (Sol) delegates specific building histories to AI specialists.
3.  **Agentic Synthesis**: The AI doesn't just count reports; it analyzes the *type* of failure (e.g., '6S' vs '6M') and the disposition of city inspections to generate a narrative summary for each building.
4.  **Rate-Limited Stability**: Implemented a 200ms `RateLimiter` to ensure reliable data retrieval without hitting NYC Open Data API ceilings.

## 5. Next Steps
The full report is currently being generated. Upon completion, we will provide a comprehensive "District 17 Health Map" and a synthesized legislative brief for the Councilmember.
