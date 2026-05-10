import { useState } from "react";
import {
  BookOpen,
  Eye,
  MessageCircle,
  Lightbulb,
  ScrollText,
  ChevronDown,
  ChevronRight,
  FileJson,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import type { SessionEvidence } from "../../lib/mapApiSession";

export function SessionEvidenceTab({ evidence }: { evidence: SessionEvidence }) {
  return (
    <div className="space-y-5">
      <SummaryBlock summary={evidence.summary} />

      <div className="grid gap-4 md:grid-cols-2">
        <FactsBlock
          tone="acid"
          icon={<Eye className="h-3.5 w-3.5" />}
          title="Observed facts"
          subtitle="Directly captured from the diff, log, and command output."
          items={evidence.observedFacts}
          emptyText="No facts were captured for this session."
        />
        <FactsBlock
          tone="warn"
          icon={<MessageCircle className="h-3.5 w-3.5" />}
          title="What the agent claimed"
          subtitle="Statements pulled from the agent trace — treat as unverified."
          items={evidence.agentReportedClaims}
          emptyText="The agent did not report any claims for this session."
        />
        <FactsBlock
          tone="electric"
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          title="Inferred hypotheses"
          subtitle="Patterns Witsmith inferred from the captured evidence."
          items={evidence.inferredHypotheses}
          emptyText="No additional hypotheses were inferred."
        />
        <AgentTraceBlock trace={evidence.agentTrace} />
      </div>

      <RawJsonBlock raw={evidence.raw} />
    </div>
  );
}

function SummaryBlock({ summary }: { summary: string }) {
  if (!summary.trim()) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        <BookOpen className="h-3.5 w-3.5 text-[color:var(--color-acid)]" />
        Session summary
      </div>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-white/85">
        {summary}
      </p>
    </section>
  );
}

type FactsTone = "acid" | "warn" | "electric";

const toneStyles: Record<FactsTone, { dot: string; border: string }> = {
  acid: { dot: "var(--color-acid)", border: "var(--color-acid)" },
  warn: { dot: "var(--color-warn)", border: "var(--color-warn)" },
  electric: { dot: "var(--color-electric)", border: "var(--color-electric)" },
};

function FactsBlock({
  tone,
  icon,
  title,
  subtitle,
  items,
  emptyText,
}: {
  tone: FactsTone;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: string[];
  emptyText: string;
}) {
  const colors = toneStyles[tone];
  return (
    <section
      className="rounded-2xl border bg-[color:var(--color-surface)] p-5"
      style={{ borderColor: `color-mix(in oklab, ${colors.border} 22%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
          <span style={{ color: colors.dot }}>{icon}</span>
          {title}
        </div>
        <Badge tone="muted">{items.length}</Badge>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-white/45">{subtitle}</p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-white/10 px-3 py-3 text-[12.5px] text-white/45">
          {emptyText}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-[13px] leading-relaxed text-white/80"
            >
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: colors.dot }}
              />
              <span className="break-words">{it}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgentTraceBlock({ trace }: { trace: string }) {
  const [open, setOpen] = useState(false);
  const empty = !trace.trim();

  return (
    <section className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
          <ScrollText className="h-3.5 w-3.5 text-[color:var(--color-violet-glow)]" />
          Agent trace
        </div>
        <Badge tone="muted">{empty ? "empty" : "captured"}</Badge>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-white/45">
        Raw notes the agent left behind. Witsmith stores these verbatim.
      </p>

      {empty ? (
        <p className="mt-4 rounded-lg border border-dashed border-white/10 px-3 py-3 text-[12.5px] text-white/45">
          The agent did not leave any trace notes for this session.
        </p>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/85 hover:border-white/20"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {open ? "Hide trace" : "Show full trace"}
          </button>
          {open && (
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[12px] leading-[1.55] text-white/85 whitespace-pre-wrap">
              {trace}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function RawJsonBlock({ raw }: { raw: SessionEvidence["raw"] }) {
  const [open, setOpen] = useState(false);

  const text = JSON.stringify(raw, null, 2);

  return (
    <section className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
          <FileJson className="h-3.5 w-3.5 text-[color:var(--color-electric)]" />
          Raw session JSON
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/85 hover:border-white/20"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {open ? "Hide JSON" : "Show JSON"}
        </button>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-white/45">
        Exactly what the CLI wrote into the session file. Useful when debugging.
      </p>

      {open && (
        <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11.5px] leading-[1.55] text-white/85 whitespace-pre">
          {text}
        </pre>
      )}
    </section>
  );
}
