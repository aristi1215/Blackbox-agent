import { useEffect } from "react";
import { X, FileCode2, Sparkles, Calendar, Tag } from "lucide-react";
import type { MemoryCard } from "../../lib/mockData";
import {
  formatAbsoluteDate,
  formatRelative,
  humanMemoryType,
} from "../../lib/mockData";
import { Badge } from "./Badge";
import { SponsorBadge } from "./SponsorBadge";

export function MemoryCardDetailModal({
  card,
  open,
  onClose,
}: {
  card: MemoryCard | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !card) return null;

  const paragraphs = card.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-[6px] md:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-modal-title"
      onClick={onClose}
    >
      <div
        className="relative mt-2 w-full max-w-4xl rounded-2xl border border-white/15 bg-[color:var(--color-bg-soft)] shadow-2xl md:mt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/70 transition-colors hover:border-white/25 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-white/10 px-7 pb-6 pt-8 md:px-9 md:pt-9">
          <div className="flex flex-wrap items-center gap-2 pr-12">
            <Badge tone="violet">{humanMemoryType(card.type)}</Badge>
            {card.is_stale && <Badge tone="warn">Out of date</Badge>}
            <Badge tone="muted">{card.confidence} confidence</Badge>
            <span className="inline-flex items-center gap-1 text-[12.5px] text-white/55">
              <Calendar className="h-3.5 w-3.5" />
              {formatAbsoluteDate(card.created_at)}
              <span className="text-white/30">·</span>
              {formatRelative(card.created_at)}
            </span>
          </div>
          <h2
            id="memory-modal-title"
            className="mt-5 font-serif text-[26px] leading-tight text-white text-balance md:text-[32px]"
          >
            {card.title}
          </h2>
        </div>

        <div className="max-h-[min(76vh,720px)] overflow-y-auto px-7 py-7 md:px-9">
          <div className="grid gap-7 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-7">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/55">
                  <Sparkles className="h-4 w-4 text-[color:var(--color-acid)]" />
                  Summary
                </h3>
                <div className="space-y-3 text-[15.5px] leading-relaxed text-white/85">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>

              {card.evidence.length > 0 && (
                <section>
                  <h3 className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/55">
                    Evidence
                  </h3>
                  <ul className="space-y-2.5 text-[14px] leading-relaxed text-white/80">
                    {card.evidence.map((e, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3"
                      >
                        <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-acid)]" />
                        <span className="break-words">{e}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="space-y-7 lg:border-l lg:border-white/10 lg:pl-7">
              {card.source_files.length > 0 && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/55">
                    <FileCode2 className="h-4 w-4" />
                    Source files ({card.source_files.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {card.source_files.map((f) => (
                      <li
                        key={f}
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[12.5px] text-white/85 break-all"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {card.retrieve_when.length > 0 && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/55">
                    <Tag className="h-4 w-4" />
                    Pulled in when task mentions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {card.retrieve_when.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[12.5px] text-white/80"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {card.stale_if_changed.length > 0 && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/55">
                    <FileCode2 className="h-4 w-4" />
                    Goes stale if these change
                  </h3>
                  <ul className="space-y-1.5">
                    {card.stale_if_changed.map((f) => (
                      <li
                        key={f}
                        className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 font-mono text-[12px] text-white/70 break-all"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-7 py-4 md:px-9">
          <SponsorBadge tag={card.generated_by} prefix="Generated by" />
          <span className="font-mono text-[11.5px] text-white/40">{card.id}</span>
        </div>
      </div>
    </div>
  );
}
