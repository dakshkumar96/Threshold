# MODULE 3 — Calibration Examples

**Purpose:** Few-shot examples are the single highest-leverage way to improve LLM output quality. These show the model exactly what feedback should look like at each score band.

**Injection:** Include ONE example per call, matched to the rough quality band you estimate. Do not include all three.

**How to pick which one:** Run a quick pre-pass — count quantified bullets, check for a portfolio/GitHub link, check page count, check for a summary. Score roughly, then inject the nearest band.

---

# EXAMPLE 1 — WEAK CV (Score: 41/100)

## The CV

```
CURRICULUM VITAE

Name: [Candidate]
Email: coolguy2004@hotmail.com
Phone: [number]

PERSONAL STATEMENT
I am a hard-working and motivated individual with a passion for data and
technology. I am a great team player who works well under pressure and
always delivers results. I am looking for an opportunity to grow my career
in a dynamic organisation where I can utilise my skills.

EDUCATION
BSc Computer Science, [University], 2023-2026

SKILLS
Python, Java, SQL, HTML, CSS, JavaScript, React, Node, MongoDB, Excel,
Word, PowerPoint, Photoshop, Machine Learning, Data Analysis, AI,
Communication, Teamwork, Leadership, Problem Solving

EXPERIENCE

Retail Assistant, [Shop], 2024-2025
- Served customers
- Worked on the till
- Helped with stock
- Provided excellent customer service

PROJECTS

Titanic Survival Prediction
- Used machine learning to predict survival on the Titanic
- Achieved good accuracy

Movie Recommendation System
- Built a system that recommends movies
- Used Python and pandas

INTERESTS
Football, gaming, music
```

## The Feedback (this is the standard to match)

---

**THE 7-SECOND VERDICT**

**Bucket:** NOT QUALIFIED

What my eyes caught in 7.4 seconds:
- **Name:** Visible, fine
- **Current title:** "Retail Assistant" — no analytics signal at all
- **Current company:** A shop
- **Dates and progression:** One role, ended 2025, gap since
- **Previous role:** None
- **Education:** BSc Computer Science, no grade stated

**Instant impression:** I stopped at the personal statement. Every sentence could have been written by any of the other 139 applicants. There is no evidence anywhere in the top third that this person has done analytical work. I would not keep reading, and the missing grade makes me assume the worst.

---

**SCORES**

| Category | Score | Verdict |
|---|---|---|
| Seven-Second Survivability | 9/20 | Layout is readable but the top third wastes prime space on generic claims |
| Evidence of Real Impact | 3/20 | Zero numbers anywhere on the document |
| Authenticity vs AI Sameness | 6/20 | Reads as template, not AI — but equally interchangeable |
| Relevance and Skills Credibility | 6/20 | 20 skills listed, none evidenced |
| Differentiation and Progression | 5/20 | Nothing memorable, no progression, unexplained gap |
| **TOTAL** | **29/100** | Would not progress |

---

**THE AI SAMENESS TEST**

This does not read as AI-generated — it reads as template-generated, which lands in the same place. The problem is identical: nothing here could only have been written by you.

Lines that are completely interchangeable:
- "hard-working and motivated individual with a passion for data and technology"
- "great team player who works well under pressure"
- "dynamic organisation where I can utilise my skills"

I have read those exact sentences hundreds of times. They tell me nothing, and worse, they use the most valuable space on your CV — the top third of page one, where my eyes land first — to tell me nothing.

There is not a single detail in this document that is specific to you. Not one number, not one named tool used in a real context, not one outcome.

---

**RED FLAGS FOUND**

1. **Unprofessional email address.** "coolguy2004@hotmail.com" — 75% of recruiters expect a professional address. This is an instant credibility hit before I read a word. Use firstname.lastname@gmail.com.
2. **Grade omitted.** When a grade is missing, recruiters assume it is poor. If it is a 2:1 or above, state it. If it is below, state it anyway with context — omission is worse.
3. **Skill stuffing with no evidence.** 20 skills listed. Machine Learning, AI, and Data Analysis all appear as one-word claims with nothing behind them. This actively damages credibility because I now doubt the whole list.
4. **Tutorial datasets.** Titanic and a movie recommender are the two most-submitted projects in existence. I see them dozens of times per hiring cycle. They tell me you completed a course, not that you can do the job.
5. **Unexplained gap.** Role ended 2025, no explanation. 55% of recruiters flag unexplained gaps.
6. **"Achieved good accuracy"** — an unverifiable, unquantified claim on a technical project. What accuracy? Against what baseline?
7. **Interests section.** Football, gaming, music adds nothing and uses space you need.

---

**TYPOS AND ERRORS**

No spelling errors found — genuinely, and that matters, because 85% of recruiters would reject over one.

