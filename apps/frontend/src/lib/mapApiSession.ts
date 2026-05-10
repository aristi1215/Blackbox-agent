import type {
  AnalysisReport,
  CommandRun,
  DiffHunk,
  FileChange,
  MemoryCard,
  Session,
  SessionStatus,
  SponsorTag,
  TimelineEvent,
} from "./mockData";
import type {
  ApiMemoryRow,
  ApiSessionDetailResponse,
  ApiSessionListItem,
  EvidenceBundleWire,
} from "./api";

function parseJsonStringArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function shortSha(sha: string | undefined): string {
  if (!sha || sha === "unknown") return "unknown";
  return sha.length > 12 ? sha.slice(0, 7) : sha;
}

function extLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "tsx" || ext === "jsx") return ext;
  if (ext === "ts") return "ts";
  if (ext === "md" || ext === "mdc") return "md";
  if (ext === "json") return "json";
  if (ext === "prisma") return "prisma";
  if (ext === "css") return "css";
  return ext || "txt";
}

function fileChangesFromPaths(paths: string[]): FileChange[] {
  return paths.map((p) => ({
    path: p,
    added: 0,
    removed: 0,
    language: extLanguage(p),
    status: "modified" as const,
  }));
}

/** Add per-file +/- counts + status by walking the parsed diff hunks. */
function enrichFileChangesFromDiff(
  base: FileChange[],
  hunks: DiffHunk[]
): FileChange[] {
  if (hunks.length === 0) return base;

  const byPath = new Map<string, FileChange>(base.map((f) => [f.path, { ...f }]));

  for (const hunk of hunks) {
    let entry = byPath.get(hunk.file);
    if (!entry) {
      entry = {
        path: hunk.file,
        added: 0,
        removed: 0,
        language: extLanguage(hunk.file),
        status: "modified",
      };
      byPath.set(hunk.file, entry);
    }
    let sawNewFile = false;
    let sawDeleted = false;
    for (const line of hunk.lines) {
      if (line.type === "add") entry.added += 1;
      else if (line.type === "rem") entry.removed += 1;
      if (line.type === "meta") {
        if (line.text.startsWith("new file mode")) sawNewFile = true;
        if (line.text.startsWith("deleted file mode")) sawDeleted = true;
      }
    }
    if (sawNewFile) entry.status = "added";
    else if (sawDeleted) entry.status = "deleted";
  }

  return Array.from(byPath.values());
}

function inferDetailStatus(bundle: EvidenceBundleWire | null): SessionStatus {
  const actions = bundle?.actions ?? [];
  if (actions.some((a) => a.decision === "deny")) return "partial";
  const ran = actions.filter((a) => a.executed);
  if (ran.some((a) => (a.exit_code ?? 0) !== 0)) return "failed";
  return "success";
}

function inferListStatus(row: ApiSessionListItem): SessionStatus {
  if (row.status !== "finished") return "running";
  return "success";
}

function classifyDiffLine(text: string): DiffHunk["lines"][number]["type"] {
  if (text.startsWith("+") && !text.startsWith("+++")) return "add";
  if (text.startsWith("-") && !text.startsWith("---")) return "rem";
  if (text.startsWith("@@")) return "meta";
  return "ctx";
}

/** Parse a unified-diff string and split it into per-file hunks for the viewer. */
function roughDiffHunks(diffText: string): DiffHunk[] {
  const t = diffText.trim();
  if (!t) return [];

  const lines = t.split("\n");
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let currentHeader = "";

  const flush = () => {
    if (current && current.lines.length > 0) hunks.push(current);
  };

  for (const raw of lines) {
    if (raw.startsWith("diff --git ")) {
      flush();
      const m = raw.match(/diff --git a\/(\S+) b\/(\S+)/);
      const file = m ? m[2] : "changes.patch";
      currentHeader = "";
      current = { file, header: "", lines: [] };
      continue;
    }
    if (raw.startsWith("@@")) {
      currentHeader = raw;
      if (current) current.header = currentHeader;
    }

    if (!current) {
      current = { file: "changes.patch", header: "", lines: [] };
    }

    if (
      raw.startsWith("index ") ||
      raw.startsWith("--- ") ||
      raw.startsWith("+++ ") ||
      raw.startsWith("new file mode") ||
      raw.startsWith("deleted file mode") ||
      raw.startsWith("similarity index") ||
      raw.startsWith("rename ") ||
      raw.startsWith("Binary files")
    ) {
      current.lines.push({ type: "meta", text: raw });
      continue;
    }

    current.lines.push({ type: classifyDiffLine(raw), text: raw });
  }
  flush();

  return hunks;
}

