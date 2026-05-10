import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "acid" | "electric" | "violet" | "good" | "warn" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-white/5 text-white/85 border-white/10",
  muted:
    "bg-white/[0.03] text-[color:var(--color-muted)] border-white/5",
  acid:
    "bg-[color:var(--color-acid)]/12 text-[color:var(--color-acid)] border-[color:var(--color-acid)]/30",
  electric:
    "bg-[color:var(--color-electric)]/12 text-[color:var(--color-electric)] border-[color:var(--color-electric)]/25",
  violet:
    "bg-[color:var(--color-violet-glow)]/15 text-[color:var(--color-violet-glow)] border-[color:var(--color-violet-glow)]/25",
  good:
    "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] border-[color:var(--color-success)]/30",
  warn:
    "bg-[color:var(--color-warn)]/15 text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30",
  danger:
    "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/30",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
  size = "sm",
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
        className
      )}
    >
      {icon && <span className="-ml-0.5 inline-flex h-3 w-3 items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
}