Formatting issues:
- "CURRICULUM VITAE" as a header wastes a line. I know what document I am reading.
- "Name:", "Email:", "Phone:" labels are unnecessary. The content is self-evident.
- Inconsistent date formatting between education and experience.

---

**PAGE ONE / PAGE TWO AUDIT**

Everything is on page one, which is correct for a CV this short. The problem is not length, it is content density. You have roughly 40% white space that should be carrying evidence.

---

**WHAT IS ACTUALLY WORKING**

Being honest with you: very little, and I would rather tell you that than pad this section.

1. **The layout is clean and scannable.** No columns, no tables, no graphics fighting the parser. That is a real foundation to build on.
2. **The skills you claim are the right ones for a data role.** Python, SQL, and pandas are exactly what a data analyst CV needs. The problem is entirely that none are evidenced — which is a fixable problem, not a fundamental one.
3. **You have a relevant degree.** BSc Computer Science is a legitimate qualification for an analytics role.

That is the honest list. The good news is that a CV scoring 29 with a relevant degree and the right skill claims is usually 4-6 weeks of work away from 70+, because the raw material exists and only the evidence is missing.

---

**LINE BY LINE — EXPERIENCE SECTION**

**Original:** "Served customers"
**Verdict:** NO OUTCOME
**Why:** Two words, no scale, no result. This is a job description, not an achievement.
**Rewrite:** "Served an average of 120+ customers per shift in a high-footfall city-centre store, maintaining till accuracy above 99%"
*(Use your real numbers — if you do not know them, estimate honestly from what you remember and be prepared to explain the basis.)*

**Original:** "Worked on the till"
**Verdict:** NO OUTCOME
**Why:** Restates the previous bullet with less information.
**Rewrite:** Merge into the bullet above. Never use two bullets for one activity.

**Original:** "Helped with stock"
**Verdict:** WEAK
**Why:** "Helped with" signals no ownership. Recruiters read it as "was present while someone else did this."
**Rewrite:** "Managed weekly stock counts across 3 departments, identifying and reporting a recurring £400/month shrinkage issue"

**Original:** "Provided excellent customer service"
**Verdict:** BUZZWORD
**Why:** Self-assessed praise with no evidence. Every retail CV says this. Delete or evidence it.
**Rewrite:** "Resolved customer complaints independently, contributing to store's 4.6/5 average review score over 12 months" — but only if true.

**Original:** "Used machine learning to predict survival on the Titanic"
**Verdict:** WEAK
**Why:** Titanic is the single most common dataset on graduate CVs. Recruiters recognise it instantly as a tutorial exercise.
**Rewrite:** Replace the entire project. See THE ONE THING below.

**Original:** "Achieved good accuracy"
**Verdict:** UNVERIFIABLE
**Why:** "Good" is not a number. On a technical CV this is worse than saying nothing, because it suggests you either do not know your own results or they were not good.
**Rewrite:** "Achieved 81% accuracy (baseline 62%) using gradient boosting after feature engineering on passenger class and family size" — if you can state it honestly.

**Original:** "Built a system that recommends movies"
**Verdict:** NO OUTCOME
**Why:** No method, no dataset size, no evaluation metric, no users.
**Rewrite:** Same issue as above — replace the project rather than rewrite the bullet.

---

**JOB DESCRIPTION GAP ANALYSIS**

*(Assuming target role: Graduate Data Analyst)*

| Requirement | Status | What to add |
|---|---|---|
| SQL proficiency | PARTIAL | Listed in skills but never used in any project or role. Add one project where SQL does real work. |
| Python for data analysis | PARTIAL | Listed. Evidenced only on tutorial datasets. Needs one real application. |
| Data visualisation tool | MISSING | No Power BI, Tableau, or Looker anywhere. This is a hard requirement in most JDs. Learn one, build one dashboard. |
| Experience with real datasets | MISSING | Both projects use pre-cleaned tutorial data. This is the biggest gap. |
| Stakeholder communication | MISSING | No evidence of presenting findings to anyone. |
| Commercial awareness | MISSING | No evidence of understanding a business problem. |
| Degree in relevant field | ADDRESSED | BSc Computer Science qualifies — but state the grade. |

**Keyword mismatches:**
- CV says "Data Analysis" (generic); JDs say "data cleaning, exploratory analysis, statistical testing" — use their language
- CV says "Machine Learning"; graduate analyst JDs rarely ask for this and it reads as overreach without evidence
- CV omits "stakeholder," "dashboard," "reporting," "insight" — all high-frequency JD terms

---

**WILL THEY SURVIVE THE FUNNEL?**

**Stage 2 (online tests):** No signal either way. Numerical reasoning should be manageable with a CS degree, but nothing here demonstrates it.

**Stage 3 (competency interview):** Currently very weak. There is no STAR-ready material anywhere on this CV. Every bullet is too thin to build a two-minute answer around. This is a serious problem — you would struggle to answer "tell me about a time you used data to solve a problem."

