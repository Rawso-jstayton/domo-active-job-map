---
name: domo-ai
description: >
  DOMO AI features — AI-powered summaries, dashboard chat, data narratives,
  and automated insights. Use when configuring AI summaries on dashboards,
  setting up conversational analytics, creating AI-generated narratives
  for cards, or leveraging any of DOMO's built-in AI capabilities.
---

# DOMO AI Features

Reference for DOMO's AI-powered analytics and content generation.

## Which Feature to Use

| Goal | Use |
|------|-----|
| Give execs a plain-language summary of a full dashboard | AI Summary |
| Let users ask questions about data in natural language | Dashboard Chat |
| Explain what a single card shows below the chart | Data Narrative |
| Alert when something unusual happens without a fixed threshold | Intelligent Alert |
| Categorize or extract meaning from text columns in an ETL | AI Text Generation tile |

**Default approach for new dashboards:** Enable AI Summary on all
executive-facing dashboards. Add Data Narratives to KPI cards. Set
Intelligent Alerts on critical metrics. Enable Dashboard Chat only when
users are comfortable with NL querying — it surfaces data literacy gaps.

## QC Process for AI-Generated Content

AI output must be reviewed before any dashboard goes to stakeholders.
Never assume the AI got it right — it confidently hallucinates.

**Review checklist (run during Phase 4 QC):**
- [ ] Numbers in the summary match the actual card values
- [ ] Time references are correct ("this month" = actual current month)
- [ ] No invented context ("revenue declined due to..." — AI doesn't know why)
- [ ] No missing metrics — check that all key cards are represented
- [ ] Tone matches the intended audience (not too casual, not too jargon-heavy)
- [ ] Alert thresholds validated against historical data (not just set to defaults)

**When to disable AI features:**
- Financial reporting dashboards (precision critical — one hallucination = problem)
- Regulatory or compliance dashboards
- Any dashboard where users may cite the AI text in external documents

## AI Summaries

Dashboard-level AI summaries generate natural language descriptions of
what the dashboard data shows.

### How to Enable
1. Open a dashboard page in DOMO
2. Click the AI summary icon (or Page Options > AI Summary)
3. Configure scope: which cards/datasets to include
4. Set refresh: auto-update when data refreshes, or manual

### Configuration
- **Tone:** Business-formal (default), casual, technical
- **Focus areas:** Specify which metrics to prioritize
- **Custom instructions:** Add prompts to guide the AI (see examples below)
- **Data scope:** Select which cards feed into the summary

### Custom Instruction Prompts That Work Well

The quality of AI summaries is almost entirely determined by the custom
instruction prompt. Vague prompts produce vague summaries.

```
# For an operations dashboard:
"Summarize the 3 most significant changes in equipment utilization and
project costs vs the prior month. Focus on trends that require action.
Use plain language suitable for a field operations manager. Do not mention
metrics that are within normal range."

# For an HR headcount dashboard:
"Highlight changes in headcount by department, turnover rate vs the same
period last year, and any open positions that have been unfilled for more
than 60 days. Tone: professional, factual. Keep to 4 sentences max."

# For a financial dashboard:
"Compare budget vs actual for the current month and year-to-date. Flag
any line items more than 10% over or under budget. Do not speculate on
causes — only report the data."
```

**Pattern:** Tell the AI what to compare, what to flag, what tone to use,
and what to omit. Constraints improve quality more than elaboration.

### Best Practices
- Keep summaries focused on 3-5 key takeaways, not everything
- Add custom instructions to steer toward actionable insights
- Review AI output during QC — it can hallucinate or misinterpret
- Use for executive dashboards where a quick narrative saves time
- Don't use for dashboards where precision is critical (financial reporting)

### Limitations
- AI may misinterpret relationships between cards
- Cannot reference external context (industry benchmarks, goals)
- Accuracy depends on clear card titles and dataset naming
- May not handle complex calculated fields correctly

## Dashboard Chat / Conversational Analytics

DOMO.AI allows users to ask natural language questions about their data.

### How to Enable
1. Admin > Features > enable DOMO.AI / Conversational Analytics
2. Configure which datasets are queryable
3. Set access permissions (which users/groups can use it)

### Scoping Data Access
- Restrict which datasets the AI can query
- PDP policies are respected — users only get answers from data they can see
- Scope to specific dashboards or dataset collections

### Best Practices for Good Answers
- Use clear, descriptive dataset and column names
- Ask specific questions: "What was total revenue in Q1 2024?" not "Tell me about revenue"
- Follow up to refine: "Break that down by region"
- Use time references the AI can parse: "last month", "Q1 2024", "year over year"

### What It Handles Poorly
- Complex multi-step calculations
- Questions requiring joins across many datasets
- Subjective or opinion questions ("Is this good?")
- Questions about data it doesn't have access to

## Data Narratives

AI-generated text attached to individual cards that explain what the data shows.

### How to Add
1. Open a card in Analyzer
2. Click Card Options > Add Narrative (or AI Narrative)
3. Configure: auto-generate or provide custom prompt
4. Narrative appears below or beside the chart

### When Narratives Add Value
- KPI cards: "Revenue is up 12% vs last quarter, driven by..."
- Trend charts: "The downward trend began in March and accelerated in April"
- Executive-facing cards where context saves explanation time

### When They're Noise
- Detail tables (the data speaks for itself)
- Cards viewed by technical users who read charts directly
- Dashboards with many cards (narrative per card = too much text)

## AI-Powered Alerts

DOMO's Intelligent Alerts use AI to detect anomalies automatically:

### Configuration
1. Open a card > Alerts
2. Choose "Intelligent Alert" (vs manual threshold)
3. DOMO AI learns the data's normal patterns and alerts on anomalies
4. Set notification channel (email, Buzz, Slack, mobile push)

### When to Use
- Metrics with variable baselines (simple thresholds would fire constantly)
- Seasonal data where "normal" changes throughout the year
- Situations where you want to be alerted to unusual changes, not just
  absolute thresholds

### When to Use Manual Thresholds Instead
- Hard compliance limits (must alert when > X, regardless of trend)
- Simple up/down monitoring where the threshold is clear
- Financial metrics with absolute boundaries

## AI Text Generation in ETLs

Magic ETL has an AI Text Generation tile (see magic-etl skill):
- Process text fields through AI within the ETL pipeline
- Summarize, categorize, or extract entities from text columns
- Useful for: categorizing support tickets, extracting names from
  free-text fields, generating standardized descriptions

## Rawso Conventions

Default decisions until overridden by a specific project:

- **AI Summaries:** Enable on all executive-facing dashboards. Use business-formal
  tone. Always add a custom instruction prompt (see examples above) — never use
  the default with no instructions.
- **Dashboard Chat:** Opt-in only. Enable when the stakeholder explicitly requests
  it and when dataset naming is clean enough to support NL queries.
- **Data Narratives:** Add to KPI cards on executive dashboards. Skip on
  detail/operational dashboards.
- **Intelligent Alerts:** Set on all critical KPIs (headcount, revenue, utilization).
  Manual thresholds for hard limits (compliance, budget caps).
- **QC:** All AI output reviewed during Phase 4 QC before stakeholder delivery
  (use checklist in the QC Process section above).

Add project-specific AI conventions to `/learn` as they're established.

## Known Issues

- AI summaries can lag behind data refreshes by several minutes
- Conversational analytics may not understand custom Beast Mode calculations
- AI narratives on cards with complex date filters may produce incorrect
  time references
- AI features require specific DOMO license tiers — verify availability
  before planning to use them
