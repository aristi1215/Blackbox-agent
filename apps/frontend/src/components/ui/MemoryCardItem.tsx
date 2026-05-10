import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Brain,
  FileCode2,
  Sparkles,
  ShieldAlert,
  Workflow,
  Library,
  Maximize2,
} from "lucide-react";
import type { MemoryCard } from "../../lib/mockData";
import { formatRelative } from "../../lib/mockData";
import { Badge } from "./Badge";
import { SponsorBadge } from "./SponsorBadge";
import { MemoryCardDetailModal } from "./MemoryCardDetailModal";
import { cn } from "../../lib/cn";

const typeIcon = {
  episodic: Sparkles,
  semantic: Brain,
  procedural: Workflow,
  risk: ShieldAlert,
} as const;

const typeColor = {
  episodic: "var(--color-violet-glow)",
  semantic: "var(--color-electric)",
  procedural: "var(--color-acid)",
  risk: "var(--color-warn)",
} as const;

export function MemoryCardItem({
  card,
  index = 0,
  compact = false,
  readableDetail = true,
}: {
  card: MemoryCard;
  index?: number;
  compact?: boolean;
  /** Open full human-readable modal on click (Escape to close). */
  readableDetail?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const Icon = typeIcon[card.type];
  const color = typeColor[card.type];

  return (
    <>
    <motion.div
      role={readableDetail ? "button" : undefined}
      tabIndex={readableDetail ? 0 : undefined}
      onClick={readableDetail ? () => setDetailOpen(true) : undefined}
      onKeyDown={
        readableDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDetailOpen(true);
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-[color:var(--color-surface)] p-5 transition-colors",
        readableDetail && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-acid)]",
        card.is_stale
          ? "border-[color:var(--color-warn)]/30"
          : "border-[color:var(--color-border)] hover:border-white/15"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ background: color }}
      />

      {card.is_stale && (
        <div className="absolute right-3 top-3">
          <Badge tone="warn" icon={<AlertTriangle className="h-3 w-3" />}>
            Stale
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${color} 14%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 30%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
            <span style={{ color }}>{card.type}</span>
            <span>•</span>
            <span>{formatRelative(card.created_at)}</span>
          </div>
        </div>
      </div>

      <h4 className="mt-3 text-[15px] font-semibold leading-snug text-white">
        {card.title}
      </h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--color-muted)]">
        {card.content}
      </p>

      {!compact && card.evidence.length > 0 && (
        <div className="mt-3 space-y-1 border-l border-white/10 pl-3">
          {card.evidence.slice(0, 3).map((e, i) => (
            <div key={i} className="text-[12px] leading-snug text-white/65">
              <span className="text-[color:var(--color-dim)]">• </span>
              {e}
            </div>
          ))}
          {card.evidence.length > 3 && (
            <p className="text-[11px] text-white/40">
              +{card.evidence.length - 3} more in full view
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="muted">
          <Library className="h-3 w-3" />
          {card.confidence} confidence
        </Badge>
        {card.source_files.slice(0, 2).map((f) => (
          <Badge key={f} tone="muted">
            <FileCode2 className="h-3 w-3" />
            <span className="font-mono text-[10.5px]">{f.split("/").pop()}</span>
          </Badge>
        ))}
        <SponsorBadge tag={card.generated_by} prefix="by" className="ml-auto" />
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.retrieve_when.slice(0, 5).map((k) => (
            <span
              key={k}
              className="rounded-md border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10.5px] text-white/65"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {readableDetail && !compact && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[color:var(--color-acid)]/90 opacity-80 group-hover:opacity-100">
          <Maximize2 className="h-3 w-3" />
          <span>Click for full readable view</span>
        </div>
      )}
    </motion.div>
    {readableDetail && (
      <MemoryCardDetailModal card={card} open={detailOpen} onClose={() => setDetailOpen(false)} />
    )}
    </>
  );
}