**Stage 4 (assessment centre):** No evidence of group work, presenting, or structured problem-solving. Nothing to draw on.

---

**THE ONE THING**

Replace the Titanic project with one project on real, messy, self-sourced data that ends in a recommendation.

Specifically: find a dataset nobody uses (government open data, a public API, your own exported data from something you use), ask one clear question, clean the data properly, and finish with a sentence that starts "Based on this, I would recommend..."

Then write it up with the number: what you found, how big the effect was, what you would do about it.

That single change moves this CV from 29 to roughly 55 on its own, because it converts every unevidenced skill claim into a demonstrated one. Everything else on this list is secondary to it.

---

**REWRITTEN SUMMARY**

Current version tells me nothing. Here is the structure to use instead, filled with placeholders where you need to insert your real work:

> "Final-year BSc Computer Science student (predicted 2:1) building analytics projects on real UK open data. Recent work: analysed [dataset] using SQL and Python to identify [specific finding], recommending [specific action]. Comfortable with SQL, Python/pandas, and Power BI. Looking for a graduate data analyst role where I can work on commercial datasets."

Four things that version does which yours does not: states the grade, names a real piece of work, uses the employer's vocabulary, and states what you want. No adjectives about yourself anywhere — the work does that job.

---

**WOULD YOU PUT THEM FORWARD?**

**Answer:** No, not in current form.

Realistic position right now: not competitive for graduate analyst roles at any tier. You would not clear the first screen at a Tier 3 fintech, let alone Tier 1.

But the distance is shorter than the score suggests. You have the degree, the right skill vocabulary, and a clean layout. What you lack is entirely evidence. One real project, a stated grade, a professional email, and quantified retail bullets would put you at roughly 65-70 — competitive for Tier 3 and 4 roles and worth interviewing.

Four to six weeks of focused work. Not a rebuild of who you are. A rebuild of what you can prove.

---
---

# EXAMPLE 2 — AVERAGE CV (Score: 68/100)

## The CV (abbreviated to the relevant sections)

```
[Name] | [email] | [phone] | linkedin.com/in/[name] | github.com/[name]

SUMMARY
Data-driven analyst with experience in SQL, Python, and Power BI. Proven
track record of delivering insights that drive business value. Seeking to
leverage analytical skills in a fast-paced environment.

EXPERIENCE

Data Analyst Intern | [Fintech Startup] | Jun 2025 - Sep 2025
- Built dashboards in Power BI for the marketing team
- Wrote SQL queries to extract data from the company database
- Presented findings to stakeholders in weekly meetings
- Improved reporting efficiency by 30%

Marketing Assistant | [Agency] | Sep 2024 - May 2025
- Managed social media accounts for 5 clients
- Created content calendars and scheduled posts
- Analysed campaign performance using Google Analytics
- Increased engagement by 45%

EDUCATION
BSc Economics, [Russell Group University], 2:1, 2022-2025

PROJECTS
UK Housing Price Analysis
- Analysed 50,000 property transactions using Python and pandas
- Built a regression model to predict prices
- Visualised results in Tableau

SKILLS
SQL, Python (pandas, NumPy), Power BI, Tableau, Excel, Google Analytics,
Git, statistical analysis
```

## The Feedback

---

**THE 7-SECOND VERDICT**

**Bucket:** MAYBE

What my eyes caught in 7.4 seconds:
- **Name:** Clear, with LinkedIn and GitHub — good, I can verify you
- **Current title:** "Data Analyst Intern" — relevant, immediate signal
- **Current company:** A fintech startup — sector-relevant
- **Dates and progression:** Marketing Assistant → Data Analyst Intern. Logical progression toward analytics.
- **Previous role:** Marketing Assistant, adds commercial context
- **Education:** BSc Economics, 2:1, Russell Group — clears the filter

**Instant impression:** This is a real candidate with a real analytics internship. I would keep reading. But I have 50 of these and something needs to make me pick this one, and right now nothing does.

---

**SCORES**

| Category | Score | Verdict |
|---|---|---|
| Seven-Second Survivability | 16/20 | Strong structure, contact links present, summary wastes space |
| Evidence of Real Impact | 13/20 | Numbers present but several are unverifiable or lack baselines |
| Authenticity vs AI Sameness | 11/20 | Reads polished and generic — this is the main issue |
| Relevance and Skills Credibility | 15/20 | Skills mostly evidenced, tool stack slightly dated |
| Differentiation and Progression | 13/20 | Good progression, no memorable differentiator |
| **TOTAL** | **68/100** | Lands in "maybe" — will not hear back if 50 are already in "qualified" |

---

**THE AI SAMENESS TEST**

This is the category costing you the most, and it is the one almost nobody tells candidates about.

