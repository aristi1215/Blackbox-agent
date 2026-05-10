import { motion } from "motion/react";
import { cn } from "../../lib/cn";

export function ConfidenceMeter({
  score,
  size = 96,
  thickness = 8,
  showLabel = true,
}: {
  score: number;
  size?: number;
  thickness?: number;
  showLabel?: boolean;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, score)));
  const color =
    score >= 0.85
      ? "var(--color-success)"
      : score >= 0.6
      ? "var(--color-acid)"
      : score >= 0.4
      ? "var(--color-warn)"
      : "var(--color-danger)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-serif text-[28px] leading-none text-white">{Math.round(score * 100)}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-dim)]">
            score
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfidenceBar({
  label,
  score,
  className,
}: {
  label: string;
  score: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/75">{label}</span>
        <span className="font-mono text-[11px] text-white/60">{Math.round(score * 100)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${score * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--color-acid) 80%, transparent), var(--color-acid))",
            boxShadow: "0 0 14px color-mix(in oklab, var(--color-acid) 60%, transparent)",
          }}
        />
      </div>
    </div>
  );
}
