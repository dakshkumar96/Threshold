import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle,
  MagnifyingGlass,
  Path,
  SealCheck,
  Student,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Sponsor Signal exists, how sponsor checks work, and what the product does and does not claim.",
};

const STATS = [
  { value: "133,979", label: "Sponsor licences checked per search", note: "Home Office register, refreshed monthly" },
  { value: "200", label: "Live UK ads analysed per search", note: "Reed, Adzuna, and mapped ATS boards" },
  { value: "59%", label: "Name-match precision", note: "Documented on a 100-sample review" },
  { value: "10", label: "Register snapshots since 2023", note: "Used for licence tenure context" },
];

const FOR_WHO = [
  {
    title: "International students",
    body: "You need a sponsored role before your Graduate visa runs out, and you cannot afford another dead-end application.",
  },
  {
    title: "Recent graduates",
    body: "You are qualified on paper, but the market keeps asking for skills you have not listed yet, and you need a clear sequence.",
  },
  {
    title: "Anyone tired of guessing",
    body: "You have clicked \"visa sponsorship available\" too many times and watched half the results fall apart after HR got involved.",
  },
];

const FLOW = [
  {
    n: "01",
    t: "Search a role",
    d: "Type any UK job title. We pull up to 200 live ads from Reed and Adzuna, plus roles from mapped employer career boards where available.",
  },
  {
    n: "02",
    t: "Check every sponsor",
    d: "Each employer is cross-referenced against the current Home Office Skilled Worker register. Verified means we confirmed it on the company careers page. Name matches carry a confidence score.",
  },
  {
    n: "03",
    t: "Read the market",
    d: "Every job description is scanned for skills, seniority signals, and salary against the visa threshold. You see what this specific role market is asking for right now.",
  },
  {
    n: "04",
    t: "Build your next step",
    d: "Upload a CV and you get a match score, prioritised gaps, weeks-to-learn estimates, CV guidance, and a shortlist of sponsored roles worth applying to.",
  },
];

const CONFIDENCE = [
  {
    label: "Verified",
    tone: "mint" as const,
            body: "The role came from the employer's own careers page or ATS board. Employer identity is certain.",
  },
  {
    label: "Likely",
    tone: "indigo" as const,
    body: "Strong name match against the register. Useful signal, still not the same as a verified careers-page match.",
  },
  {
    label: "Possible",
    tone: "amber" as const,
    body: "Weaker name match. We show it with a dashed treatment so you know it needs extra caution.",
  },
];

const PROMISES = [
  {
    Icon: SealCheck,
    t: "Honest confidence",
    d: "We label uncertainty. A name match is a guess with a score, not a guarantee that HR will sponsor you.",
  },
  {
    Icon: MagnifyingGlass,
    t: "Live market data",
    d: "Skills and gaps come from the ads in your search, not a generic checklist or last year's advice.",
  },
  {
    Icon: Path,
    t: "A practical roadmap",
    d: "What to learn first, what to rewrite on your CV, and which sponsored roles fit your current profile.",
  },
  {
    Icon: Student,
    t: "Calm under pressure",
    d: "Built for people already stressed about visas and time. Clear next steps, no fake urgency.",
  },
];

const NOT_THIS = [
  "A guarantee that a company will hire or sponsor you",
  "Proof that an employer previously hired international graduates",
  "Immigration advice from a solicitor",
  "A prediction of visa approval",
  "A job board that hides uncertainty behind a green tick",
];

const IS_THIS = [
  "A check against the live Home Office sponsor register",
  "Confidence labels you can actually interpret",
  "Skill demand from the ads you just searched",
  "A roadmap grounded in that market picture",
  "Documented accuracy, including the 59% name-match figure",
];