function buildTimeline(bundle: EvidenceBundleWire | null): TimelineEvent[] {
  if (!bundle) return [];
  const events: TimelineEvent[] = [];
  events.push({
    id: "t_start",
    ts: bundle.startedAt ?? "",
    kind: "session_start",
    title: "Session started",
    detail: `Branch ${bundle.branch ?? ""}`,
    tone: "info",
  });
  for (const a of bundle.actions ?? []) {
    const bad = a.executed && (a.exit_code ?? 0) !== 0;
    events.push({
      id: a.action_id,
      ts: a.ts,
      kind: "command",
      title: a.command,
      detail: `${a.decision ?? "allow"} · exit ${a.exit_code ?? "—"}`,
      tone: bad ? "bad" : "neutral",
    });
  }
  events.push({
    id: "t_end",
    ts: bundle.finishedAt ?? "",
    kind: "session_end",
    title: "Session finished",
    tone: "good",
  });
  return events;
}

function buildCommands(bundle: EvidenceBundleWire | null): CommandRun[] {
  return (
    bundle?.actions
      ?.filter((a) => a.executed)
      .map((a) => ({
        command: a.command,
        output: [a.stdout, a.stderr].filter(Boolean).join("\n").trim() || "(no output)",
        exit_code: a.exit_code ?? -1,
        duration_ms: 0,
      })) ?? []
  );
}

function testSummaryFromCommands(cmds: CommandRun[]): Session["test_summary"] {
  const failed = cmds.filter((c) => c.exit_code !== 0).length;
  const passed = cmds.filter((c) => c.exit_code === 0).length;
  return { passed, failed, skipped: 0 };
}

function claimTexts(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object" && "text" in x) {
        return String((x as { text: unknown }).text);
      }
      return "";
    })
    .filter(Boolean);
}

function stubAnalysisFromReport(
  report: Record<string, unknown>,
  bundle: EvidenceBundleWire | null
): AnalysisReport {
  const summary =
    typeof report.summary === "string"
      ? report.summary
      : "Summary was not recorded for this session.";
  const observed = claimTexts(report.observedFacts);
  const inferred = claimTexts(report.inferredHypotheses);
  const agentClaims = claimTexts(report.agentReportedClaims);

  const score =
    inferDetailStatus(bundle) === "success" ? 0.82 : inferDetailStatus(bundle) === "failed" ? 0.55 : 0.68;
  const validated = inferDetailStatus(bundle) === "success" && observed.some((o) => /test|pass/i.test(o));

  const primaryFile = bundle?.changedFiles?.[0] ?? "repository";

  const reviewedBy: SponsorTag[] = ["CLōD"];

  return {
    rootCause: {
      title: "Session evidence (Witsmith)",
      summary,
      file: primaryFile,
      line: undefined,
    },
    assumption: {
      incorrect: agentClaims[0] ?? "—",
      actual: observed.slice(0, 4).join(" · ") || inferred.join(" · ") || "—",
    },
    sourceOfTruth: {
      file: primaryFile,
      reason: "Based on git diff and commands captured in the session artifact.",
    },
    confidence: {
      score,
      validatedByTests: validated,
      breakdown: [
        { label: "Commands recorded", score: 0.85 },
        { label: "Diff captured", score: bundle?.diff ? 0.8 : 0.4 },
      ],
    },
    futureWarning:
      inferred[0] ??
      "Treat agent trace entries as claims until verified against the repo.",
    reviewedBy,
  };
}

function staticListAnalysis(): AnalysisReport {
  return {
    rootCause: {
      title: "Open session for details",
      summary: "Analysis loads when you open the session detail view.",
    },
    assumption: { incorrect: "—", actual: "—" },
    sourceOfTruth: { file: "—", reason: "—" },
    confidence: {
      score: 0.7,
      validatedByTests: false,
      breakdown: [{ label: "List view", score: 0.7 }],
    },
    futureWarning: "Select a session for full evidence.",
    reviewedBy: ["CLōD"],
  };
}

export function mapDbMemoryToUi(mc: ApiMemoryRow): MemoryCard {
  const evidence = parseJsonStringArray(mc.evidence);
  const source_files = parseJsonStringArray(mc.sourceFiles);
  const retrieve_when = parseJsonStringArray(mc.retrieveWhen);
  const stale_if_changed = parseJsonStringArray(mc.staleIfChanged);

  const title =
    mc.content.split(/[.!?\n]/)[0]?.trim().slice(0, 72) ||
    `${mc.type} memory`;

  const type =
    mc.type === "risk" || mc.type === "semantic" || mc.type === "procedural" || mc.type === "episodic"
      ? mc.type
      : "episodic";

  return {
    id: mc.id,
    session_id: mc.sessionId,
    type,
    title,
    content: mc.content,
    evidence,
    source_files,
    confidence:
      mc.confidence === "low" || mc.confidence === "medium" || mc.confidence === "high"
        ? mc.confidence
        : "medium",
    retrieve_when,
    stale_if_changed,
    is_stale: mc.isStale,
    created_at: mc.createdAt,
    generated_by: "CLōD",
    retrieved_count: 0,
  };
}

