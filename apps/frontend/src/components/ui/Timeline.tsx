import { motion } from "motion/react";
import {
  Play,
  Camera,
  MessageSquare,
  Wrench,
  FileEdit,
  Terminal,
  TestTube2,
  AlertTriangle,
  Brain,
  Flag,
} from "lucide-react";
import type { TimelineEvent } from "../../lib/mockData";
import { cn } from "../../lib/cn";

const iconMap = {
  session_start: Play,
  snapshot: Camera,
  agent_message: MessageSquare,
  tool_call: Wrench,
  file_edit: FileEdit,
  command: Terminal,
  test_run: TestTube2,
  assumption: AlertTriangle,
  memory_card: Brain,
  session_end: Flag,
} as const;

const toneColor = {
  neutral: "rgba(255,255,255,0.5)",
  good: "var(--color-success)",
  bad: "var(--color-danger)",
  warn: "var(--color-warn)",
  info: "var(--color-electric)",
} as const;

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative">
      <div
        aria-hidden
        className="absolute left-[19px] top-2 bottom-2 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 8%, rgba(255,255,255,0.18) 92%, transparent 100%)",
        }}
      />
      {events.map((evt, i) => {
        const Icon = iconMap[evt.kind];
        const color = toneColor[evt.tone ?? "neutral"];
        return (
          <motion.li
            key={evt.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="relative flex gap-4 pb-5"
          >
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
              <span
                className="absolute inset-0 m-auto h-10 w-10 rounded-full"
                style={{
                  background: `radial-gradient(closest-side, color-mix(in oklab, ${color} 30%, transparent), transparent 70%)`,
                }}
              />
              <span
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border bg-[color:var(--color-bg)]",
                  evt.tone === "good" && "pulse-ring text-[color:var(--color-success)]"
                )}
                style={{
                  borderColor: `color-mix(in oklab, ${color} 60%, transparent)`,
                  color,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-mono text-[11px] tracking-wider text-[color:var(--color-dim)]">
                  {evt.ts}
                </span>
                <span className="text-[14px] font-medium text-white">{evt.title}</span>
              </div>
              {evt.detail && (
                <div className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
                  {evt.detail}
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