export default function AboutPage() {
  return (
    <main className="about-page pb-24">
      <section className="about-hero section-orb">
        <div className="about-hero__copy">
          <h1>
            Built after the HR conversation that ends the offer.
          </h1>
          <p>
            Sponsor Signal helps international students find UK roles that can actually
            sponsor a Skilled Worker visa, understand how strong each sponsor match is,
            and see what to improve next. It exists because guessing is expensive when
            your visa clock is already running.
          </p>
          <div className="about-hero__actions">
            <Link href="/search" className="cta-primary about-cta">
              Try a search
            </Link>
            <Link href="/methodology" className="cta-secondary about-cta">
              Read the methodology
            </Link>
          </div>
        </div>
        <aside className="about-hero__panel" aria-label="At a glance">
          <p className="about-panel-kicker">At a glance</p>
          <ul>
            <li>
              <SealCheck size={18} weight="fill" color="#10B981" aria-hidden />
              <span>Live ads + Home Office register in one search</span>
            </li>
            <li>
              <CheckCircle size={18} weight="fill" color="#4F6EF7" aria-hidden />
              <span>Verified, likely, and possible confidence labels</span>
            </li>
            <li>
              <Path size={18} weight="fill" color="#7C3AED" aria-hidden />
              <span>Skill gaps and CV guidance from your search data</span>
            </li>
            <li>
              <WarningCircle size={18} weight="fill" color="#D97706" aria-hidden />
              <span>No invented testimonials, partners, or hire promises</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="about-story">
        <div className="about-story__rail" aria-hidden />
        <div className="about-story__body">
          <h2>You&apos;ve probably done this</h2>
          <p>
            You applied to a job you were qualified for. You got to interview. You got
            to offer. HR asked about your right to work. You explained your visa. Then
            the offer went silent.
          </p>
          <p>
            Or it happened earlier. You filtered for &quot;visa sponsorship available&quot; and
            half the results still could not sponsor. You downloaded the Home Office
            register: more than a hundred thousand companies, alphabetical, almost
            impossible to search by role. You gave up and started again.
          </p>
          <p className="about-story__pull">
            I built Sponsor Signal because I was that person. I&apos;m on the Graduate
            visa. I&apos;ve had the HR conversation. I know what it feels like to spend
            weeks on an application that was never going to work out.
          </p>
          <p>
            The product is simple on purpose. Type a role. See which employers look
            licensed. See how confident that match is. See what the market is asking
            for. If you want, upload a CV and get a roadmap instead of another vague
            pep talk.
          </p>
        </div>
      </section>

      <section className="about-stats" aria-label="Key figures">
        {STATS.map((s) => (
          <article key={s.label} className="about-stat">
            <p className="about-stat__value">{s.value}</p>
            <p className="about-stat__label">{s.label}</p>
            <p className="about-stat__note">{s.note}</p>
          </article>
        ))}
      </section>

      <section className="about-section" aria-labelledby="who-heading">
        <div className="about-section__intro">
          <h2 id="who-heading">Who it is for</h2>
          <p>
            If you are hunting under visa pressure, you do not need more listings. You
            need signal: who can sponsor, how sure we are, and what to do next.
          </p>
        </div>
        <div className="about-who-grid">
          {FOR_WHO.map((item) => (
            <article key={item.title} className="about-who-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" aria-labelledby="flow-heading">
        <div className="about-section__intro">
          <h2 id="flow-heading">What happens when you search</h2>
          <p>
            One role title opens ads, sponsor checks, market skills, and an optional
            personal roadmap. No account required to start.
          </p>
        </div>
        <ol className="about-flow">
          {FLOW.map((step) => (
            <li key={step.n} className="about-flow__item">
              <p className="about-flow__n">{step.n}</p>
              <h3>{step.t}</h3>
              <p>{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section" aria-labelledby="confidence-heading">
        <div className="about-section__intro">
          <h2 id="confidence-heading">How to read sponsor confidence</h2>
          <p>
            Not every match is equal. Aggregator ads are name-matched to the register.
            Careers-page matches are stronger. We show the difference instead of hiding it.
          </p>
        </div>
        <div className="about-confidence">
          {CONFIDENCE.map((c) => (
            <article key={c.label} className={`about-confidence__card about-confidence__card--${c.tone}`}>
              <span className="about-confidence__badge">{c.label}</span>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
        <p className="about-footnote">
          Aggregator name-match precision is about 59% on a reviewed 100-row sample.
          That is the cautious product figure, not a marketing polish.{" "}
          <Link href="/methodology" className="text-link">
            See the methodology
          </Link>
          .
        </p>
      </section>

      <section className="about-section" aria-labelledby="promises-heading">
        <div className="about-section__intro">
          <h2 id="promises-heading">What you can expect</h2>
          <p>
            Sponsor Signal is a signal desk, not another noisy board. These are the
            product principles behind every page.
          </p>
        </div>
        <div className="about-promise-grid">
          {PROMISES.map((item) => {
            const Icon = item.Icon;
            return (
              <article key={item.t} className="about-promise">
                <span className="about-promise__icon" aria-hidden>
                  <Icon size={20} weight="duotone" color="#4F6EF7" />
                </span>
                <h3>{item.t}</h3>
                <p>{item.d}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-compare" aria-labelledby="honest-heading">
        <div>
          <h2 id="honest-heading">What this is, and what it isn&apos;t</h2>
          <p>
            Honesty matters more than a bigger claim. Licence tenure is archive-based.
            Salary can be missing from ads. A green badge never means “they will hire you.”
          </p>
        </div>
        <div className="about-compare__grid">
          <article className="about-compare__card about-compare__card--yes">
            <p className="about-compare__label">
              <CheckCircle size={18} weight="fill" color="#4F6EF7" aria-hidden />
              This is
            </p>
            <ul>
              {IS_THIS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article className="about-compare__card about-compare__card--no">
            <p className="about-compare__label">
              <XCircle size={18} weight="fill" color="#94A3B8" aria-hidden />
              This isn&apos;t
            </p>
            <ul>
              {NOT_THIS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="about-section about-sources" aria-labelledby="sources-heading">
        <div className="about-section__intro">
          <h2 id="sources-heading">Where the data comes from</h2>
          <p>
            Every number on the site should be traceable. If we cannot document it, we
            do not invent it.
          </p>
        </div>
        <div className="about-sources__grid">
          <article className="about-source-card">
            <Briefcase size={22} weight="duotone" color="#4F6EF7" aria-hidden />
            <h3>Live job ads</h3>
            <p>
              Reed and Adzuna for aggregator listings. Greenhouse, Ashby, Workable, and
              similar boards where we can map an employer&apos;s own careers page.
            </p>
          </article>
          <article className="about-source-card">
            <SealCheck size={22} weight="duotone" color="#4F6EF7" aria-hidden />
            <h3>Home Office register</h3>
            <p>
              The current Skilled Worker sponsor list, refreshed monthly, with historical
              snapshots used for observed licence tenure bands.
            </p>
          </article>
          <article className="about-source-card">
            <Student size={22} weight="duotone" color="#4F6EF7" aria-hidden />
            <h3>Your CV, optionally</h3>
            <p>
              Read in memory for the assessment, then gone. Not stored, not trained on,
              not shared. Without a CV you still see sponsors and market skills.
            </p>
          </article>
        </div>
      </section>

      <section className="about-cta-band">
        <div>
          <h2>Ready to stop guessing?</h2>
          <p>
            Search a role without signing up. It takes about thirty seconds. Your CV is
            never kept after the analysis.
          </p>
        </div>
        <div className="about-hero__actions">
          <Link href="/search" className="cta-primary about-cta">
            Search a role
          </Link>
          <a href="mailto:dakshkumar2k2@gmail.com" className="cta-secondary about-cta">
            dakshkumar2k2@gmail.com
          </a>
        </div>
        <p className="about-cta-band__note">
          Built by an international student, for international students.
        </p>
      </section>
    </main>
  );
}