Lines that read as AI-generated or template-optimised:
- "Data-driven analyst" — appears on roughly a third of analytics CVs I see
- "Proven track record of delivering insights that drive business value" — this is a sentence with no content
- "Seeking to leverage analytical skills in a fast-paced environment" — interchangeable with any applicant

Suspicious round numbers:
- "Improved reporting efficiency by 30%" — 30% is a suspiciously clean figure. I would ask you in interview how you measured "reporting efficiency" and what the before and after were. If you cannot answer precisely, this bullet becomes a liability rather than an asset.
- "Increased engagement by 45%" — same issue, plus no baseline. 45% increase from what?

Lines that read authentically human:
- "Analysed 50,000 property transactions" — a specific, odd, real-sounding number. This is the most credible line on your CV.
- "Managed social media accounts for 5 clients" — specific and verifiable.

The pattern is clear: where you use precise, slightly awkward real numbers, you sound genuine. Where you use round percentages and polished phrasing, you sound like the other 139 applications. Lean into the former.

---

**RED FLAGS FOUND**

1. **Unverifiable round percentages.** Both "30%" and "45%" will be probed in interview. Have the exact basis ready or replace them with something you can defend.
2. **No baseline on the engagement figure.** A 45% increase from 100 to 145 impressions is very different from 10,000 to 14,500. Recruiters discount unbaselined percentages heavily.
3. **Summary is dead space.** Three sentences, zero information, occupying the exact area where my eyes land first.
4. **Tool stack has a gap.** No cloud warehouse experience (BigQuery, Snowflake) and no dbt. In 2026 these appear on most London analyst JDs, including graduate ones.

No typos found. No gaps. No progression concerns. That is genuinely good.

---

**TYPOS AND ERRORS**

None found. Formatting is consistent throughout. This matters — 85% of recruiters would reject over a single typo, and you have cleared that bar cleanly.

---

**PAGE ONE / PAGE TWO AUDIT**

Single page, correctly. All six fixation points are in the top third.

One positioning issue: your strongest, most credible line — "Analysed 50,000 property transactions" — is in the Projects section near the bottom. In a 7.4-second scan I may never reach it. Consider whether that project deserves higher placement, or whether its key detail should appear in your summary.

---

**WHAT IS ACTUALLY WORKING**

1. **"Analysed 50,000 property transactions using Python and pandas"** — the specific, unrounded number makes this instantly credible. This is your best line. Write more like this.
2. **The progression from Marketing Assistant to Data Analyst Intern** reads as a deliberate, coherent career direction rather than random job-taking. That story is genuinely valuable and you should make it explicit.
3. **LinkedIn and GitHub both present in the header.** Roughly half of graduate CVs omit one or both. I can verify you, which reduces my risk.
4. **"Presented findings to stakeholders in weekly meetings"** — most graduate analyst CVs have no stakeholder communication evidence at all. This is a real differentiator against your peer group, and it is currently underplayed.
5. **Economics degree plus analytics tooling** is a strong combination for fintech specifically. Economics signals commercial reasoning that a pure CS degree does not.

---

**LINE BY LINE — EXPERIENCE SECTION**

**Original:** "Built dashboards in Power BI for the marketing team"
**Verdict:** NO OUTCOME
**Why:** I know what you made. I do not know whether it mattered, who used it, or what changed.
**Rewrite:** "Built 3 Power BI dashboards used weekly by a 6-person marketing team, replacing manual Excel reporting and surfacing channel-level CAC for the first time"

**Original:** "Wrote SQL queries to extract data from the company database"
**Verdict:** WEAK
**Why:** This describes the minimum expectation of the role. It differentiates nothing. Every analyst writes SQL.
**Rewrite:** "Wrote SQL across 8 production tables to build the company's first cohort retention view, joining transaction and user data that had previously been analysed separately"

**Original:** "Presented findings to stakeholders in weekly meetings"
**Verdict:** WEAK (but valuable — needs strengthening not deleting)
**Why:** The activity is genuinely differentiating but the bullet gives me no sense of impact or audience seniority.
**Rewrite:** "Presented weekly analysis to marketing lead and founders, including a finding on paid social underperformance that led to a reallocation of budget"

**Original:** "Improved reporting efficiency by 30%"
**Verdict:** UNVERIFIABLE NUMBER
**Why:** "Reporting efficiency" is not a measurable quantity, and 30% is suspiciously round. This bullet currently creates interview risk rather than credibility.
**Rewrite:** "Cut weekly reporting time from roughly 4 hours to 45 minutes by automating three manual Excel processes in Power Query"
*(Use whatever the true figures are. Time saved is measurable; "efficiency" is not.)*

**Original:** "Managed social media accounts for 5 clients"
**Verdict:** STRONG
**Why:** Specific, verifiable, gives scale. Good bullet.
**Rewrite:** Not needed. Optionally add sector or follower scale.

