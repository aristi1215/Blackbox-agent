import { useEffect, useState } from "react";
import { motion } from "motion/react";

type Line = { kind: "cmd" | "out" | "ok" | "warn" | "info"; text: string };

export function AnimatedTerminal({
  lines,
  prompt = "~/blackbox $",
  className,
  loop = true,
}: {
  lines: Line[];
  prompt?: string;
  className?: string;
  loop?: boolean;
}) {
  const [shown, setShown] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      setShown([]);
      setTyping("");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (cancelled) return;
        if (line.kind === "cmd") {
          for (let c = 0; c <= line.text.length; c++) {
            if (cancelled) return;
            setTyping(line.text.slice(0, c));
            await sleep(28);
          }
          setShown((s) => [...s, line]);
          setTyping("");
          await sleep(280);
        } else {
          setShown((s) => [...s, line]);
          await sleep(line.kind === "ok" || line.kind === "warn" || line.kind === "info" ? 220 : 110);
        }
      }
      if (!cancelled && loop) {
        timer = setTimeout(() => {
          if (!cancelled) setCycleKey((k) => k + 1);
        }, 3500);
      }
    }
    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [lines, loop, cycleKey]);

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080d] " +
        "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11px] text-white/40">blackbox — bash</span>
      </div>
      <div className="scanlines min-h-[260px] px-5 py-4 font-mono text-[12.5px] leading-[1.7]">
        {shown.map((l, i) => (
          <LineRow key={`${cycleKey}-${i}`} line={l} prompt={prompt} />
        ))}
        {typing && (
          <div className="flex gap-2 text-white/90">
            <span className="text-[color:var(--color-acid)]">{prompt}</span>
            <span>{typing}</span>
            <span className="caret text-white" />
          </div>
        )}
        {!typing && shown.length > 0 && shown[shown.length - 1].kind !== "cmd" && (
          <div className="flex gap-2 text-white/90">
            <span className="text-[color:var(--color-acid)]">{prompt}</span>
            <span className="caret text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function LineRow({ line, prompt }: { line: Line; prompt: string }) {
  if (line.kind === "cmd") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 text-white/95"
      >
        <span className="text-[color:var(--color-acid)]">{prompt}</span>
        <span>{line.text}</span>
      </motion.div>
    );
  }
  const color =
    line.kind === "ok"
      ? "text-[color:var(--color-success)]"
      : line.kind === "warn"
      ? "text-[color:var(--color-warn)]"
      : line.kind === "info"
      ? "text-[color:var(--color-electric)]"
      : "text-white/70";
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className={`pl-[3.4ch] ${color}`}
    >
      {line.text}
    </motion.div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
