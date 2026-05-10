import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Camera,
  Brain,
  GitBranch,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Eye,
  Wand2,
} from "lucide-react";
import { HeroBackdrop } from "../components/ui/HeroBackdrop";
import { AnimatedTerminal } from "../components/ui/AnimatedTerminal";
import { LinkButton } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SponsorBadge } from "../components/ui/SponsorBadge";
import { ConfidenceMeter } from "../components/ui/ConfidenceMeter";
import { Sparkline } from "../components/ui/Sparkline";
import { sessions, sponsorMeta, type SponsorTag } from "../lib/mockData";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

export function LandingPage() {
  return (
    <div className="relative">
      {/* ---------- HERO ---------- */}
      <section className="relative px-6 pb-24 pt-16 md:pt-24">
        <HeroBackdrop />

        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/70 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-acid)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-acid)]" />
              </span>
              <span>Recording session #04812</span>
              <span className="text-white/30">·</span>
              <span className="text-white/50">live demo</span>
            </div>
          </motion.div>

          <h1 className="mx-auto max-w-5xl text-center font-serif text-[44px] leading-[1.02] tracking-tight text-white text-balance md:text-[78px]">
            See <em className="italic text-[color:var(--color-acid)]">why</em> your AI agent
            <br className="hidden md:block" />
            did what it did.
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-center text-[16px] leading-relaxed text-white/65 md:text-[17.5px]"
          >
            Blackbox records every coding-agent session — diffs, commands, test output, assumptions —
            and replays them with AI-generated root cause, source-of-truth detection and a memory
            that catches your next agent before it repeats the same mistake.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <LinkButton size="lg" href="/sessions" iconRight={<ArrowRight className="h-4 w-4" />}>
              Open the dashboard
            </LinkButton>
            <Link to="/cli">
              <span className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 font-mono text-[13px] text-white/85 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                <span className="text-[color:var(--color-acid)]">$</span>
                <span>blackbox start "fix oauth bug"</span>
              </span>
            </Link>
          </motion.div>

          {/* sponsor strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-12 flex flex-col items-center gap-3"
          >
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[color:var(--color-dim)]">
              built with
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {(Object.keys(sponsorMeta) as SponsorTag[]).map((s) => (
                <SponsorBadge key={s} tag={s} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* HERO PREVIEW */}
        <div className="relative mx-auto mt-16 max-w-6xl">
          <HeroPreview />
        </div>
      </section>

      {/* ---------- FLOW ---------- */}
      <FlowSection />

      {/* ---------- 5 ANALYSIS PILLARS ---------- */}
      <PillarsSection />

      {/* ---------- DEMO PEEK ---------- */}
      <DemoPeekSection />

      {/* ---------- ASSUMPTION SHIFT ---------- */}
      <AssumptionTeaser />

      {/* ---------- METRICS BAR ---------- */}
      <MetricsBar />

      {/* ---------- CTA ---------- */}
      <FinalCTA />
    </div>
  );
}

/* ------------------------- Hero preview ------------------------- */

