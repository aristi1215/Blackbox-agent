import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  GitCompare,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Zap,
  FileCode2,
  ExternalLink,
} from "lucide-react";
import { assumptionShifts, getSession } from "../lib/mockData";
import { Badge } from "../components/ui/Badge";

export function AssumptionsPage() {
  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div>
          <Badge tone="warn" className="mb-3">
            <GitCompare className="h-3 w-3" /> assumption shift detection
          </Badge>
          <h1 className="font-serif text-[36px] leading-tight text-white text-balance md:text-[48px]">
            Every time the truth moved, we noticed.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-white/60">
            When an agent's initial assumption gets contradicted by tests, code review or runtime
            evidence, we capture both sides plus the trigger that flipped them. Future runs start
            from the corrected version.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            { l: "Shifts detected", v: assumptionShifts.length, c: "var(--color-warn)" },
            {
              l: "Triggered by tests",
              v: assumptionShifts.filter((s) => s.trigger.toLowerCase().includes("test")).length,
              c: "var(--color-electric)",
            },
            {
              l: "Triggered by sponsors",
              v: assumptionShifts.filter((s) =>
                s.trigger.toLowerCase().includes("greptile") ||
                s.trigger.toLowerCase().includes("nia")
              ).length,
              c: "var(--color-violet-glow)",
            },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
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

        {/* Shifts */}
        <ol className="mt-10 space-y-5">
          {assumptionShifts.map((shift, i) => {
            const session = getSession(shift.detected_in_session);
            return (
              <motion.li
                key={shift.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--color-surface)] p-5"
              >
                {/* index */}
                <div className="absolute -left-1 -top-1 grid h-12 w-12 place-items-center font-serif text-[24px] text-[color:var(--color-acid)]/30">
                  0{i + 1}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pl-12">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
                      Topic
                    </div>
                    <h3 className="mt-1 font-serif text-[22px] leading-tight text-white">
                      {shift.topic}
                    </h3>
                  </div>
                  <Link
                    to={`/sessions/${shift.detected_in_session}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11.5px] text-white/70 hover:border-white/25 hover:text-white"
                  >
                    detected in {session?.task ?? shift.detected_in_session}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                  <div className="rounded-xl border border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/[0.06] p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-warn)]/85">
                      <AlertTriangle className="h-3 w-3" /> Initial assumption
                    </div>
                    <p className="text-[14px] leading-snug text-white/90">
                      {shift.initial.assumption}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/65">
                      <FileCode2 className="h-3 w-3" /> {shift.initial.source}
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--color-acid)]/40 bg-[color:var(--color-acid)]/10">
                        <Zap className="h-5 w-5 text-[color:var(--color-acid)]" />
                      </div>
                      <div className="max-w-[180px] rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-center text-[11px] text-white/70">
                        {shift.trigger}
                      </div>
                      <ArrowRight className="hidden h-4 w-4 text-[color:var(--color-acid)] lg:block" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/[0.06] p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--color-success)]/85">
                      <ShieldCheck className="h-3 w-3" /> Corrected assumption
                    </div>
                    <p className="text-[14px] leading-snug text-white/90">
                      {shift.corrected.assumption}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/65">
                      <FileCode2 className="h-3 w-3" /> {shift.corrected.source}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