**Original:** "Created content calendars and scheduled posts"
**Verdict:** NO OUTCOME
**Why:** Pure task description. Delete or merge — this uses a line without earning it.
**Rewrite:** Merge into the bullet above.

**Original:** "Analysed campaign performance using Google Analytics"
**Verdict:** WEAK
**Why:** Names the tool but not the finding. What did the analysis reveal?
**Rewrite:** "Analysed campaign performance in GA4 across 5 client accounts, identifying that two clients' top traffic channel had the worst conversion rate and recommending spend reallocation"

**Original:** "Increased engagement by 45%"
**Verdict:** UNVERIFIABLE NUMBER
**Why:** No baseline, round figure, and "engagement" is undefined. Which metric? From what to what?
**Rewrite:** "Grew average post engagement rate from 1.8% to 2.6% across 5 client accounts over 6 months through A/B testing hook formats"

---

**JOB DESCRIPTION GAP ANALYSIS**

*(Assuming target: Graduate Data Analyst, London fintech)*

| Requirement | Status | What to add |
|---|---|---|
| SQL | ADDRESSED | Evidenced in internship. Strengthen with complexity detail (joins, window functions). |
| Python / pandas | ADDRESSED | Evidenced in both internship and project. |
| Data visualisation | ADDRESSED | Power BI and Tableau both evidenced. |
| Cloud warehouse (BigQuery/Snowflake) | MISSING | Not mentioned anywhere. Common JD requirement in 2026. Add if you have any exposure. |
| dbt or similar transformation tooling | MISSING | Increasingly standard. Worth a weekend to learn basics. |
| A/B testing / experimentation | PARTIAL | Implied in the marketing role, never stated. Make it explicit. |
| Stakeholder communication | ADDRESSED | Present but underplayed — strengthen. |
| Commercial / business acumen | PARTIAL | Economics degree helps. Add one bullet showing you understood the business impact, not just the number. |
| Statistical analysis | PARTIAL | Listed as a skill and implied by the regression model. Name the technique and the result. |

**Keyword mismatches:**
- You say "dashboards"; JDs increasingly say "self-serve reporting" and "data products"
- You say "statistical analysis"; JDs say "hypothesis testing," "significance," "confidence intervals" — use theirs
- You say "stakeholders"; specify seniority ("presented to founders") — it carries more weight

---

**WILL THEY SURVIVE THE FUNNEL?**

**Stage 2 (online tests):** Economics degree suggests numerical reasoning will be fine. Low risk.

**Stage 3 (competency interview):** Moderate risk. You have STAR-ready material in the internship, but the two round percentages are exactly what a competent interviewer will probe. Prepare the exact basis for both or replace them before applying.

**Stage 4 (assessment centre):** Reasonable position. The client-facing agency work and stakeholder presentations give you material for group exercises and presentations. Underplayed on the CV but usable in the room.

---

**THE ONE THING**

Replace the summary with one sentence containing your single most specific achievement.

Right now the top third of page one — where my eyes land in the first 2 seconds — contains three sentences of nothing. Meanwhile your most credible detail (50,000 property transactions) sits at the bottom where I may never reach it.

Move your best evidence to where my eyes actually go. That is a five-minute change worth roughly 8 points on its own.

---

**REWRITTEN SUMMARY**

> "Economics graduate (2:1) with a summer analytics internship at a fintech startup, where I built the company's first cohort retention view in SQL and replaced manual Excel reporting with Power BI. Independently analysed 50,000 UK property transactions in Python. Looking for a graduate analyst role in fintech where commercial context matters as much as the query."

What changed: named a real thing built, kept the credible unrounded number, stated the grade, stated what you want, and removed every self-describing adjective. No "data-driven," no "proven track record," no "fast-paced environment."

---

**WOULD YOU PUT THEM FORWARD?**

**Answer:** Maybe — and "maybe" is the problem.

You are currently competitive for Tier 3 fintech (Starling, Tide, Marshmallow, Cleo) and Tier 4 consulting analytics. You would land in the "maybe" pile at Tier 2 (Trainline, Skyscanner, Octopus) and would likely not clear Tier 1 (Monzo, Wise, Revolut) where the pile of "qualified" fills before "maybe" gets reviewed.

The gap to Tier 2 is not more experience. It is three specific things: fix the two unverifiable percentages, add cloud warehouse exposure, and put your best evidence in the top third. That is a fortnight of work and it moves you to roughly 80.

---
---

# EXAMPLE 3 — STRONG CV (Score: 89/100)

## The CV (abbreviated)