function HeroPreview() {
  const terminalLines = [
    { kind: "cmd" as const, text: 'blackbox start "Fix OAuth redirect bug"' },
    { kind: "ok" as const, text: "✓ Snapshot saved at a3f12c9" },
    { kind: "ok" as const, text: "✓ Session session_001 started" },
    { kind: "out" as const, text: "  → run your agent in Cursor as usual…" },
    { kind: "cmd" as const, text: "blackbox finish" },
    { kind: "info" as const, text: "✦ Generating analysis with CLōD…" },
    { kind: "ok" as const, text: "✓ 2 memory cards generated" },
    { kind: "ok" as const, text: "✓ Diff reviewed by Greptile" },
    { kind: "ok" as const, text: "✓ Cards indexed by Nia" },
    { kind: "info" as const, text: "▶ http://localhost:5173/sessions/session_001" },
  ];

  const oldest = sessions.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5 md:grid-cols-5"
    >
      <div className="md:col-span-2">
        <AnimatedTerminal lines={terminalLines} prompt="~/blackbox $" />
      </div>
      <div className="md:col-span-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)]/90 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
                Live root cause
              </div>
              <div className="mt-1 font-serif text-[22px] leading-tight text-white">
                Documentation drifted from implementation.
              </div>
            </div>
            <ConfidenceMeter score={0.92} size={72} thickness={6} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
                <AlertTriangle className="h-3 w-3 text-[color:var(--color-warn)]" /> Incorrect assumption
              </div>
              <div className="font-mono text-[12px] text-white/75">
                Token expiry value lives in <span className="text-[color:var(--color-warn)]">docs/oauth.md</span>
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/[0.06] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-success)]/80">
                <ShieldCheck className="h-3 w-3" /> Source of truth
              </div>
              <div className="font-mono text-[12px] text-white">
                <span className="text-[color:var(--color-acid)]">SESSION_TTL_MS</span> in{" "}
                <span className="underline decoration-dotted">src/auth/session.ts</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
              <span>Recent sessions</span>
              <span>last 7 days</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkline values={[3, 4, 2, 5, 6, 4, 7]} width={140} height={36} />
              <div className="ml-auto flex items-center gap-2">
                {oldest.slice(0, 4).map((s, i) => (
                  <div
                    key={s.id}
                    className={`h-7 w-7 rounded-md border ${
                      s.status === "success"
                        ? "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10"
                        : s.status === "partial"
                        ? "border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    style={{ transform: `rotate(${(i - 1.5) * 4}deg)` }}
                    title={s.task}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[12px]">
            <SponsorBadge tag="CLōD" prefix="generated by" />
            <Link
              to="/sessions/session_001"
              className="inline-flex items-center gap-1 text-[color:var(--color-acid)] hover:underline"
            >
              Replay this session <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------- Flow ------------------------- */

const flow = [
  { icon: Camera, title: "Snapshot", desc: "blackbox start captures repo state, branch, base commit." },
  { icon: Wand2, title: "Agent works", desc: "Use Cursor (or any agent) exactly as usual. We stay out of the way." },
  { icon: GitBranch, title: "Capture", desc: "Diffs, commands, test output and timing get streamed to SQLite." },
  { icon: Brain, title: "Analyze", desc: "CLōD produces memory cards, Greptile reviews diff, Nia indexes." },
  { icon: Eye, title: "Replay", desc: "Beautiful timeline + root cause + future-warning, instantly searchable." },
];

function FlowSection() {
  return (
    <section className="border-t border-white/5 bg-[color:var(--color-bg-soft)]/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="acid" className="mb-4">
            <Zap className="h-3 w-3" /> the loop
          </Badge>
          <h2 className="font-serif text-[34px] leading-tight text-white text-balance md:text-[44px]">
            One CLI command. <em className="text-[color:var(--color-acid)]">Every</em> session, replayable.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/60">
            Forget reading thousand-line agent transcripts. Blackbox turns every run into a clean,
            navigable timeline with the why baked in.
          </p>
        </div>

        <div className="relative mt-14 grid gap-3 md:grid-cols-5">
          {/* connector line */}
          <div
            aria-hidden
            className="absolute left-[5%] right-[5%] top-[44px] hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(214,255,60,0.4) 20%, rgba(214,255,60,0.4) 80%, transparent 100%)",
            }}
          />
          {flow.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="relative flex flex-col items-center gap-3 px-2 text-center"
            >
              <div className="relative grid h-[88px] w-[88px] place-items-center rounded-2xl border border-white/10 bg-[color:var(--color-surface)] backdrop-blur">
                <step.icon className="h-7 w-7 text-[color:var(--color-acid)]" />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-[color:var(--color-acid)]/30 bg-[color:var(--color-bg)] font-mono text-[11px] text-[color:var(--color-acid)]">
                  {i + 1}
                </span>
              </div>
              <div className="font-serif text-[19px] text-white">{step.title}</div>
              <div className="text-[12.5px] leading-relaxed text-white/55">{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Pillars ------------------------- */

const pillars = [
  {
    icon: AlertTriangle,
    title: "Root cause",
    eyebrow: "01 · Why did the agent fail?",
    desc: "We trace each failure to the file, line, and decision that caused it. No more spelunking transcripts.",
    accent: "var(--color-coral)",
  },
  {
    icon: Brain,
    title: "Assumption analysis",
    eyebrow: "02 · What did it get wrong?",
    desc: "Every initial assumption is logged and diffed against what actually turned out to be true.",
    accent: "var(--color-violet-glow)",
  },
  {
    icon: FileSearch,
    title: "Source-of-truth",
    eyebrow: "03 · Which file was canonical?",
    desc: "Pick one file: the one whose change would actually break behavior. Greptile-aware.",
    accent: "var(--color-electric)",
  },
  {
    icon: CheckCircle2,
    title: "Confidence",
    eyebrow: "04 · Did tests really validate?",
    desc: "Quantified score across diff scope, test coverage, and Greptile review.",
    accent: "var(--color-acid)",
  },
  {
    icon: ShieldCheck,
    title: "Future warning",
    eyebrow: "05 · What should next agent avoid?",
    desc: "Compiled to a memory card so the next run can start with the lesson already learned.",
    accent: "var(--color-success)",
  },
];

function PillarsSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <div>
            <Badge tone="violet" className="mb-4">analysis</Badge>
            <h2 className="font-serif text-[34px] leading-tight text-white md:text-[48px] text-balance">
              Five answers, every session.
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-white/60 md:justify-self-end">
            Every finished session is post-processed into a five-part report. No more "the agent did
            something" — we tell you exactly what it assumed, what was true, and what the next run
            should fear.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5 transition-all hover:-translate-y-1 hover:border-white/20"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
                style={{ background: p.accent }}
              />
              <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
                {p.eyebrow}
              </div>
              <div className="mt-4 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                <p.icon className="h-4.5 w-4.5" style={{ color: p.accent }} />
              </div>
              <h3 className="mt-4 font-serif text-[22px] leading-tight text-white">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Demo peek ------------------------- */

function DemoPeekSection() {
  return (
    <section className="border-t border-white/5 bg-[color:var(--color-bg-soft)]/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="electric" className="mb-4">
              <Activity className="h-3 w-3" /> session replay
            </Badge>
            <h2 className="font-serif text-[34px] leading-tight text-white text-balance md:text-[48px]">
              Replay any agent run, frame by frame.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">
              Every command, every file edit, every test failure pinned to the second. Click any
              event to jump to the exact diff that produced it.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                ["Agent reads docs/oauth.md", "Initial assumption recorded"],
                ["pnpm test:auth FAILS", "Trigger captured, hypothesis revised"],
                ["Agent fixes src/auth/session.ts", "Diff scoped, source-of-truth identified"],
                ["Memory card generated", "Future agents will be warned"],
              ].map(([t, d], i) => (
                <motion.li
                  key={t}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-acid)]" />
                  <div>
                    <div className="text-[14px] text-white">{t}</div>
                    <div className="text-[12.5px] text-white/55">{d}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8">
              <LinkButton variant="outline" href="/sessions/session_001" iconRight={<ArrowRight className="h-4 w-4" />}>
                Replay session_001
              </LinkButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
              <div
                className="pointer-events-none absolute inset-0 dot-grid opacity-50 mask-fade-b"
                aria-hidden
              />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 font-mono text-[11px] text-white/70">
                      #1
                    </span>
                    <span className="font-mono text-[13px] text-white">session_001</span>
                    <Badge tone="good">resolved</Badge>
                  </div>
                  <span className="font-mono text-[11px] text-white/40">40m 11s</span>
                </div>

                <ol className="space-y-3">
                  {[
                    { ts: "14:02:00", t: "Session started", c: "var(--color-electric)" },
                    { ts: "14:02:14", t: "Agent reads docs/oauth.md", c: "rgba(255,255,255,0.4)" },
                    { ts: "14:08:42", t: "Edited src/auth/callback.ts", c: "rgba(255,255,255,0.4)" },
                    { ts: "14:11:03", t: "pnpm test:auth FAIL", c: "var(--color-danger)" },
                    { ts: "14:11:09", t: "Assumption corrected", c: "var(--color-warn)" },
                    { ts: "14:30:11", t: "All auth tests pass", c: "var(--color-success)" },
                    { ts: "14:42:11", t: "Session finished", c: "var(--color-success)" },
                  ].map((row, idx) => (
                    <motion.li
                      key={row.ts}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.06 }}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: row.c, boxShadow: `0 0 8px ${row.c}` }}
                      />
                      <span className="font-mono text-[11px] text-white/40">{row.ts}</span>
                      <span className="text-[13px] text-white/85">{row.t}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Assumption shift teaser ------------------------- */

function AssumptionTeaser() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="warn" className="mb-4">
            <GitBranch className="h-3 w-3" /> assumption shift detection
          </Badge>
          <h2 className="font-serif text-[34px] leading-tight text-white text-balance md:text-[48px]">
            When what was true changes, we tell you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/60">
            Memory cards remember the file that was canonical. The moment that file moves, the card
            goes stale and any retrieval flags it for re-verification.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <ShiftDiagram />
        </div>
      </div>
    </section>
  );
}

function ShiftDiagram() {
  return (
    <div className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5"
      >
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
          Initial assumption
        </div>
        <h3 className="mt-2 font-serif text-[22px] leading-tight text-white">
          Token expiry defined in <span className="text-[color:var(--color-warn)]">docs/oauth.md</span>
        </h3>
        <p className="mt-2 text-[12.5px] text-white/55">
          Every agent that read the docs was wrong. Quietly. For weeks.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto flex flex-col items-center gap-2"
      >
        <div className="rounded-full border border-[color:var(--color-acid)]/40 bg-[color:var(--color-acid)]/10 px-3 py-1 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-acid)]">
          trigger
        </div>
        <div className="flex flex-col items-center text-[12px] text-white/65">
          <span>failed auth tests</span>
        </div>
        <ArrowRight className="h-5 w-5 rotate-90 text-[color:var(--color-acid)] md:rotate-0" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/[0.05] p-5"
      >
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-success)]/80">
          Corrected assumption
        </div>
        <h3 className="mt-2 font-serif text-[22px] leading-tight text-white">
          Enforced by{" "}
          <span className="text-[color:var(--color-acid)]">SESSION_TTL_MS</span> in{" "}
          <span className="underline decoration-dotted">src/auth/session.ts</span>
        </h3>
        <p className="mt-2 text-[12.5px] text-white/55">
          Saved as a high-confidence memory card. Future agents start here.
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------- Metrics ------------------------- */

function MetricsBar() {
  const stats = [
    { v: 100_000, suffix: "+", label: "agent steps captured" },
    { v: 7, suffix: "ms", label: "snapshot overhead" },
    { v: 92, suffix: "%", label: "avg root-cause confidence" },
    { v: 3, suffix: "", label: "sponsor integrations" },
  ];
  return (
    <section className="border-y border-white/5 bg-[color:var(--color-bg-soft)]/40 px-6 py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="text-center md:text-left"
          >
            <div className="font-serif text-[44px] leading-none tracking-tight text-white">
              <AnimatedNumber value={s.v} />
              <span className="text-[color:var(--color-acid)]">{s.suffix}</span>
            </div>
            <div className="mt-2 text-[12.5px] uppercase tracking-[0.16em] text-white/50">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------- CTA ------------------------- */

function FinalCTA() {
  return (
    <section className="px-6 py-28">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--color-surface)] p-12 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(214,255,60,0.4), transparent)" }}
        />
        <div className="absolute inset-0 dot-grid opacity-40 mask-fade-b" aria-hidden />
        <div className="relative">
          <h2 className="font-serif text-[40px] leading-tight text-white text-balance md:text-[56px]">
            Stop guessing. Start replaying.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/60">
            Drop the CLI in any repo. Your next agent run will already know what your last one
            learned.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <LinkButton size="lg" href="/sessions" iconRight={<ArrowRight className="h-4 w-4" />}>
              Open dashboard
            </LinkButton>
            <LinkButton size="lg" variant="outline" href="/cli">
              Browse CLI commands
            </LinkButton>
          </div>
        </div>
      </div>
      <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6 text-[12px] text-[color:var(--color-dim)]">
        <span>© 2026 Blackbox · A hackathon experiment in agent observability.</span>
        <span className="font-mono">v0.1.0 · demo</span>
      </footer>
    </section>
  );
}
