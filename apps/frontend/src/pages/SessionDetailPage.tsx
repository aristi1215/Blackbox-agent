import { useParams, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  GitBranch,
  Clock,
  GitCommit,
  FileCode2,
  Terminal,
  TestTube2,
  Brain,
  AlertTriangle,
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  XCircle,
  Hash,
  Coins,
  Cpu,
  AlertOctagon,
  Lightbulb,
  Sparkles,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import {
  getSession,
  getMemoryCard,
  formatDuration,
  formatRelative,
  statusMeta,
  sponsorMeta,
} from "../lib/mockData";
import { Badge } from "../components/ui/Badge";
import { SponsorBadge } from "../components/ui/SponsorBadge";
import { ConfidenceMeter, ConfidenceBar } from "../components/ui/ConfidenceMeter";
import { DiffViewer } from "../components/ui/DiffViewer";
import { Timeline } from "../components/ui/Timeline";
import { MemoryCardItem } from "../components/ui/MemoryCardItem";
import { cn } from "../lib/cn";

const tabs = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "diff", label: "Diff", icon: GitCommit },
  { id: "tests", label: "Tests & commands", icon: TestTube2 },
  { id: "memory", label: "Memory cards", icon: Brain },
] as const;

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = id ? getSession(id) : undefined;
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [copied, setCopied] = useState(false);

  if (!session) return <Navigate to="/sessions" replace />;

  const meta = statusMeta(session.status);
  const totalAdded = session.changed_files.reduce((a, f) => a + f.added, 0);
  const totalRemoved = session.changed_files.reduce((a, f) => a + f.removed, 0);
  const cards = session.memory_cards
    .map((mid) => getMemoryCard(mid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  function copyId() {
    navigator.clipboard?.writeText(session!.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <Link
          to="/sessions"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-white/55 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> all sessions
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  meta.bg,
                  meta.text,
                  "border-current/40"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
              <button
                onClick={copyId}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-white/70 transition-colors hover:border-white/20"
              >
                <Hash className="h-3 w-3" /> {session.id}
                {copied ? (
                  <Check className="h-3 w-3 text-[color:var(--color-success)]" />
                ) : (
                  <Copy className="h-3 w-3 text-white/40" />
                )}
              </button>
              <Badge tone="muted">
                <Cpu className="h-3 w-3" />
                {session.agent.model}
              </Badge>
            </div>

            <h1 className="mt-3 font-serif text-[34px] leading-tight text-white text-balance md:text-[44px]">
              {session.task}
            </h1>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-white/60">
              {session.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-white/40" />
                <span className="font-mono text-white/85">{session.branch}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-white/40" />
                <span className="font-mono text-white/85">{session.base_commit}</span>
                <span className="text-white/30">→</span>
                <span className="font-mono text-[color:var(--color-acid)]">{session.end_commit}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-white/40" />
                {formatDuration(session.duration_ms)} · {formatRelative(session.started_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConfidenceMeter score={session.analysis.confidence.score} size={108} thickness={9} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <Mini
            label="Files touched"
            value={session.changed_files.length.toString()}
            sub={
              <>
                <span className="text-[color:var(--color-success)]">+{totalAdded}</span>{" "}
                <span className="text-[color:var(--color-danger)]">−{totalRemoved}</span>
              </>
            }
            icon={<FileCode2 className="h-4 w-4" />}
          />
          <Mini
            label="Tests"
            value={`${session.test_summary.passed}/${
              session.test_summary.passed + session.test_summary.failed
            }`}
            sub={
              session.test_summary.failed > 0
                ? `${session.test_summary.failed} failing`
                : "all pass"
            }
            tone={session.test_summary.failed > 0 ? "danger" : "good"}
            icon={<TestTube2 className="h-4 w-4" />}
          />
          <Mini
            label="Tokens"
            value={`${((session.tokens.input + session.tokens.output) / 1000).toFixed(1)}k`}
            sub={`in ${session.tokens.input.toLocaleString()} · out ${session.tokens.output.toLocaleString()}`}
            icon={<Cpu className="h-4 w-4" />}
          />
          <Mini
            label="Cost"
            value={`$${session.cost_usd.toFixed(2)}`}
            sub="USD"
            icon={<Coins className="h-4 w-4" />}
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.02] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                tab === t.id ? "text-black" : "text-white/65 hover:text-white"
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="session-tab"
                  className="absolute inset-0 rounded-full bg-[color:var(--color-acid)]"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6">
          {tab === "overview" && <OverviewTab session={session} cards={cards} />}
          {tab === "timeline" && (
            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6">
                <h3 className="mb-5 font-serif text-[24px] text-white">Timeline</h3>
                <Timeline events={session.timeline} />
              </div>
              <AssumptionsPanel session={session} />
            </div>
          )}
          {tab === "diff" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
              <FilesList session={session} />
              <div>
                <DiffViewer hunks={session.diff} />
              </div>
            </div>
          )}
          {tab === "tests" && <TestsTab session={session} />}
          {tab === "memory" && (
            <div>
              {cards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/55">
                  No memory cards generated yet for this session.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {cards.map((c, i) => (
                    <MemoryCardItem key={c.id} card={c} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */

function Mini({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  tone?: "neutral" | "good" | "danger";
  icon: React.ReactNode;
}) {
  const accent =
    tone === "good"
      ? "var(--color-success)"
      : tone === "danger"
      ? "var(--color-danger)"
      : "var(--color-electric)";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/45">
        <span className="flex items-center gap-1.5">
          <span style={{ color: accent }}>{icon}</span> {label}
        </span>
      </div>
      <div className="mt-2 font-serif text-[28px] leading-none text-white">{value}</div>
      <div className="mt-1 text-[11.5px] text-white/55">{sub}</div>
    </div>
  );
}

/* ------------------------- Overview tab ------------------------- */

function OverviewTab({
  session,
  cards,
}: {
  session: ReturnType<typeof getSession> & object;
  cards: NonNullable<ReturnType<typeof getMemoryCard>>[];
}) {
  const a = session.analysis;

  return (
    <div className="space-y-6">
      {/* The analysis block */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--color-acid)" }}
            />
            <Badge tone="acid" className="mb-3">
              <AlertOctagon className="h-3 w-3" /> Root cause
            </Badge>
            <h3 className="font-serif text-[26px] leading-tight text-white md:text-[30px]">
              {a.rootCause.title}
            </h3>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/70">
              {a.rootCause.summary}
            </p>
            {a.rootCause.file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[12px] text-white/85">
                <FileCode2 className="h-3.5 w-3.5 text-[color:var(--color-electric)]" />
                {a.rootCause.file}
                {a.rootCause.line && (
                  <span className="text-white/40">:{a.rootCause.line}</span>
                )}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                reviewed by
              </span>
              {a.reviewedBy.map((s) => (
                <SponsorBadge key={s} tag={s} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6"
        >
          <Badge tone="acid" className="mb-3">
            <Eye className="h-3 w-3" /> Confidence
          </Badge>
          <div className="flex items-center gap-5">
            <ConfidenceMeter score={a.confidence.score} size={96} thickness={8} />
            <div className="flex-1">
              <div className="font-serif text-[18px] leading-tight text-white">
                {a.confidence.score >= 0.85
                  ? "Strong evidence"
                  : a.confidence.score >= 0.6
                  ? "Reasonable, verify"
                  : "Weak — investigate"}
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-white/60">
                {a.confidence.validatedByTests ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
                    Validated by tests
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-[color:var(--color-danger)]" />
                    Not validated by tests
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {a.confidence.breakdown.map((b) => (
              <ConfidenceBar key={b.label} label={b.label} score={b.score} />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Assumption */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)]"
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <Badge tone="warn">
              <AlertTriangle className="h-3 w-3" /> Assumption analysis
            </Badge>
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/35">
              before → after
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/[0.06] p-4">
              <div className="mb-1 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-warn)]/85">
                Incorrect
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/85">
                {a.assumption.incorrect}
              </p>
            </div>
            <div className="flex justify-center">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                corrected by evidence
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/[0.06] p-4">
              <div className="mb-1 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-success)]/85">
                Actual
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/85">
                {a.assumption.actual}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Source of truth + future warning */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5"
          >
            <Badge tone="electric" className="mb-3">
              <FileSearch className="h-3 w-3" /> Source of truth
            </Badge>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[12.5px] text-white">
              <FileCode2 className="h-3.5 w-3.5 text-[color:var(--color-electric)]" />
              {a.sourceOfTruth.file}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65">
              {a.sourceOfTruth.reason}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-[color:var(--color-acid)]/25 bg-[color:var(--color-acid)]/[0.04] p-5"
          >
            <Badge tone="acid" className="mb-3">
              <Lightbulb className="h-3 w-3" /> Future warning
            </Badge>
            <p className="font-serif text-[19px] leading-snug text-white text-balance">
              "{a.futureWarning}"
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11.5px] text-white/55">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-acid)]" />
              Compiled into {cards.length} memory card{cards.length === 1 ? "" : "s"} ·
              <Link to="/memories" className="text-[color:var(--color-acid)] hover:underline">
                browse
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mini timeline + cards preview */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-serif text-[22px] text-white">What happened</h3>
            <Badge tone="muted">{session.timeline.length} events</Badge>
          </div>
          <Timeline events={session.timeline} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="font-serif text-[22px] text-white">Generated memories</h3>
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-white/45">
              No cards generated yet.
            </div>
          )}
          {cards.map((c, i) => (
            <MemoryCardItem key={c.id} card={c} index={i} compact />
          ))}
        </motion.div>
      </div>

      {/* Sponsors strip */}
      <div className="grid gap-3 md:grid-cols-3">
        {a.reviewedBy.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4"
          >
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{
                background: `color-mix(in oklab, ${sponsorMeta[s].color} 15%, transparent)`,
                color: sponsorMeta[s].color,
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-white">{s}</div>
              <div className="truncate text-[11.5px] text-white/55">
                {sponsorMeta[s].description}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Files list ------------------------- */

function FilesList({ session }: { session: NonNullable<ReturnType<typeof getSession>> }) {
  const max = Math.max(...session.changed_files.map((f) => f.added + f.removed), 1);
  return (
    <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-white">Files changed</h3>
        <Badge tone="muted">{session.changed_files.length}</Badge>
      </div>
      <ul className="space-y-1.5">
        {session.changed_files.map((f) => {
          return (
            <li
              key={f.path}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
            >
              <FileCode2 className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-white/85">
                {f.path}
              </span>
              <span className="font-mono text-[10.5px] text-[color:var(--color-success)]">
                +{f.added}
              </span>
              <span className="font-mono text-[10.5px] text-[color:var(--color-danger)]">
                −{f.removed}
              </span>
              <div className="flex h-1 w-12 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-[color:var(--color-success)]"
                  style={{ width: `${(f.added / max) * 100}%` }}
                />
                <div
                  className="h-full bg-[color:var(--color-danger)]"
                  style={{ width: `${(f.removed / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------- Tests tab ------------------------- */

function TestsTab({ session }: { session: NonNullable<ReturnType<typeof getSession>> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Mini
          label="Passed"
          value={session.test_summary.passed.toString()}
          sub="green"
          tone="good"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Mini
          label="Failed"
          value={session.test_summary.failed.toString()}
          sub={session.test_summary.failed > 0 ? "needs attention" : "clean"}
          tone={session.test_summary.failed > 0 ? "danger" : "good"}
          icon={<XCircle className="h-4 w-4" />}
        />
        <Mini
          label="Skipped"
          value={session.test_summary.skipped.toString()}
          sub="not executed"
          icon={<TestTube2 className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-3">
        {session.commands.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[color:var(--color-acid)]" />
                <span className="font-mono text-[12.5px] text-white/85">{c.command}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.exit_code === 0 ? "good" : c.exit_code === -1 ? "electric" : "danger"}>
                  exit {c.exit_code === -1 ? "—" : c.exit_code}
                </Badge>
                <span className="font-mono text-[11px] text-white/40">
                  {(c.duration_ms / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
            <pre className="m-0 px-4 py-3 font-mono text-[12px] leading-[1.6] text-white/70">
              {c.output}
            </pre>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Assumptions panel ------------------------- */

function AssumptionsPanel({ session }: { session: NonNullable<ReturnType<typeof getSession>> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[22px] text-white">Assumptions</h3>
        <Badge tone="muted">{session.assumptions.length}</Badge>
      </div>
      <ul className="space-y-3">
        {session.assumptions.map((a) => {
          const tone =
            a.status === "validated"
              ? "good"
              : a.status === "rejected"
              ? "danger"
              : a.status === "corrected"
              ? "warn"
              : "muted";
          return (
            <li
              key={a.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] leading-snug text-white">{a.text}</p>
                <Badge tone={tone}>{a.status}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11.5px] text-white/45">
                <span className="font-mono">{a.source}</span>
                <span>conf {Math.round(a.confidence * 100)}</span>
              </div>
              {a.evidence.length > 0 && (
                <ul className="mt-2 space-y-0.5 border-l border-white/10 pl-3">
                  {a.evidence.map((e, i) => (
                    <li key={i} className="text-[11.5px] text-white/55">
                      — {e}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
