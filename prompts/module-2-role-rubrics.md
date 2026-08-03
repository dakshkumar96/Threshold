# MODULE 2 — Role-Specific Rubric Library

**Inject ONLY the rubric matching the user's target role. Never all of them.**

Each rubric is 400-600 words. Adds ~600-800 tokens to the call.

---

## HOW TO CLASSIFY THE TARGET ROLE

Map the user's stated role to one of these 12 families. If ambiguous, pick the closest and note the assumption in your feedback.

| Family | Includes |
|---|---|
| A. Data & Analytics | data analyst, business analyst, BI analyst, analytics engineer, data scientist, insight analyst, reporting analyst, growth analyst, product analyst |
| B. Software Engineering | backend, frontend, full-stack, mobile, platform, DevOps, SRE, QA engineer, graduate software engineer |
| C. Product Management | product manager, associate PM, product owner, technical PM |
| D. Marketing & Growth | digital marketing, growth marketing, performance marketing, content, SEO, social media, brand, CRM, marketing executive |
| E. Finance & Accounting | financial analyst, accountant, audit, tax, FP&A, treasury, investment analyst, actuarial |
| F. Consulting & Strategy | management consultant, strategy analyst, business consultant, transformation |
| G. Operations & Supply Chain | operations analyst, supply chain, logistics, procurement, process improvement |
| H. Sales & Business Development | SDR, BDR, account executive, account manager, partnerships, customer success |
| I. HR & People | HR advisor, talent acquisition, recruiter, people ops, L&D, reward |
| J. Design | UX designer, UI designer, product designer, graphic designer, UX researcher |
| K. Hospitality, Retail & Service | bar, restaurant, hotel, retail, customer service, front of house, team leader |
| L. Engineering (non-software) | mechanical, civil, electrical, chemical, manufacturing, project engineer |

---

## RUBRIC A — DATA & ANALYTICS

**What recruiters in this field actually screen for, in order:**

1. **SQL, non-negotiable.** If SQL is not on the CV, the application usually stops. It must appear in the skills section AND be evidenced in at least one role or project.
2. **A named visualisation tool.** Power BI, Tableau, Looker, or Qlik. Excel alone does not count for analyst roles above entry level.
3. **Python or R** for anything above pure reporting. Pandas specifically for data manipulation roles.
4. **Evidence of a business decision changed.** This is the single biggest differentiator. Most candidates list tools. Very few can point to a decision that changed because of their analysis.
5. **Cloud/warehouse exposure.** BigQuery, Snowflake, Redshift, Databricks, dbt. Increasingly expected even at graduate level in 2026.
6. **Stakeholder communication.** Analysts sit between technical and non-technical. Evidence of presenting findings to non-analysts matters.

**Must-have keyword clusters:**
SQL, Python, pandas, NumPy, Power BI, Tableau, Looker, Excel (advanced/pivot tables/Power Query), data cleaning, ETL, data modelling, dashboards, A/B testing, statistical analysis, KPIs, stakeholder management, data visualisation, Git, dbt, BigQuery, Snowflake

**Role-specific red flags:**
- Lists "data analysis" as a skill without naming a single tool
- Lists 15+ tools with no evidence any were used in anger
- Projects that are clearly tutorial datasets (Titanic, Iris, Netflix, Amazon reviews) — recruiters see these dozens of times per cycle and they signal "followed a course" not "did the work"
- Dashboards described with no mention of who used them or what changed
- "Machine learning" claimed with no model, dataset, or outcome named
- Certifications listed prominently while the experience section has no quantified analysis

**How achievements must be quantified in this field:**
Weak: "Created dashboards to track performance"
Strong: "Built a Power BI dashboard tracking 4 acquisition channels, cutting weekly reporting time from 3 hours to 20 minutes and surfacing a 23% budget inefficiency in paid social"

The pattern: tool + what was measured + what changed + the number.

**Seniority markers:**
- Graduate: one strong project with real data, SQL evidenced, a named viz tool
- 1-3 years: owns a reporting area, has influenced at least one decision, comfortable with stakeholders
- 3-5 years: designs measurement frameworks, mentors, owns a data domain end to end
- 5+: sets analytical strategy, builds team capability