```
[Name] | [email] | [phone] | linkedin.com/in/[name] | github.com/[name] | [portfolio].vercel.app

Final-year BSc Computer Science student (predicted First). Built and shipped
a UK visa sponsorship analysis tool using Home Office register data across
10 historical snapshots and 133,979 companies. Published survival analysis
on sponsor licence retention. Looking for a graduate analytics role in
fintech or consumer tech.

EXPERIENCE

Marketing Coordinator (freelance) | [Startup] | Mar 2026 - Jun 2026
- Scripted and edited a founder story reel that became the company's
  highest-reach organic post at launch
- Built the content measurement framework the team still uses, tracking
  reach, watch time, and follower conversion per format

Bar Team Leader | [Chain] | Nov 2025 - present
- Lead a 6-person team across peak weekend service in a 400-cover venue
- Trained 4 new starters on licensing compliance and cellar procedure

PROJECTS

UK Sponsor Analysis — [live URL] | [GitHub]
- Assembled a panel dataset of 133,979 UK licensed sponsors across 10
  register snapshots (Sept 2023 - July 2026, ~1.03m rows)
- Ran Kaplan-Meier and Cox proportional hazards models on licence
  retention; documented interval censoring and left truncation honestly
- Matched 449 job postings to sponsors via fuzzy entity matching at 50.6%
  match rate, manually validating a 50-row sample
- Shipped a live tool that scores a CV against real posting requirements
  and ranks sponsors by modelled licence stability

RESEARCH
Co-author, exoplanet orbital parameter estimation using conformal
prediction intervals; validated against NASA Exoplanet Archive data
including 51 Peg b. [GitHub]

LEADERSHIP
President, International Society (from Sept 2026). Grew society Instagram
400 → 750 followers (+88%); sold 200+ tickets for flagship event.

SKILLS
SQL, Python (pandas, NumPy, scikit-learn, lifelines), survival analysis,
Power BI, FAISS, Next.js/React, PostgreSQL, Git, rapidfuzz

EDUCATION
BSc Computer Science (Year in Industry), [University], predicted First.
Second year: 69.25%.
```

## The Feedback

---

**THE 7-SECOND VERDICT**

**Bucket:** QUALIFIED

What my eyes caught in 7.4 seconds:
- **Name:** With LinkedIn, GitHub, and a live portfolio URL — three verification routes
- **Current title:** Two current roles, one analytics-adjacent, one leadership
- **Current company:** Startup plus a named chain
- **Dates and progression:** Clean, no gaps, overlapping roles show capacity
- **Previous role:** Coherent
- **Education:** Predicted First, stated openly with the actual second-year mark

**Instant impression:** The summary told me what you built and gave me a number in the first line. I stopped scanning and started reading, which almost never happens. I want to click the live URL.

---

**SCORES**

| Category | Score | Verdict |
|---|---|---|
| Seven-Second Survivability | 19/20 | Best evidence in the top third, three verification links, clean structure |
| Evidence of Real Impact | 18/20 | Specific unrounded numbers throughout; one or two bullets still lack outcome |
| Authenticity vs AI Sameness | 19/20 | Unmistakably a real person. Nobody else could have written this. |
| Relevance and Skills Credibility | 17/20 | Every skill evidenced. Minor gaps in cloud tooling. |
| Differentiation and Progression | 16/20 | Highly memorable. Bar role slightly underleveraged. |
| **TOTAL** | **89/100** | Strong. Would put forward. |

---

**THE AI SAMENESS TEST**

This is the strongest AI-sameness performance I see, and it is worth explaining why, because it is the opposite of what most CV advice recommends.

Nothing here reads as generated. The reasons:

- **"133,979 companies"** and **"~1.03m rows"** and **"50.6% match rate"** — these are awkward, precise, un-round numbers. No language model produces "50.6%." It produces "over 50%." Precision reads as truth.
- **"documented interval censoring and left truncation honestly"** — this is a methodological detail only someone who actually did the work would think to mention. It is also a subtle competence signal: you know the limitations of your own model.
- **"manually validating a 50-row sample"** — nobody fabricating a project invents the validation step.
- **"Second year: 69.25%"** — stating a mark that narrowly missed a threshold is a credibility move. It reads as someone who does not hide things.
- **The bar team leader role sitting next to survival analysis** is a combination no template produces. It reads as a real life.

Zero interchangeable sentences. Zero self-describing adjectives. No "data-driven," no "passionate," no "proven track record."

This is what authenticity looks like on paper in 2026, and it is a genuine competitive advantage when 139 other applications read as optimised.

---

**RED FLAGS FOUND**

Genuinely almost none, which is rare. Two minor notes:

1. **Predicted grade with a stated shortfall.** "Predicted First" alongside "69.25%" is honest but invites the question of whether the First will land. Some recruiters will read the honesty positively; a few will read the risk. On balance keep it — omitting the mark would be worse — but be ready to explain your final-year plan.

2. **Two concurrent roles plus society presidency plus research plus projects.** A cautious recruiter may wonder about capacity. Not a rejection risk, but expect a question about how you manage load. Have a crisp answer.

No typos. No gaps. No unverifiable claims. No formatting issues.

---

**TYPOS AND ERRORS**

