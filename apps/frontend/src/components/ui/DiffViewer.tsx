import { motion } from "motion/react";
import type { DiffHunk } from "../../lib/mockData";
import { cn } from "../../lib/cn";
import { FileCode2 } from "lucide-react";

export function DiffViewer({ hunks }: { hunks: DiffHunk[] }) {
  if (hunks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/50">
        No diff captured yet — session is still recording.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hunks.map((hunk, idx) => (
        <motion.div
          key={`${hunk.file}-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.5, delay: idx * 0.05 }}
          className="overflow-hidden rounded-xl border border-white/10 bg-[color:var(--color-bg-soft)]"
        >
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
            <div className="flex items-center gap-2.5 text-[13px]">
              <FileCode2 className="h-4 w-4 text-[color:var(--color-electric)]" />
              <span className="font-mono text-white/85">{hunk.file}</span>
            </div>
            <span className="font-mono text-[11px] text-white/40">{hunk.header}</span>
          </div>
          <pre className="m-0 overflow-x-auto px-0 py-2 font-mono text-[12.5px] leading-[1.55]">
            {hunk.lines.map((line, i) => {
              const sign =
                line.type === "add" ? "+" : line.type === "rem" ? "-" : line.type === "meta" ? "@" : " ";
              return (
                <div
                  key={i}
                  className={cn(
                    "group flex min-w-full items-stretch px-1",
                    line.type === "add" && "bg-[color:var(--color-success)]/[0.08]",
                    line.type === "rem" && "bg-[color:var(--color-danger)]/[0.08]"
                  )}
                >
                  <span
                    className={cn(
                      "w-9 select-none px-2 text-right text-[10.5px] tabular-nums text-white/30",
                      line.type === "add" && "text-[color:var(--color-success)]/70",
                      line.type === "rem" && "text-[color:var(--color-danger)]/70"
                    )}
                  >
                    {line.n ?? ""}
                  </span>
                  <span
                    className={cn(
                      "w-5 select-none text-center font-bold",
                      line.type === "add" && "text-[color:var(--color-success)]",
                      line.type === "rem" && "text-[color:var(--color-danger)]",
                      (line.type === "ctx" || line.type === "meta") && "text-white/30"
                    )}
                  >
                    {sign}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 whitespace-pre pr-3",
                      line.type === "add" && "text-white/95",
                      line.type === "rem" && "text-white/70",
                      line.type === "ctx" && "text-white/55",
                      line.type === "meta" && "text-white/40"
                    )}
                  >
                    {line.text || " "}
                  </span>
                </div>
              );
            })}
          </pre>
        </motion.div>
      ))}
    </div>
  );
}