export function mapListItemToSession(row: ApiSessionListItem): Session {
  const paths = parseJsonStringArray(row.changedFiles);
  const changed_files = fileChangesFromPaths(paths);
  const started = new Date(row.startedAt).getTime();
  const finished = new Date(row.finishedAt).getTime();
  const duration_ms = Math.max(0, finished - started);

  const repoShort =
    row.repoPath.replace(/\\/g, "/").split("/").filter(Boolean).slice(-2).join("/") || row.repoPath;

  return {
    id: row.id,
    task: row.task,
    description: row.task,
    status: inferListStatus(row),
    started_at: row.startedAt,
    finished_at: row.finishedAt,
    duration_ms,
    base_commit: shortSha(row.baseCommit),
    end_commit: shortSha(row.endCommit),
    branch: row.branch,
    agent: { name: "Witsmith session", model: "cli-recorded", avatar: "W" },
    repo: repoShort,
    changed_files,
    diff: [],
    commands: [],
    timeline: [],
    assumptions: [],
    analysis: staticListAnalysis(),
    memory_cards: [],
    tokens: { input: 0, output: 0 },
    cost_usd: 0,
    test_summary: { passed: 0, failed: 0, skipped: 0 },
  };
}

export type SessionEvidence = {
  /** Plain-text summary from `report.summary` (may be empty). */
  summary: string;
  /** Bullet items observed by Witsmith from real artifacts (diff/log). */
  observedFacts: string[];
  /** Statements the agent itself reported (treat as claims, not facts). */
  agentReportedClaims: string[];
  /** Hypotheses Witsmith inferred from observed facts. */
  inferredHypotheses: string[];
  /** Markdown-ish trace string captured from the agent's notes. */
  agentTrace: string;
  /** Raw JSON envelope shown verbatim in a "Raw" view. */
  raw: { evidenceBundle: EvidenceBundleWire | null; report: Record<string, unknown> };
};

export function mapDetailResponse(res: ApiSessionDetailResponse): {
  session: Session;
  cards: MemoryCard[];
  evidence: SessionEvidence;
} {
  const bundle = res.evidenceBundle;
  const paths =
    bundle?.changedFiles ?? parseJsonStringArray(res.changedFiles);
  const cmds = buildCommands(bundle);
  const timeline = buildTimeline(bundle);
  const diff = roughDiffHunks(bundle?.diff ?? res.diff ?? "");
  const changed_files = enrichFileChangesFromDiff(fileChangesFromPaths(paths), diff);

  const started = new Date(res.startedAt).getTime();
  const finished = new Date(res.finishedAt).getTime();
  const duration_ms = Math.max(0, finished - started);

  const cards = res.memoryCards.map(mapDbMemoryToUi);
  const memory_cards = cards.map((c) => c.id);

  const repoShort =
    res.repoPath.replace(/\\/g, "/").split("/").filter(Boolean).slice(-2).join("/") || res.repoPath;

  const session: Session = {
    id: res.id,
    task: res.task,
    description:
      typeof res.report.summary === "string"
        ? res.report.summary
        : res.task,
    status: inferDetailStatus(bundle),
    started_at: res.startedAt,
    finished_at: res.finishedAt,
    duration_ms,
    base_commit: shortSha(bundle?.baseCommit ?? res.baseCommit),
    end_commit: shortSha(bundle?.endCommit ?? res.endCommit),
    branch: res.branch,
    agent: { name: "Witsmith session", model: "cli-recorded", avatar: "W" },
    repo: repoShort,
    changed_files,
    diff,
    commands: cmds,
    timeline,
    assumptions: [],
    analysis: stubAnalysisFromReport(res.report, bundle),
    memory_cards,
    tokens: { input: 0, output: 0 },
    cost_usd: 0,
    test_summary: testSummaryFromCommands(cmds),
  };

  const evidence: SessionEvidence = {
    summary:
      typeof res.report.summary === "string" ? res.report.summary : "",
    observedFacts: claimTexts(res.report.observedFacts),
    agentReportedClaims: claimTexts(res.report.agentReportedClaims),
    inferredHypotheses: claimTexts(res.report.inferredHypotheses),
    agentTrace: typeof bundle?.agentTrace === "string" ? bundle.agentTrace : "",
    raw: { evidenceBundle: bundle, report: res.report },
  };

  return { session, cards, evidence };
}