None found. Formatting consistent, British English throughout, dates uniform.

---

**PAGE ONE / PAGE TWO AUDIT**

Everything visible in the scan zone. The summary carries your single best achievement, which is exactly correct use of top-third real estate.

One note: if this runs to two pages, ensure the Sponsor Analysis project stays on page one. It is your strongest asset and page two is effectively invisible on first pass.

---

**WHAT IS ACTUALLY WORKING**

1. **The summary leads with a built thing and a number.** "133,979 companies" in the first two lines. This is the correct structure and almost nobody does it.
2. **Three verification links in the header.** LinkedIn, GitHub, live portfolio. I can validate you in 30 seconds, which materially reduces my risk in a market where I am spending more time validating whether experience is genuine.
3. **"Documented interval censoring and left truncation honestly."** This single phrase does more for your technical credibility than any certification. It tells me you understand the limits of your own analysis, which is the rarest quality in graduate analysts.
4. **A live URL.** Almost no graduate candidate has something I can click and use. This alone separates you from most of the pile.
5. **The research line.** Conformal prediction and a named validation target (51 Peg b) is a genuine differentiator. Very few graduate CVs carry real research.
6. **Quantified society leadership.** "400 → 750 (+88%)" and "200+ tickets" — most candidates write "grew the society's social media." You gave me the arithmetic.
7. **You did not hide the bar job.** Including it alongside survival analysis reads as confidence, not padding. It also tells me you can lead people under pressure, which many technically strong candidates cannot.

---

**LINE BY LINE — EXPERIENCE SECTION**

**Original:** "Scripted and edited a founder story reel that became the company's highest-reach organic post at launch"
**Verdict:** STRONG
**Why:** Specific artefact, specific outcome, honest qualifier ("at launch"). Credible.
**Rewrite:** Not needed. Optionally add the reach figure if you have it.

**Original:** "Built the content measurement framework the team still uses, tracking reach, watch time, and follower conversion per format"
**Verdict:** STRONG
**Why:** "Still uses" is excellent — it proves durable value, not just delivery. Naming the three metrics shows you know what matters.
**Rewrite:** Not needed.

**Original:** "Lead a 6-person team across peak weekend service in a 400-cover venue"
**Verdict:** STRONG
**Why:** Scale on both team and venue. Concrete.
**Rewrite:** Not needed.

**Original:** "Trained 4 new starters on licensing compliance and cellar procedure"
**Verdict:** STRONG but underleveraged
**Why:** Good specifics. However, for an analytics role, this bullet does not connect to the target. There is likely an operational or commercial angle here you are leaving on the table.
**Rewrite:** Consider adding one bullet with a number that reframes this for analytics: till accuracy, stock variance, wastage reduction, or shift throughput. Something that shows you notice numbers even in a bar.

**Original:** "Assembled a panel dataset of 133,979 UK licensed sponsors across 10 register snapshots (Sept 2023 - July 2026, ~1.03m rows)"
**Verdict:** STRONG
**Why:** Scale, timeframe, and row count. Unimpeachable.

**Original:** "Ran Kaplan-Meier and Cox proportional hazards models on licence retention; documented interval censoring and left truncation honestly"
**Verdict:** STRONG
**Why:** Named methods plus stated limitations. This is the line that will get you the interview.
**Rewrite:** Not needed. But be ready to explain both censoring issues in interview — you will be asked.

**Original:** "Matched 449 job postings to sponsors via fuzzy entity matching at 50.6% match rate, manually validating a 50-row sample"
**Verdict:** STRONG
**Why:** Includes the validation step, which almost nobody does. The un-round 50.6% reads as real.
**Rewrite:** Not needed. Consider adding the measured precision from the manual sample — that number is your credibility proof.

**Original:** "Shipped a live tool that scores a CV against real posting requirements and ranks sponsors by modelled licence stability"
**Verdict:** STRONG, needs one addition
**Why:** Excellent that it shipped. Missing: usage.
**Rewrite:** Add user numbers once you have them. "Used by X people in the first month" converts this from a project to a product, and that is worth several points.

---

**JOB DESCRIPTION GAP ANALYSIS**

*(Assuming target: Graduate Data Analyst, London fintech)*

| Requirement | Status | What to add |
|---|---|---|
| SQL | ADDRESSED | Evidenced. Consider naming window functions or CTEs to signal depth. |
| Python / pandas | ADDRESSED | Strongly evidenced, including scikit-learn and lifelines. |
| Statistical methods | ADDRESSED | Survival analysis is above the expected bar. |
| Data visualisation | PARTIAL | Power BI listed but not evidenced in any project. Add one dashboard artefact. |
| Cloud warehouse (BigQuery / Snowflake) | MISSING | The one real technical gap. Your project used local storage. Load one dataset into BigQuery's free tier and add it. |
| dbt | MISSING | Worth a weekend. Appears on most London analyst JDs now. |
| A/B testing / experimentation | PARTIAL | Implied in content measurement. Make it explicit with one experiment. |
| Stakeholder communication | ADDRESSED | Founder-facing freelance work plus society leadership. |
| Commercial awareness | ADDRESSED | The sponsor tool is inherently commercial. |
| Degree | ADDRESSED | Predicted First stated. |

