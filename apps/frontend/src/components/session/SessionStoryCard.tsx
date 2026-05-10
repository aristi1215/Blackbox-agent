import type { ReactNode } from "react";
import { BookOpen, Clock, FolderGit2, GitBranch, Hash, ListTree, Sparkles } from "lucide-react";
import type { Session } from "../../lib/mockData";
import { formatDuration, formatSessionTimeRange } from "../../lib/mockData";

export function SessionStoryCard({
  session,
  memoryCardCount,
  commandCount,
}: {
  session: Session;
  memoryCardCount: number;
  commandCount: number;
}) {
  const summaryLines = session.description
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const facts: { icon: ReactNode; label: string; value: string }[] = [
    {
      icon: <Clock className="h-4 w-4 text-[color:var(--color-acid)]" />,
      label: "When",
      value: formatSessionTimeRange(session.started_at, session.finished_at),
    },
    {
      icon: <GitBranch className="h-4 w-4 text-[color:var(--color-electric)]" />,
      label: "Branch",
      value: session.branch,
    },
    {
      icon: <FolderGit2 className="h-4 w-4 text-white/50" />,
      label: "Repo folder",
      value: session.repo,
    },
    {
      icon: <ListTree className="h-4 w-4 text-white/50" />,
      label: "Duration",
      value: formatDuration(session.duration_ms),
    },
    {
      icon: <Hash className="h-4 w-4 text-white/50" />,
      label: "Files touched",
      value: `${session.changed_files.length} file${session.changed_files.length === 1 ? "" : "s"}`,
    },
    {
      icon: <Sparkles className="h-4 w-4 text-[color:var(--color-violet-glow)]" />,
      label: "Commands in log",
      value: `${commandCount} recorded`,
    },
    {
      icon: <BookOpen className="h-4 w-4 text-[color:var(--color-violet-glow)]" />,
      label: "Memory cards",
      value:
        memoryCardCount === 0
          ? "None for this session"
          : `${memoryCardCount} saved for later tasks`,
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.06] to-transparent p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        <BookOpen className="h-3.5 w-3.5 text-[color:var(--color-acid)]" />
        Session story
      </div>
      <h2 className="mt-2 font-serif text-[22px] leading-snug text-white md:text-[26px]">
        What this session was about
      </h2>

      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/80">
        {summaryLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="mt-0.5 shrink-0">{f.icon}</div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                {f.label}
              </div>
              <div className="mt-0.5 text-[13px] leading-snug text-white/90">{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-white/45">
        Tip: use the tabs below for timeline, diff, and commands. Memory cards can be opened for a
        full readable view.
      </p>
    </section>
  );
}