**What to tell candidates who fall short:**
The fastest fix for a weak data CV is almost always the same: replace one tutorial project with one project on real messy data that ends in a recommendation. Not a chart. A recommendation with a number attached.

---

## RUBRIC B — SOFTWARE ENGINEERING

**What recruiters screen for, in order:**

1. **Shipped code that someone used.** Not coursework. Not a tutorial clone. Something deployed with users, however few.
2. **A GitHub link that works and has commits.** An empty or stale GitHub is worse than none. Recruiters click it.
3. **Language and framework match to the JD.** A React role wants React on the CV, not "JavaScript frameworks."
4. **Evidence of engineering practice, not just coding.** Testing, version control, CI/CD, code review, documentation.
5. **Scale or complexity signals.** Number of users, requests handled, data volume, team size, system components.
6. **Problem-solving evidence.** What broke and how they fixed it. Debugging stories carry weight.

**Must-have keyword clusters:**
Named languages (Python, Java, JavaScript, TypeScript, Go, C#, Swift, Kotlin), frameworks (React, Next.js, Node, Django, Spring, .NET), Git, CI/CD, testing (unit, integration, Jest, pytest), REST/GraphQL APIs, Docker, Kubernetes, AWS/Azure/GCP, PostgreSQL/MySQL/MongoDB, Agile/Scrum, code review, system design

**Role-specific red flags:**
- Long list of languages with no depth in any
- GitHub link that 404s, is empty, or has no commits in 12 months
- Only tutorial-clone projects (to-do app, weather app, clone of a famous site) with no original problem
- "Full-stack developer" with no deployed full-stack project
- No mention of testing anywhere
- Hackathon projects listed as if they were production systems
- Claims of "developed a system" with no indication of scope or whether it shipped

**How achievements must be quantified:**
Weak: "Developed a web application using React"
Strong: "Built and deployed a React/Node dashboard used by 40 society committee members, reducing event check-in time from 6 minutes to under 1"

The pattern: what you built + who used it + what improved + the number.

**Seniority markers:**
- Graduate: 2-3 real projects, one deployed, Git fluency, one language properly known
- 1-3 years: owns features end to end, writes tests, participates in code review
- 3-5 years: system design input, mentors juniors, owns a service
- 5+: architecture decisions, technical leadership, cross-team influence

---

## RUBRIC C — PRODUCT MANAGEMENT

**What recruiters screen for:**

1. **Evidence of shipping something.** PM candidates without a shipped product are the most common rejection.
2. **Metrics ownership.** Which number did they move, and by how much?
3. **User research evidence.** Did they talk to users, or guess?
4. **Prioritisation reasoning.** Any evidence they said no to something and can explain why.
5. **Cross-functional working.** Engineering, design, data, sales — PM lives between functions.
6. **Commercial awareness.** Understanding of the business model, not just the feature set.

**Must-have keyword clusters:**
Product roadmap, user research, user stories, backlog prioritisation, A/B testing, product metrics (retention, activation, churn, LTV, CAC, NPS), stakeholder management, Agile/Scrum, Jira, Figma, analytics tools (Amplitude, Mixpanel, GA4), discovery, MVP, go-to-market, competitive analysis

**Role-specific red flags:**
- Describes features built with no mention of outcome or metric
- No evidence of ever talking to a user
- "Managed the roadmap" with no indication of trade-offs made
- Confuses project management with product management (delivery vs outcome)
- No commercial framing anywhere
- Side projects listed with no users

**How achievements must be quantified:**
Weak: "Managed the product roadmap and worked with engineering"
Strong: "Prioritised and shipped a simplified onboarding flow after 12 user interviews, lifting week-1 activation from 34% to 51% over two months"

The pattern: what you decided + why (evidence) + what shipped + which metric moved + by how much.

---

## RUBRIC D — MARKETING & GROWTH

**What recruiters screen for:**

1. **Channel-specific proof.** Which channel, which platform, which result.
2. **Numbers on everything.** Marketing is the most measurable function and unquantified marketing CVs are heavily penalised.
3. **Budget responsibility.** How much did they manage? Even small budgets count if stated.
4. **Analytics fluency.** GA4 is now table stakes. Attribution understanding is a differentiator.
5. **Content or creative evidence.** A portfolio, a channel, published work.
6. **Growth thinking vs task execution.** Did they run experiments or just post?

**Must-have keyword clusters:**
GA4, Google Ads, Meta Ads, LinkedIn Ads, SEO (on-page, technical, keyword research), SEM/PPC, CRO, email marketing (Mailchimp, Klaviyo, HubSpot), CRM, content strategy, social media management, copywriting, A/B testing, attribution, CAC, ROAS, CTR, conversion rate, engagement rate, marketing automation, Canva/Figma/Adobe

**Role-specific red flags:**
- "Increased engagement" with no number
- "Managed social media" with no follower/reach/conversion figures
- No named analytics tool
- Percentage improvements with no baseline ("increased traffic by 300%" from 10 visits is meaningless — recruiters know this trick)
- No portfolio or channel link for a content role
- Lists tools without campaigns

**How achievements must be quantified:**
Weak: "Grew the society's Instagram following and increased engagement"
Strong: "Grew society Instagram from 400 to 750 followers in 8 months (+88%), driving 200+ ticket sales for the flagship event through organic content alone"

The pattern: channel + starting point + ending point + timeframe + the commercial outcome.

**Note on baselines:** Always flag percentage claims that lack a baseline. Recruiters discount them and it damages credibility.

---

## RUBRIC E — FINANCE & ACCOUNTING

**What recruiters screen for:**

1. **Professional qualification status.** ACA, ACCA, CIMA, CFA — which level, when expected. This is often the first filter.
2. **Excel depth.** Not "proficient in Excel." Named functions, modelling, Power Query, VBA if relevant.
3. **Systems exposure.** SAP, Oracle, Xero, Sage, NetSuite, Workday.
4. **Accuracy signals.** Finance recruiters are hypersensitive to typos and numerical errors — a CV error implies a ledger error.
5. **Scale of responsibility.** Budget size, transaction volume, entity count, team size.
6. **Regulatory awareness.** IFRS, UK GAAP, SOX, audit standards where relevant.

**Must-have keyword clusters:**
Financial modelling, forecasting, budgeting, variance analysis, month-end close, reconciliation, management accounts, P&L, balance sheet, cash flow, IFRS, UK GAAP, VAT, payroll, audit, Excel (VLOOKUP/INDEX-MATCH/pivot tables/Power Query), SAP, Oracle, Xero, Sage, Power BI, ACA/ACCA/CIMA/CFA

**Role-specific red flags:**
- Any numerical inconsistency anywhere on the CV
- Any typo (weighted more heavily than in other fields)
- Qualification mentioned without stating stage or expected completion
- "Assisted with" language throughout — suggests no ownership
- No indication of scale (budget, volume, entities)
- Excel listed as a skill with no evidence of advanced use

**How achievements must be quantified:**
Weak: "Assisted with month-end close and prepared reports"
Strong: "Owned month-end close for 3 entities (£4m combined turnover), reducing close cycle from 9 to 6 working days by automating reconciliation in Power Query"

---

## RUBRIC F — CONSULTING & STRATEGY

**What recruiters screen for:**

1. **Structured thinking evidence.** Can they break a problem into parts? The CV itself should demonstrate structure.
2. **Academic signal.** Consulting remains more credential-sensitive than most fields. Grade, university, and any quantitative subject matter.
3. **Client-facing evidence.** Any experience presenting to or advising someone senior.
4. **Analytical rigour with commercial framing.** Analysis that led to a business recommendation.
5. **Leadership and extracurricular depth.** Society presidencies, competitions, and initiatives carry more weight here than in other fields.
6. **Written communication quality.** The CV is a writing sample.

**Must-have keyword clusters:**
Problem structuring, hypothesis-driven analysis, market analysis, competitive benchmarking, financial modelling, stakeholder engagement, workshop facilitation, PowerPoint, Excel, data analysis, recommendation, business case, process mapping, change management, project delivery

**Role-specific red flags:**
- No quantitative evidence anywhere
- Poor written structure in the CV itself
- No leadership or initiative outside academic work
- Vague "worked on a project" descriptions with no problem, method, or outcome
- Grade omitted (consulting recruiters assume the worst)

**How achievements must be quantified:**
Weak: "Worked on a consulting project for a local business"
Strong: "Analysed 18 months of transaction data for an independent café, identified a 31% drop-off in repeat visits after week 3, and recommended a loyalty mechanic projected to recover £8k annually"

The pattern: problem + method + finding + recommendation + projected value.

---

## RUBRIC G — OPERATIONS & SUPPLY CHAIN

**What recruiters screen for:**

1. **Process improvement with numbers.** Time saved, cost reduced, error rate cut.
2. **Systems exposure.** ERP, WMS, inventory systems.
3. **Scale.** Units, SKUs, sites, headcount, spend.
4. **Continuous improvement methodology.** Lean, Six Sigma, Kaizen, 5S if relevant.
5. **Cross-functional coordination.** Operations sits between everyone.
6. **Data comfort.** Excel minimum, increasingly SQL and Power BI.

**Must-have keyword clusters:**
Process improvement, Lean, Six Sigma, Kaizen, root cause analysis, KPI tracking, inventory management, demand forecasting, supplier management, procurement, logistics, ERP (SAP, Oracle, NetSuite), WMS, Excel, Power BI, SOPs, capacity planning, cost reduction, OTIF, stock accuracy

**Role-specific red flags:**
- Process work described with no before/after metric
- No system named
- No indication of scale
- "Improved efficiency" with no number

**How achievements must be quantified:**
Weak: "Improved warehouse processes"
Strong: "Redesigned picking route across a 12,000 sq ft warehouse, cutting average pick time 22% and reducing mispicks from 3.1% to 1.4% over one quarter"

---

## RUBRIC H — SALES & BUSINESS DEVELOPMENT

**What recruiters screen for:**

1. **Numbers, above everything.** Quota, attainment percentage, revenue generated, deals closed, pipeline built. A sales CV without numbers is almost automatically rejected.
2. **Quota attainment history.** Percentage against target, by period.
3. **Deal size and cycle.** Average deal value, sales cycle length, segment (SMB, mid-market, enterprise).
4. **CRM fluency.** Salesforce, HubSpot, Pipedrive.
5. **Prospecting evidence.** Outbound volume, conversion rates, channels used.
6. **Progression.** Sales careers should show clear upward movement.

**Must-have keyword clusters:**
Quota, target attainment, pipeline, revenue, ARR/MRR, closed-won, outbound prospecting, cold calling, cold email, discovery calls, demos, negotiation, account management, upsell, cross-sell, churn, Salesforce, HubSpot, MEDDIC/SPIN/Challenger, lead qualification, conversion rate

**Role-specific red flags:**
- No quota or revenue figures anywhere (the single biggest issue)
- "Consistently exceeded targets" with no percentages
- No CRM named
- No deal size or cycle information
- Flat progression over many years

**How achievements must be quantified:**
Weak: "Consistently exceeded sales targets and built strong client relationships"
Strong: "Achieved 118% of £240k annual quota in FY25, closing 34 new SMB accounts with average deal value £7.1k and a 42-day average cycle"

---

## RUBRIC I — HR & PEOPLE

**What recruiters screen for:**

1. **CIPD level** if applicable, and stage.
2. **Employee lifecycle coverage.** Which parts have they actually owned?
3. **Systems.** HRIS platforms — Workday, BambooHR, HiBob, SAP SuccessFactors.
4. **Employment law awareness.** UK-specific.
5. **Data and metrics.** Time-to-hire, attrition, engagement scores, headcount managed.
6. **Sensitivity and judgement signals.** ER case handling, confidentiality.

**Must-have keyword clusters:**
Recruitment, onboarding, employee relations, performance management, absence management, employment law, TUPE, redundancy, grievance, disciplinary, CIPD, HRIS, Workday, BambooHR, engagement surveys, L&D, reward and benefits, payroll, DEI, attrition, time-to-hire

**Role-specific red flags:**
- No named HRIS
- No metrics at all (HR is increasingly data-driven)
- No employment law reference for advisory roles
- Vague "supported the HR team" throughout

**How achievements must be quantified:**
Weak: "Supported recruitment across the business"
Strong: "Ran end-to-end recruitment for 24 hires across 3 departments, reducing average time-to-hire from 47 to 31 days and cutting agency spend by £18k"

---

## RUBRIC J — DESIGN

**What recruiters screen for:**

1. **Portfolio link, first and always.** No portfolio equals no consideration. It must be in the top third of page one.
2. **Process evidence, not just outcomes.** How they got to the design matters as much as the design.
3. **Tool fluency.** Figma is standard. Adobe suite where relevant.
4. **Research evidence.** User interviews, usability testing, data informing decisions.
5. **Business impact.** Design that moved a metric.
6. **Collaboration with engineering.** Handoff, design systems, feasibility awareness.

**Must-have keyword clusters:**
Figma, Sketch, Adobe XD/Photoshop/Illustrator, wireframing, prototyping, user research, usability testing, design systems, accessibility (WCAG), responsive design, information architecture, user flows, personas, journey mapping, A/B testing, design critique, handoff

**Role-specific red flags:**
- No portfolio link, or a broken one (immediate rejection)
- Portfolio shows outcomes with no process
- No research evidence anywhere
- No metric attached to any design decision
- Only visual work for a UX role

**How achievements must be quantified:**
Weak: "Redesigned the checkout page to improve user experience"
Strong: "Redesigned checkout after usability testing with 8 users identified 3 friction points; reduced cart abandonment from 68% to 54% over 6 weeks"

---

## RUBRIC K — HOSPITALITY, RETAIL & SERVICE

**What recruiters screen for:**

1. **Reliability and tenure.** Short stints matter more here than candidates expect.
2. **Volume and pace evidence.** Covers served, transactions per shift, venue capacity.
3. **Responsibility progression.** Team member to shift lead to supervisor.
4. **Certifications.** Food hygiene, allergen awareness, personal licence, first aid.
5. **Customer outcome evidence.** Reviews, feedback scores, complaint resolution.
6. **Cash and stock accountability.** Till accuracy, stock loss, cash handling volume.

**Must-have keyword clusters:**
Customer service, till operation, cash handling, stock management, food hygiene (Level 2), allergen awareness, health and safety, opening/closing procedures, team leadership, rota management, upselling, complaint resolution, POS systems, licensing law, cellar management

**Role-specific red flags:**
- No certifications listed when the role requires them
- No indication of venue size or volume
- Multiple very short stints with no explanation
- "Provided excellent customer service" with no evidence

**How achievements must be quantified:**
Weak: "Worked as a bartender providing customer service"
Strong: "Led a 6-person bar team across peak weekend service in a 400-cover venue, maintaining till accuracy above 99.5% and training 4 new starters on licensing compliance"

**Important note for this family:** Candidates in hospitality and retail systematically undersell transferable skills. Always flag where operational, leadership, and commercial experience could be reframed for the target role — especially if the target role is outside hospitality.

---

## RUBRIC L — ENGINEERING (NON-SOFTWARE)

**What recruiters screen for:**

1. **Chartership status.** IEng, CEng, or working towards. Institution membership (IMechE, ICE, IET).
2. **Technical software.** CAD (SolidWorks, AutoCAD, Revit), simulation (ANSYS, MATLAB).
3. **Standards and codes awareness.** Relevant BS/EN/ISO standards.
4. **Project scale.** Budget, duration, team, physical scale.
5. **Safety and compliance.** CDM, HAZOP, risk assessment.
6. **Problem-solving with measurable outcome.**

**Must-have keyword clusters:**
CAD (SolidWorks, AutoCAD, Revit, Inventor), FEA, ANSYS, MATLAB, tolerance analysis, design for manufacture, project management, CDM regulations, risk assessment, HAZOP, BS/EN/ISO standards, commissioning, testing, root cause analysis, CEng/IEng, IMechE/ICE/IET

**Role-specific red flags:**
- No named CAD or analysis software
- No standards referenced
- No project scale given
- Chartership status unclear
- Academic projects presented as professional work without distinction

**How achievements must be quantified:**
Weak: "Worked on the design of mechanical components"
Strong: "Redesigned a bracket assembly in SolidWorks, running FEA to cut mass 18% while maintaining a 2.5 safety factor, saving £11k annually across production volume of 8,000 units"

---

## CROSS-ROLE PRINCIPLE

Whatever the family, the quantification pattern is the same:

**What you did + the scale you did it at + what changed + the number**

If a bullet is missing any of those four elements, it is weak. Flag it and rewrite it with the elements the candidate's own material supports. Never invent the number — if it is missing, tell them exactly what number to find and add.