**Keyword mismatches:** minimal. Two small ones:
- You say "survival analysis"; some JDs say "churn modelling" or "retention analysis" — mirror their term when it appears
- You say "shipped"; corporate JDs often say "delivered" or "implemented" — adjust per application

---

**WILL THEY SURVIVE THE FUNNEL?**

**Stage 2 (online tests):** Low risk. Strong quantitative profile.

**Stage 3 (competency interview):** Strong position. Every bullet has enough substance for a two-minute STAR answer. Prepare specifically for: "explain interval censoring to a non-technical stakeholder" and "what would you do differently on the sponsor project" — both will come up and both are opportunities.

**Stage 4 (assessment centre):** Very strong. Society presidency, bar team leadership, and founder-facing freelance work give you genuine material for group exercises, presentations, and pressure scenarios. Most technically strong candidates fail here. You should not.

---

**THE ONE THING**

Add usage numbers to the live tool.

Right now it says "shipped a live tool." Once it says "used by 200 people in the first six weeks, with 60% returning," you have crossed from "built a project" to "built a product people use" — and that is the single largest remaining gap between this CV and a Tier 1 offer.

It also unlocks a second layer of analytical evidence: analysing your own product's usage is exactly what growth analysts do all day.

---

**REWRITTEN SUMMARY**

Your existing summary is already strong. One tightening:

> "Final-year BSc Computer Science student (predicted First). Built and shipped a live UK visa sponsorship tool on a self-assembled panel of 133,979 sponsors across 10 register snapshots, running survival analysis on licence retention. Co-author on published research in conformal prediction. Looking for a graduate analytics role in fintech or consumer tech."

The change: "self-assembled" signals you built the dataset rather than downloading it, which is the harder and more impressive thing. And moving the research line into the summary gets it into the scan zone.

---

**WOULD YOU PUT THEM FORWARD?**

**Answer:** Yes, without hesitation.

Realistic position: genuinely competitive at Tier 2 and Tier 3 across the board, and a credible candidate at Tier 1 (Monzo, Wise, Revolut) — which is unusual for a non-target university with a predicted rather than confirmed First.

What moves you from strong to exceptional: usage numbers on the live tool, one cloud warehouse project, and the First actually landing. All three are within your control in the next 10 months.

One honest note: at 89/100 the CV is no longer your bottleneck. Interview performance is. Spend the next block of preparation time on articulating this work out loud rather than on the document.

---
---

# CALIBRATION GUIDE

Use these bands consistently.

| Band | Score | Characteristics | Typical outcome |
|---|---|---|---|
| **Exceptional** | 90-100 | Shipped work with users. Precise unrounded numbers throughout. Zero red flags. Verification links. Methodological honesty. Memorable differentiator. | Interview at any tier |
| **Strong** | 80-89 | Real experience, quantified. Portfolio or GitHub live. Minor gaps only. Reads authentically human. | Interview at Tier 2-3, competitive at Tier 1 |
| **Solid** | 70-79 | Relevant experience present. Some numbers but a few unverifiable. Somewhat generic phrasing. Small red flags. | "Maybe" pile. Interview at Tier 3-4 |
| **Borderline** | 60-69 | Relevant background, thin evidence. Round percentages without baselines. Generic summary. Tool claims unevidenced. | Rarely progresses unless volume is low |
| **Weak** | 45-59 | Little quantification. Tutorial projects. Generic throughout. Multiple red flags. | Does not progress |
| **Needs rebuild** | Below 45 | No numbers. No evidence. Skill stuffing. Unprofessional details. Template language. | Immediate rejection |

**Consistency rules:**

- A CV with zero quantified bullets cannot score above 50, regardless of pedigree
- A CV with a broken or empty portfolio/GitHub link for a role requiring one cannot score above 55
- A single typo caps the Seven-Second Survivability category at 14/20
- Tutorial-only projects cap Evidence of Real Impact at 8/20
- No baseline on any percentage claim costs 2 points from Evidence of Real Impact per instance
- Entirely generic summary caps Authenticity at 12/20
- Shipped work with real users adds 3-5 points to Differentiation
- Stated methodological limitations add 2-3 points to Authenticity — almost nobody does this and it reads as genuine competence

**Never do this:**
- Never give a round score like 70 or 80 without the category breakdown supporting it
- Never score above 85 without at least one piece of evidence the candidate shipped something real
- Never score below 40 if the candidate has a relevant degree and a clean layout — that combination is worth more than 40 and the feedback should be constructive about the distance
