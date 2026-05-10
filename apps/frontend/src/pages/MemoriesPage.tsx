import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Brain,
  ShieldAlert,
  Sparkles,
  Workflow,
  AlertTriangle,
  ScanLine,
  RefreshCw,
} from "lucide-react";
import { memoryCards, sessions } from "../lib/mockData";
import { MemoryCardItem } from "../components/ui/MemoryCardItem";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";

type CardType = "episodic" | "semantic" | "procedural" | "risk";

const typeFilters: { id: "all" | CardType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: Brain },
  { id: "risk", label: "Risk", icon: ShieldAlert },
  { id: "semantic", label: "Semantic", icon: Brain },
  { id: "procedural", label: "Procedural", icon: Workflow },
  { id: "episodic", label: "Episodic", icon: Sparkles },
];

export function MemoriesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | CardType>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [taskQuery, setTaskQuery] = useState("");

  const filtered = useMemo(() => {
    return memoryCards.filter((c) => {
      const matchType = type === "all" || c.type === type;
      const matchStale = !staleOnly || c.is_stale;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.retrieve_when.some((k) => k.includes(q)) ||
        c.source_files.some((f) => f.toLowerCase().includes(q));
      return matchType && matchStale && matchQuery;
    });
  }, [query, type, staleOnly]);

  const staleCount = memoryCards.filter((c) => c.is_stale).length;

  // Simulated retrieval
  const suggested = useMemo(() => {
    if (!taskQuery.trim()) return [];
    const q = taskQuery.toLowerCase();
    return memoryCards
      .map((c) => {
        const score = c.retrieve_when.reduce(
          (acc, k) => acc + (q.includes(k) ? 2 : 0),
          0
        ) + (q.split(/\s+/).some((w) => c.title.toLowerCase().includes(w)) ? 1 : 0);
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [taskQuery]);

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="violet" className="mb-3">
              <Brain className="h-3 w-3" /> agent memory
            </Badge>
            <h1 className="font-serif text-[36px] leading-tight text-white md:text-[44px]">
              The lessons your agents leave behind.
            </h1>
            <p className="mt-2 max-w-2xl text-[14.5px] text-white/60">
              Memory cards distilled from finished sessions by CLōD, retrievable through Nia,
              enriched with Greptile review. Stale ones light up the moment their source files
              change.
            </p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white hover:border-white/20">
            <ScanLine className="h-4 w-4 text-[color:var(--color-acid)]" />
            Run stale check
          </button>
        </div>

        {/* Stat strip */}
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            { l: "Total cards", v: memoryCards.length, c: "var(--color-violet-glow)" },
            {
              l: "By risk type",
              v: memoryCards.filter((c) => c.type === "risk").length,
              c: "var(--color-warn)",
            },
            {
              l: "Sessions covered",
              v: new Set(memoryCards.map((c) => c.session_id)).size,
              c: "var(--color-electric)",
            },
            {
              l: "Stale",
              v: staleCount,
              c: staleCount > 0 ? "var(--color-warn)" : "var(--color-success)",
            },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
                style={{ background: s.c }}
              />
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/45">
                {s.l}
              </div>
              <div className="mt-2 font-serif text-[34px] leading-none text-white">{s.v}</div>
            </motion.div>
          ))}
        </div>

        {/* Retrieval simulator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)]/70"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/45">
                <Sparkles className="h-3 w-3 text-[color:var(--color-acid)]" />
                live retrieval — `blackbox context`
              </div>
              <h3 className="mt-1 font-serif text-[20px] text-white">
                What does my next agent need to know?
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/45">
              <RefreshCw className="h-3 w-3" /> Indexed by Nia
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[color:var(--color-acid)]">
                $
              </span>
              <input
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder='blackbox context "fix oauth token expiry"'
                className="h-11 w-full rounded-xl border border-white/10 bg-[color:var(--color-bg-soft)] pl-7 pr-3 font-mono text-[13px] text-white placeholder-white/35 outline-none focus:border-[color:var(--color-acid)]/50"
              />
            </div>
            <div className="mt-4">
              {!taskQuery.trim() ? (
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/55">
                  <span className="text-white/35">try:</span>
                  {[
                    "fix oauth token expiry",
                    "add comment avatars",
                    "investigate cart race",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setTaskQuery(q)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 hover:border-white/25 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : suggested.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[12.5px] text-white/55">
                  No relevant memories. Your agent will start fresh.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {suggested.map(({ c }, i) => (
                    <MemoryCardItem key={c.id} card={c} index={i} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories…"
              className="h-10 w-full rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-3 text-[13.5px] text-white placeholder-white/35 outline-none focus:border-[color:var(--color-acid)]/40"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1">
            {typeFilters.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  type === t.id ? "text-black" : "text-white/65 hover:text-white"
                )}
              >
                {type === t.id && (
                  <motion.span
                    layoutId="memory-pill"
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
          <button
            onClick={() => setStaleOnly((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
              staleOnly
                ? "border-[color:var(--color-warn)]/40 bg-[color:var(--color-warn)]/10 text-[color:var(--color-warn)]"
                : "border-white/10 text-white/65 hover:border-white/25 hover:text-white"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Stale only ({staleCount})
          </button>
        </div>

        {/* Cards */}
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-16 text-center text-sm text-white/55">
              No memory cards match.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c, i) => (
                <MemoryCardItem key={c.id} card={c} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-[12px] text-white/55">
          <span>
            Memory cards are derived from {sessions.length} sessions across the demo dataset.
          </span>
          <span className="font-mono">
            stale_if_changed → re-hashed every `blackbox stale-check`
          </span>
        </div>
      </div>
    </div>
  );
}
