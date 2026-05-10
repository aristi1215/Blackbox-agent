import { useState } from "react";
import { motion } from "motion/react";
import { Terminal, Copy, Check, ChevronRight, BookOpen } from "lucide-react";
import { cliCommands } from "../lib/mockData";
import { Badge } from "../components/ui/Badge";
import { AnimatedTerminal } from "../components/ui/AnimatedTerminal";
import { cn } from "../lib/cn";

export function CliPage() {
  const [active, setActive] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const cmd = cliCommands[active];

  function copy(text: string, idx: number) {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1400);
  }

  // Build animated terminal lines for active command
  const lines: { kind: "cmd" | "out" | "ok" | "warn" | "info"; text: string }[] = [
    { kind: "cmd", text: cmd.cmd },
    ...cmd.output.map((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith("✓")) return { kind: "ok" as const, text: l };
      if (trimmed.startsWith("⚠") || trimmed.toUpperCase().includes("STALE"))
        return { kind: "warn" as const, text: l };
      if (trimmed.startsWith("✦") || trimmed.startsWith("→") || trimmed.startsWith("▶"))
        return { kind: "info" as const, text: l };
      return { kind: "out" as const, text: l };
    }),
  ];

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Badge tone="acid" className="mb-3">
          <Terminal className="h-3 w-3" /> the cli
        </Badge>
        <h1 className="font-serif text-[36px] leading-tight text-white text-balance md:text-[48px]">
          Five commands. Infinite agent runs.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-white/60">
          The CLI lives next to your repo. It captures every session locally, ships a clean JSON
          snapshot, and powers the dashboard you're looking at.
        </p>

        {/* Install */}
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {[
            { label: "Install", cmd: "npm i -g @blackbox/cli" },
            { label: "Initialize in your repo", cmd: "blackbox init" },
          ].map((x, idx) => (
            <motion.div
              key={x.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * idx }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4"
            >
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/45">
                {x.label}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[color:var(--color-acid)]">$</span>
                <code className="flex-1 font-mono text-[14px] text-white">{x.cmd}</code>
                <button
                  onClick={() => copy(x.cmd, idx + 1000)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                >
                  {copiedIdx === idx + 1000 ? (
                    <Check className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Commands explorer */}
        <div className="mt-10 grid gap-5 md:grid-cols-[280px_1fr]">
          <ul className="space-y-1.5">
            {cliCommands.map((c, i) => (
              <li key={c.cmd}>
                <button
                  onClick={() => setActive(i)}
                  className={cn(
                    "group relative flex w-full items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-colors",
                    active === i
                      ? "border-[color:var(--color-acid)]/30 bg-[color:var(--color-acid)]/[0.06]"
                      : "hover:border-white/15 hover:bg-white/[0.04]"
                  )}
                >
                  <ChevronRight
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform",
                      active === i
                        ? "translate-x-0 text-[color:var(--color-acid)]"
                        : "-translate-x-1 text-white/35"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-[12.5px] text-white">
                      {c.cmd.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[11.5px] text-white/55">
                      {c.desc}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5">
              <div className="flex items-center justify-between">
                <Badge tone="acid">
                  <Terminal className="h-3 w-3" /> command
                </Badge>
                <button
                  onClick={() => copy(cmd.cmd, active)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/70 hover:border-white/25"
                >
                  {copiedIdx === active ? (
                    <>
                      <Check className="h-3 w-3 text-[color:var(--color-success)]" /> copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> copy
                    </>
                  )}
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-[#08080d] px-4 py-3 font-mono text-[13.5px] leading-[1.7] text-white">
                <span className="text-[color:var(--color-acid)]">$ </span>
                {cmd.cmd}
              </pre>
              <p className="mt-3 text-[13.5px] text-white/65">{cmd.desc}</p>
            </div>

            <AnimatedTerminal lines={lines} />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
                  <BookOpen className="h-3 w-3 text-[color:var(--color-electric)]" />
                  flags
                </div>
                <ul className="space-y-1.5">
                  {[
                    ["--repo <path>", "explicit repo root"],
                    ["--no-snapshot", "skip the working-tree snapshot"],
                    ["--out json", "emit session JSON to stdout"],
                  ].map(([f, d]) => (
                    <li key={f} className="flex items-start gap-2 text-[12px]">
                      <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-white/85">
                        {f}
                      </code>
                      <span className="text-white/55">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
                  <BookOpen className="h-3 w-3 text-[color:var(--color-violet-glow)]" />
                  related env
                </div>
                <ul className="space-y-1.5">
                  {[
                    ["BLACKBOX_DB", "path to local sqlite (default ~/.blackbox/db)"],
                    ["CLOD_API_KEY", "memory generation"],
                    ["NIA_API_KEY", "indexing & retrieval"],
                    ["GREPTILE_API_KEY", "diff review"],
                  ].map(([e, d]) => (
                    <li key={e} className="flex items-start gap-2 text-[12px]">
                      <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-white/85">
                        {e}
                      </code>
                      <span className="text-white/55">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* JSON contract */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-[24px] text-white">Session JSON contract</h3>
            <Badge tone="muted">stable</Badge>
          </div>
          <p className="mt-1 text-[13px] text-white/55">
            Every finished session emits this. Pipe it into any LLM or your own dashboard.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-[#08080d] px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-white/90">
{`{
  "id":            "session_001",
  "task":          "Fix OAuth redirect bug",
  "started_at":    "2026-05-08T14:02:00Z",
  "finished_at":   "2026-05-08T14:42:11Z",
  "base_commit":   "a3f12c9",
  "end_commit":    "9d7e2b1",
  "branch":        "fix/oauth-redirect",
  "changed_files": ["src/auth/callback.ts", "src/auth/session.ts", "tests/auth-callback.test.ts"],
  "diff":          "<unified diff>",
  "commands":      [{ "command": "pnpm test:auth", "exit_code": 0, "duration_ms": 4200 }],
  "file_hashes":   { "src/auth/session.ts": "abc123" }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
