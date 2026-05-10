export function useApiMode(): boolean {
  return import.meta.env.VITE_USE_API === "true";
}

export type ApiSessionListItem = {
  id: string;
  task: string;
  branch: string;
  baseCommit: string;
  endCommit: string;
  repoPath: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  changedFiles: string;
  _count: { memoryCards: number };
};

export type ApiMemoryRow = {
  id: string;
  sessionId: string;
  type: string;
  claimType: string;
  content: string;
  evidence: string;
  sourceFiles: string;
  confidence: string;
  retrieveWhen: string;
  staleIfChanged: string;
  isStale: boolean;
  createdAt: string;
  session?: { id: string; task: string };
};

export type ApiSessionDetailResponse = {
  id: string;
  task: string;
  repoPath: string;
  branch: string;
  baseCommit: string;
  endCommit: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  agentTrace: string;
  changedFiles: string;
  diff: string;
  evidenceBundle: EvidenceBundleWire | null;
  report: Record<string, unknown>;
  memoryCards: ApiMemoryRow[];
};

export type EvidenceBundleWire = {
  id?: string;
  task?: string;
  repoPath?: string;
  branch?: string;
  baseCommit?: string;
  endCommit?: string;
  startedAt?: string;
  finishedAt?: string;
  status?: string;
  changedFiles?: string[];
  diff?: string;
  actions?: ActionWire[];
  agentTrace?: string;
};

export type ActionWire = {
  action_id: string;
  ts: string;
  command: string;
  cwd?: string;
  decision?: string;
  executed?: boolean;
  exit_code?: number | null;
  stdout?: string;
  stderr?: string;
};

async function parseJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<T>;
}

export async function fetchSessionsList(): Promise<ApiSessionListItem[]> {
  return parseJson(await fetch("/api/sessions"));
}

export async function fetchSessionDetail(id: string): Promise<ApiSessionDetailResponse> {
  return parseJson(await fetch(`/api/sessions/${encodeURIComponent(id)}`));
}

export async function fetchMemoriesList(): Promise<ApiMemoryRow[]> {
  return parseJson(await fetch("/api/memories"));
}

export async function postImportSession(pathToJson: string): Promise<unknown> {
  const r = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: pathToJson }),
  });
  return parseJson(r);
}
