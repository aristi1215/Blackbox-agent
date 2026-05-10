/**
 * Rich mock data describing the full Blackbox feature surface so the UI can
 * showcase every planned capability end-to-end.
 *
 * Backend / API integration is intentionally out of scope; this file is the
 * single source of truth for the demo.
 */

export type SponsorTag = "CLōD" | "Nia" | "Greptile";

export type SessionStatus = "success" | "failed" | "partial" | "running";

export type FileChange = {
  path: string;
  added: number;
  removed: number;
  language: string;
  status: "modified" | "added" | "deleted" | "renamed";
};

export type DiffHunk = {
  file: string;
  header: string;
  lines: { type: "ctx" | "add" | "rem" | "meta"; text: string; n?: number }[];
};

export type CommandRun = {
  command: string;
  output: string;
  exit_code: number;
  duration_ms: number;
};

export type TimelineEvent = {
  id: string;
  ts: string;
  kind:
    | "session_start"
    | "snapshot"
    | "agent_message"
    | "tool_call"
    | "file_edit"
    | "command"
    | "test_run"
    | "assumption"
    | "memory_card"
    | "session_end";
  title: string;
  detail?: string;
  tone?: "neutral" | "good" | "bad" | "warn" | "info";
  meta?: Record<string, string | number | boolean>;
};

export type Assumption = {
  id: string;
  text: string;
  source: string;
  status: "initial" | "corrected" | "validated" | "rejected";
  confidence: number; // 0..1
  evidence: string[];
};

export type AssumptionShift = {
  id: string;
  topic: string;
  initial: { assumption: string; source: string };
  corrected: { assumption: string; source: string };
  trigger: string;
  detected_in_session: string;
};

export type AnalysisReport = {
  rootCause: {
    title: string;
    summary: string;
    file?: string;
    line?: number;
  };
  assumption: {
    incorrect: string;
    actual: string;
  };
  sourceOfTruth: {
    file: string;
    reason: string;
  };
  confidence: {
    score: number; // 0..1
    validatedByTests: boolean;
    breakdown: { label: string; score: number }[];
  };
  futureWarning: string;
  reviewedBy: SponsorTag[];
};

export type MemoryCard = {
  id: string;
  session_id: string;
  type: "episodic" | "semantic" | "procedural" | "risk";
  title: string;
  content: string;
  evidence: string[];
  source_files: string[];
  confidence: "low" | "medium" | "high";
  retrieve_when: string[];
  stale_if_changed: string[];
  is_stale: boolean;
  created_at: string;
  generated_by: SponsorTag;
  retrieved_count: number;
};

export type Session = {
  id: string;
  task: string;
  description: string;
  status: SessionStatus;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  base_commit: string;
  end_commit: string;
  branch: string;
  agent: { name: string; model: string; avatar: string };
  repo: string;
  changed_files: FileChange[];
  diff: DiffHunk[];
  commands: CommandRun[];
  timeline: TimelineEvent[];
  assumptions: Assumption[];
  analysis: AnalysisReport;
  memory_cards: string[]; // memory card ids
  tokens: { input: number; output: number };
  cost_usd: number;
  test_summary: { passed: number; failed: number; skipped: number };
};

export const sponsorMeta: Record<
  SponsorTag,
  { color: string; description: string; role: string }
> = {
  CLōD: {
    color: "#b289ff",
    description: "Memory card generation and session summarization.",
    role: "Generator",
  },
  Nia: {
    color: "#6ea8ff",
    description: "Indexes & retrieves memory cards for new tasks.",
    role: "Retrieval",
  },
  Greptile: {
    color: "#5ddf9b",
    description: "Codebase-aware diff review and risk surfacing.",
    role: "Diff review",
  },
};

/* --------------------------------- Memory cards --------------------------------- */

export const memoryCards: MemoryCard[] = [
  {
    id: "mc_001",
    session_id: "session_001",
    type: "risk",
    title: "OAuth token expiry is enforced in code, not docs",
    content:
      "docs/oauth.md says tokens expire after 24h but src/auth/session.ts hard-codes 1h with no override. Trust the code path; docs are stale.",
    evidence: [
      "tests/auth-callback.test.ts failed with TokenExpiredError after 1h",
      "src/auth/session.ts:42 → const TTL_MS = 60 * 60 * 1000;",
    ],
    source_files: ["src/auth/session.ts", "docs/oauth.md"],
    confidence: "high",
    retrieve_when: ["oauth", "token", "session", "auth", "login", "expiry"],
    stale_if_changed: ["src/auth/session.ts"],
    is_stale: false,
    created_at: "2026-05-08T14:42:11Z",
    generated_by: "CLōD",
    retrieved_count: 3,
  },
  {
    id: "mc_002",
    session_id: "session_001",
    type: "procedural",
    title: "Run regression suite after auth changes",
    content:
      "Always run `pnpm test:auth` and `pnpm test:e2e -- --grep oauth` after touching anything in src/auth. Catches the silent redirect-loop regression.",
    evidence: ["CI run #4123 caught redirect loop only via e2e suite"],
    source_files: [
      "src/auth/callback.ts",
      "tests/auth-callback.test.ts",
      "tests/e2e/oauth.spec.ts",
    ],
    confidence: "high",
    retrieve_when: ["auth", "oauth", "callback", "redirect"],
    stale_if_changed: ["package.json", "tests/e2e/oauth.spec.ts"],
    is_stale: false,
    created_at: "2026-05-08T14:42:14Z",
    generated_by: "CLōD",
    retrieved_count: 5,
  },
  {
    id: "mc_003",
    session_id: "session_002",
    type: "semantic",
    title: "useUser() must be called inside <SessionProvider>",
    content:
      "The hook reads from React context; calling it at the layout root will return null until SessionProvider is mounted. Wrap routes accordingly.",
    evidence: [
      "components/Providers.tsx mounts <SessionProvider>",
      "PR #821 introduced this constraint",
    ],
    source_files: [
      "src/components/Providers.tsx",
      "src/hooks/useUser.ts",
    ],
    confidence: "medium",
    retrieve_when: ["useUser", "session", "context", "provider"],
    stale_if_changed: ["src/hooks/useUser.ts", "src/components/Providers.tsx"],
    is_stale: true,
    created_at: "2026-05-04T09:14:51Z",
    generated_by: "CLōD",
    retrieved_count: 2,
  },
  {
    id: "mc_004",
    session_id: "session_003",
    type: "episodic",
    title: "Race condition: writes to /api/cart need optimistic lock",
    content:
      "Two parallel addToCart() calls overwrite each other. Use the version field returned by GET /cart and pass it in the PATCH body, or the server returns 409.",
    evidence: ["server logs cart-svc/2026-05-02 14:12 → 200 200, last-write-wins"],
    source_files: ["src/api/cart.ts", "server/handlers/cart.ts"],
    confidence: "high",
    retrieve_when: ["cart", "race", "concurrency", "patch", "api"],
    stale_if_changed: ["server/handlers/cart.ts"],
    is_stale: false,
    created_at: "2026-05-02T16:01:00Z",
    generated_by: "CLōD",
    retrieved_count: 7,
  },
  {
    id: "mc_005",
    session_id: "session_003",
    type: "risk",
    title: "Greptile flagged: Cart mutations bypass audit log",
    content:
      "The new optimistic-lock path skips writeAudit() that every other PATCH on /api/* uses. Add audit call before returning.",
    evidence: [
      "Greptile diff review on PR #1042 — convention violation",
      "server/middleware/audit.ts wraps writeAudit on all /api/* mutations",
    ],
    source_files: ["server/handlers/cart.ts", "server/middleware/audit.ts"],
    confidence: "medium",
    retrieve_when: ["cart", "audit", "mutation", "api"],
    stale_if_changed: ["server/handlers/cart.ts"],
    is_stale: false,
    created_at: "2026-05-02T16:01:14Z",
    generated_by: "Greptile",
    retrieved_count: 1,
  },
  {
    id: "mc_006",
    session_id: "session_004",
    type: "semantic",
    title: "Feature flag `pricing_v2` gates the entire checkout flow",
    content:
      "Even though /checkout looks like the live route, anything inside <PricingV2Gate> falls back to legacy when the flag is off. Toggle in src/flags.ts.",
    evidence: ["src/flags.ts pricing_v2 default: false"],
    source_files: ["src/flags.ts", "src/checkout/PricingV2Gate.tsx"],
    confidence: "high",
    retrieve_when: ["checkout", "pricing", "feature flag", "v2"],
    stale_if_changed: ["src/flags.ts"],
    is_stale: false,
    created_at: "2026-04-29T11:30:42Z",
    generated_by: "Nia",
    retrieved_count: 4,
  },
  {
    id: "mc_007",
    session_id: "session_005",
    type: "procedural",
    title: "Migration order matters: run `db:reset` before `seed:demo`",
    content:
      "seed:demo expects fresh schema. Skipping db:reset will leave orphaned rows that break the demo OAuth flow.",
    evidence: ["scripts/seed-demo.ts:14 throws on conflict"],
    source_files: ["scripts/seed-demo.ts", "prisma/schema.prisma"],
    confidence: "high",
    retrieve_when: ["seed", "demo", "migration", "db:reset"],
    stale_if_changed: ["prisma/schema.prisma", "scripts/seed-demo.ts"],
    is_stale: false,
    created_at: "2026-04-21T19:18:00Z",
    generated_by: "CLōD",
    retrieved_count: 2,
  },
];

/* --------------------------------- Sessions --------------------------------- */

const oauthDiff: DiffHunk[] = [
  {
    file: "src/auth/callback.ts",
    header: "@@ -18,8 +18,14 @@ export async function handleCallback(req, res)",
    lines: [
      { type: "ctx", text: "  const code = req.query.code;", n: 18 },
      { type: "ctx", text: "  if (!code) return res.status(400).end();", n: 19 },
      { type: "ctx", text: "", n: 20 },
      { type: "rem", text: "  const session = await readSession(req);", n: 21 },
      { type: "rem", text: "  const expiry = readDocs('oauth.md').expiry;" },
      { type: "rem", text: "  if (Date.now() > session.issuedAt + expiry) {" },
      { type: "rem", text: "    return res.redirect('/login');" },
      { type: "rem", text: "  }" },
      { type: "add", text: "  const session = await readSession(req);", n: 21 },
      { type: "add", text: "  const ttl = SESSION_TTL_MS; // <- enforced here, not in docs" },
      { type: "add", text: "  if (Date.now() > session.issuedAt + ttl) {" },
      { type: "add", text: "    log.warn('oauth_session_expired', { id: session.id });" },
      { type: "add", text: "    return res.redirect('/login?reason=expired');" },
      { type: "add", text: "  }" },
      { type: "ctx", text: "" },
      { type: "ctx", text: "  await exchangeToken(code);" },
    ],
  },
  {
    file: "tests/auth-callback.test.ts",
    header: "@@ -42,6 +42,18 @@ describe('oauth callback', () => {",
    lines: [
      { type: "ctx", text: "    expect(res.statusCode).toBe(302);", n: 42 },
      { type: "ctx", text: "  });", n: 43 },
      { type: "add", text: "" },
      { type: "add", text: "  it('redirects to /login when session is older than SESSION_TTL_MS', async () => {" },
      { type: "add", text: "    vi.setSystemTime(new Date('2026-05-08T15:00:00Z'));" },
      { type: "add", text: "    const res = await request(app).get('/auth/callback?code=ok');" },
      { type: "add", text: "    expect(res.headers.location).toContain('/login?reason=expired');" },
      { type: "add", text: "  });" },
      { type: "ctx", text: "});" },
    ],
  },
];

const cartDiff: DiffHunk[] = [
  {
    file: "src/api/cart.ts",
    header: "@@ -12,7 +12,11 @@ export async function addToCart(item)",
    lines: [
      { type: "rem", text: "  const cart = await GET('/cart');" },
      { type: "rem", text: "  cart.items.push(item);" },
      { type: "rem", text: "  return PATCH('/cart', { items: cart.items });" },
      { type: "add", text: "  const cart = await GET('/cart');" },
      { type: "add", text: "  return PATCH('/cart', {" },
      { type: "add", text: "    items: [...cart.items, item]," },
      { type: "add", text: "    version: cart.version, // <-- optimistic lock" },
      { type: "add", text: "  });" },
    ],
  },
];

const pricingDiff: DiffHunk[] = [
  {
    file: "src/checkout/Summary.tsx",
    header: "@@ -1,5 +1,12 @@",
    lines: [
      { type: "rem", text: "import { calculateTotal } from './total';" },
      { type: "add", text: "import { calculateTotal } from './total';" },
      { type: "add", text: "import { PricingV2Gate } from './PricingV2Gate';" },
      { type: "ctx", text: "" },
      { type: "ctx", text: "export function Summary({ items }) {" },
      { type: "rem", text: "  return <div className='summary'>{calculateTotal(items)}</div>;" },
      { type: "add", text: "  return (" },
      { type: "add", text: "    <PricingV2Gate fallback={<LegacySummary items={items} />}>" },
      { type: "add", text: "      <div className='summary'>{calculateTotal(items)}</div>" },
      { type: "add", text: "    </PricingV2Gate>" },
      { type: "add", text: "  );" },
      { type: "ctx", text: "}" },
    ],
  },
];

export const sessions: Session[] = [
  {
    id: "session_001",
    task: "Fix OAuth redirect bug",
    description:
      "Users are getting kicked back to /login after sign-in completes. Reproduced on staging at 14:02 UTC, intermittent.",
    status: "success",
    started_at: "2026-05-08T14:02:00Z",
    finished_at: "2026-05-08T14:42:11Z",
    duration_ms: 40 * 60 * 1000 + 11_000,
    base_commit: "a3f12c9",
    end_commit: "9d7e2b1",
    branch: "fix/oauth-redirect",
    agent: {
      name: "Cursor Agent",
      model: "claude-opus-4.7",
      avatar: "C",
    },
    repo: "monorepo/web",
    changed_files: [
      { path: "src/auth/callback.ts", added: 9, removed: 5, language: "ts", status: "modified" },
      { path: "src/auth/session.ts", added: 3, removed: 0, language: "ts", status: "modified" },
      { path: "tests/auth-callback.test.ts", added: 12, removed: 0, language: "ts", status: "modified" },
      { path: "docs/oauth.md", added: 0, removed: 4, language: "md", status: "modified" },
    ],
    diff: oauthDiff,
    commands: [
      { command: "pnpm test:auth", output: "PASS  src/auth/callback.test.ts (4 tests)", exit_code: 0, duration_ms: 4200 },
      { command: "pnpm test:e2e -- --grep oauth", output: "1 passed, 0 failed", exit_code: 0, duration_ms: 22_180 },
    ],
    timeline: [
      { id: "t1", ts: "14:02:00", kind: "session_start", title: "Session started", detail: "Snapshot taken at a3f12c9", tone: "info" },
      { id: "t2", ts: "14:02:14", kind: "agent_message", title: "Agent reads docs/oauth.md", detail: "Assumption: token expiry comes from docs.", tone: "neutral" },
      { id: "t3", ts: "14:08:42", kind: "file_edit", title: "Edited src/auth/callback.ts", detail: "+9 / -5 lines", tone: "neutral", meta: { file: "src/auth/callback.ts" } },
      { id: "t4", ts: "14:11:03", kind: "command", title: "pnpm test:auth", detail: "FAIL — TokenExpiredError after 1h", tone: "bad" },
      { id: "t5", ts: "14:11:09", kind: "assumption", title: "Assumption corrected", detail: "Expiry is enforced in code (session.ts), not docs.", tone: "warn" },
      { id: "t6", ts: "14:21:48", kind: "file_edit", title: "Edited src/auth/session.ts", detail: "+3 / -0 lines", tone: "neutral", meta: { file: "src/auth/session.ts" } },
      { id: "t7", ts: "14:24:55", kind: "file_edit", title: "Added regression test", detail: "tests/auth-callback.test.ts +12 lines", tone: "neutral" },
      { id: "t8", ts: "14:30:11", kind: "test_run", title: "All auth tests pass", detail: "4/4 unit, 1/1 e2e", tone: "good" },
      { id: "t9", ts: "14:42:00", kind: "memory_card", title: "2 memory cards generated", detail: "Generated by CLōD, retrievable via Nia.", tone: "info" },
      { id: "t10", ts: "14:42:11", kind: "session_end", title: "Session finished", detail: "+24 / -9 across 4 files", tone: "good" },
    ],
    assumptions: [
      {
        id: "a1",
        text: "Token expiry is configured in docs/oauth.md",
        source: "docs/oauth.md L42",
        status: "rejected",
        confidence: 0.4,
        evidence: ["Docs claim 24h", "No code references this value"],
      },
      {
        id: "a2",
        text: "Token TTL is enforced by SESSION_TTL_MS in src/auth/session.ts",
        source: "src/auth/session.ts L42",
        status: "validated",
        confidence: 0.97,
        evidence: ["Constant is referenced from callback.ts", "Regression test now passes"],
      },
    ],
    analysis: {
      rootCause: {
        title: "Documentation drifted from implementation",
        summary:
          "The agent trusted docs/oauth.md (24h TTL) but the code path enforces SESSION_TTL_MS = 1h. The fix wires callback.ts to the code-side constant and adds a regression test that pins behavior.",
        file: "src/auth/callback.ts",
        line: 26,
      },
      assumption: {
        incorrect: "Token expiry value lives in docs/oauth.md and is the source of truth.",
        actual:
          "Token expiry is enforced by SESSION_TTL_MS inside src/auth/session.ts and ignored everywhere else.",
      },
      sourceOfTruth: {
        file: "src/auth/session.ts",
        reason:
          "Constant referenced by both callback.ts and the e2e test; docs have not been updated since PR #612.",
      },
      confidence: {
        score: 0.92,
        validatedByTests: true,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.95 },
          { label: "Diff scope is small", score: 0.9 },
          { label: "Greptile risk score", score: 0.88 },
          { label: "Source-of-truth located", score: 0.97 },
        ],
      },
      futureWarning:
        "Do NOT trust docs/oauth.md for runtime behavior — treat src/auth/session.ts as canonical until docs are rewritten.",
      reviewedBy: ["CLōD", "Greptile", "Nia"],
    },
    memory_cards: ["mc_001", "mc_002"],
    tokens: { input: 18_412, output: 6_120 },
    cost_usd: 0.34,
    test_summary: { passed: 28, failed: 0, skipped: 1 },
  },
  {
    id: "session_002",
    task: "Add user avatars to comment threads",
    description:
      "Designer requested avatars beside each comment. Should respect existing rounded-full pattern and lazy-load images.",
    status: "partial",
    started_at: "2026-05-04T09:00:11Z",
    finished_at: "2026-05-04T09:42:08Z",
    duration_ms: 41 * 60 * 1000,
    base_commit: "5b21aa0",
    end_commit: "f0c1233",
    branch: "feat/comment-avatars",
    agent: { name: "Cursor Agent", model: "claude-sonnet-4.5", avatar: "C" },
    repo: "monorepo/web",
    changed_files: [
      { path: "src/components/CommentList.tsx", added: 14, removed: 2, language: "tsx", status: "modified" },
      { path: "src/components/Avatar.tsx", added: 22, removed: 0, language: "tsx", status: "added" },
      { path: "src/hooks/useUser.ts", added: 2, removed: 1, language: "ts", status: "modified" },
    ],
    diff: [
      {
        file: "src/components/CommentList.tsx",
        header: "@@ -1,4 +1,5 @@",
        lines: [
          { type: "add", text: "import { Avatar } from './Avatar';" },
          { type: "ctx", text: "import { useUser } from '../hooks/useUser';" },
          { type: "ctx", text: "" },
          { type: "ctx", text: "export function CommentList({ comments }) {" },
        ],
      },
    ],
    commands: [
      { command: "pnpm test", output: "21 passed, 1 failed (useUser → null)", exit_code: 1, duration_ms: 8400 },
    ],
    timeline: [
      { id: "t1", ts: "09:00:11", kind: "session_start", title: "Session started", tone: "info" },
      { id: "t2", ts: "09:04:00", kind: "file_edit", title: "Created Avatar component", tone: "neutral" },
      { id: "t3", ts: "09:21:00", kind: "command", title: "pnpm test", detail: "1 failure: useUser returns null", tone: "bad" },
      { id: "t4", ts: "09:38:00", kind: "assumption", title: "Assumption noted", detail: "useUser likely needs SessionProvider wrap", tone: "warn" },
      { id: "t5", ts: "09:42:08", kind: "session_end", title: "Session finished", detail: "Tests still failing — handed back to dev", tone: "warn" },
    ],
    assumptions: [
      {
        id: "a1",
        text: "useUser() can be called from any component",
        source: "auto-import",
        status: "rejected",
        confidence: 0.3,
        evidence: ["Returns null at layout root"],
      },
    ],
    analysis: {
      rootCause: {
        title: "useUser() called outside <SessionProvider>",
        summary:
          "Avatar component pulled `useUser()` at the top of CommentList, but CommentList renders before <SessionProvider> mounts in tests.",
        file: "src/components/CommentList.tsx",
        line: 4,
      },
      assumption: {
        incorrect: "useUser is globally available.",
        actual: "useUser reads from React context and requires <SessionProvider> ancestor.",
      },
      sourceOfTruth: {
        file: "src/hooks/useUser.ts",
        reason: "Hook explicitly throws when context is missing in dev; suppressed in prod.",
      },
      confidence: {
        score: 0.61,
        validatedByTests: false,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.4 },
          { label: "Diff scope is small", score: 0.85 },
          { label: "Greptile risk score", score: 0.6 },
          { label: "Source-of-truth located", score: 0.6 },
        ],
      },
      futureWarning:
        "Wrap test renderers in <SessionProvider>. Consider adding a lint rule that requires ancestor provider for context-bound hooks.",
      reviewedBy: ["CLōD", "Nia"],
    },
    memory_cards: ["mc_003"],
    tokens: { input: 9_800, output: 3_120 },
    cost_usd: 0.18,
    test_summary: { passed: 21, failed: 1, skipped: 0 },
  },
  {
    id: "session_003",
    task: "Cart race condition: concurrent addToCart overwrites",
    description:
      "Two parallel addToCart() calls cause one of the items to disappear. Need optimistic locking on the PATCH.",
    status: "success",
    started_at: "2026-05-02T15:21:00Z",
    finished_at: "2026-05-02T16:01:14Z",
    duration_ms: 40 * 60 * 1000 + 14_000,
    base_commit: "11ab33c",
    end_commit: "abcd9f1",
    branch: "fix/cart-race",
    agent: { name: "Cursor Agent", model: "gpt-5", avatar: "C" },
    repo: "monorepo/api",
    changed_files: [
      { path: "src/api/cart.ts", added: 5, removed: 3, language: "ts", status: "modified" },
      { path: "server/handlers/cart.ts", added: 17, removed: 4, language: "ts", status: "modified" },
      { path: "tests/cart-race.test.ts", added: 32, removed: 0, language: "ts", status: "added" },
    ],
    diff: cartDiff,
    commands: [
      { command: "pnpm test cart", output: "PASS  3 tests including race regression", exit_code: 0, duration_ms: 5_700 },
    ],
    timeline: [
      { id: "t1", ts: "15:21:00", kind: "session_start", title: "Session started", tone: "info" },
      { id: "t2", ts: "15:24:00", kind: "tool_call", title: "Greptile.review(diff)", detail: "Risk: missing audit log call", tone: "warn" },
      { id: "t3", ts: "15:33:00", kind: "file_edit", title: "Added optimistic version", tone: "neutral" },
      { id: "t4", ts: "15:50:00", kind: "test_run", title: "Race regression added", detail: "Reproduces and now passes", tone: "good" },
      { id: "t5", ts: "16:01:14", kind: "session_end", title: "Session finished", tone: "good" },
    ],
    assumptions: [
      { id: "a1", text: "PATCH /cart is idempotent", source: "n/a", status: "rejected", confidence: 0.5, evidence: ["Last-write-wins observed"] },
      { id: "a2", text: "Server supports optimistic version field", source: "Greptile review", status: "validated", confidence: 0.9, evidence: ["server/handlers/cart.ts inspects version"] },
    ],
    analysis: {
      rootCause: {
        title: "Last-write-wins on /cart PATCH",
        summary:
          "The cart endpoint accepted any items array without checking version, so the slower client overwrote the faster client. Adding an optimistic version field forces 409 on conflict.",
        file: "server/handlers/cart.ts",
        line: 88,
      },
      assumption: {
        incorrect: "PATCH /cart serializes concurrent writes.",
        actual: "It accepted any array; concurrent writes silently lost data.",
      },
      sourceOfTruth: {
        file: "server/handlers/cart.ts",
        reason: "Server is canonical for concurrency semantics; client must follow.",
      },
      confidence: {
        score: 0.88,
        validatedByTests: true,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.95 },
          { label: "Diff scope is small", score: 0.7 },
          { label: "Greptile risk score", score: 0.85 },
          { label: "Source-of-truth located", score: 0.95 },
        ],
      },
      futureWarning:
        "Greptile flagged that addToCart bypasses writeAudit. Future agents must keep writeAudit() in any /api/* mutation.",
      reviewedBy: ["CLōD", "Greptile"],
    },
    memory_cards: ["mc_004", "mc_005"],
    tokens: { input: 22_300, output: 8_140 },
    cost_usd: 0.41,
    test_summary: { passed: 14, failed: 0, skipped: 0 },
  },
  {
    id: "session_004",
    task: "Wire pricing v2 into checkout summary",
    description:
      "Roll out the new pricing engine behind the existing flag. Legacy path must still render when the flag is off.",
    status: "success",
    started_at: "2026-04-29T11:01:00Z",
    finished_at: "2026-04-29T11:30:42Z",
    duration_ms: 29 * 60 * 1000 + 42_000,
    base_commit: "8821bc0",
    end_commit: "ee01233",
    branch: "feat/pricing-v2-checkout",
    agent: { name: "Cursor Agent", model: "claude-opus-4.7", avatar: "C" },
    repo: "monorepo/web",
    changed_files: [
      { path: "src/checkout/Summary.tsx", added: 8, removed: 1, language: "tsx", status: "modified" },
      { path: "src/checkout/PricingV2Gate.tsx", added: 18, removed: 0, language: "tsx", status: "added" },
      { path: "tests/checkout-summary.test.tsx", added: 14, removed: 0, language: "tsx", status: "modified" },
    ],
    diff: pricingDiff,
    commands: [
      { command: "pnpm test checkout", output: "PASS 9 tests", exit_code: 0, duration_ms: 6_100 },
    ],
    timeline: [
      { id: "t1", ts: "11:01:00", kind: "session_start", title: "Session started", tone: "info" },
      { id: "t2", ts: "11:05:00", kind: "tool_call", title: "Nia.search('feature flag pricing v2')", detail: "Returned src/flags.ts as canonical", tone: "info" },
      { id: "t3", ts: "11:18:00", kind: "file_edit", title: "Wrapped Summary in PricingV2Gate", tone: "neutral" },
      { id: "t4", ts: "11:28:00", kind: "test_run", title: "Tests pass on / off flag", tone: "good" },
      { id: "t5", ts: "11:30:42", kind: "session_end", title: "Session finished", tone: "good" },
    ],
    assumptions: [
      { id: "a1", text: "Pricing v2 is opt-in via src/flags.ts", source: "Nia retrieval", status: "validated", confidence: 0.92, evidence: ["src/flags.ts exposes pricing_v2"] },
    ],
    analysis: {
      rootCause: {
        title: "Feature gating wired correctly",
        summary:
          "Summary now defers to PricingV2Gate which inspects the flag and falls back to LegacySummary. No regressions on either branch of the flag.",
        file: "src/checkout/Summary.tsx",
        line: 9,
      },
      assumption: {
        incorrect: "n/a — assumption was validated up front via Nia retrieval",
        actual: "Pricing v2 is opt-in via src/flags.ts pricing_v2.",
      },
      sourceOfTruth: { file: "src/flags.ts", reason: "Single registry of feature flags." },
      confidence: {
        score: 0.95,
        validatedByTests: true,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.95 },
          { label: "Diff scope is small", score: 0.97 },
          { label: "Greptile risk score", score: 0.9 },
          { label: "Source-of-truth located", score: 0.98 },
        ],
      },
      futureWarning: "Don't ship pricing_v2 to staging without QA on the legacy path.",
      reviewedBy: ["CLōD", "Nia"],
    },
    memory_cards: ["mc_006"],
    tokens: { input: 14_120, output: 4_980 },
    cost_usd: 0.27,
    test_summary: { passed: 9, failed: 0, skipped: 0 },
  },
  {
    id: "session_005",
    task: "Set up demo seed data for OAuth flow",
    description: "Need deterministic users + tokens so the demo OAuth flow renders the same screen every time.",
    status: "success",
    started_at: "2026-04-21T18:46:00Z",
    finished_at: "2026-04-21T19:18:00Z",
    duration_ms: 32 * 60 * 1000,
    base_commit: "0011ccd",
    end_commit: "44ee012",
    branch: "demo/oauth-seed",
    agent: { name: "Cursor Agent", model: "claude-sonnet-4.5", avatar: "C" },
    repo: "monorepo/api",
    changed_files: [
      { path: "scripts/seed-demo.ts", added: 26, removed: 4, language: "ts", status: "modified" },
      { path: "prisma/schema.prisma", added: 2, removed: 0, language: "prisma", status: "modified" },
    ],
    diff: [
      {
        file: "scripts/seed-demo.ts",
        header: "@@ -1,12 +1,28 @@",
        lines: [
          { type: "add", text: "// Run after `pnpm db:reset` — relies on empty schema." },
          { type: "ctx", text: "import { PrismaClient } from '@prisma/client';" },
          { type: "ctx", text: "" },
          { type: "ctx", text: "const db = new PrismaClient();" },
          { type: "add", text: "const DEMO_USERS = [" },
          { type: "add", text: "  { id: 'u_alice', email: 'alice@blackbox.dev' }," },
          { type: "add", text: "  { id: 'u_bob',   email: 'bob@blackbox.dev'   }," },
          { type: "add", text: "];" },
        ],
      },
    ],
    commands: [
      { command: "pnpm db:reset && pnpm seed:demo", output: "seeded 2 users, 2 oauth tokens", exit_code: 0, duration_ms: 3_400 },
    ],
    timeline: [
      { id: "t1", ts: "18:46:00", kind: "session_start", title: "Session started", tone: "info" },
      { id: "t2", ts: "18:55:00", kind: "command", title: "pnpm seed:demo", detail: "FAIL — orphaned rows", tone: "bad" },
      { id: "t3", ts: "18:56:00", kind: "assumption", title: "Assumption corrected", detail: "Must run db:reset first", tone: "warn" },
      { id: "t4", ts: "19:11:00", kind: "command", title: "pnpm db:reset && pnpm seed:demo", detail: "Seeded 2 users", tone: "good" },
      { id: "t5", ts: "19:18:00", kind: "session_end", title: "Session finished", tone: "good" },
    ],
    assumptions: [
      { id: "a1", text: "seed:demo can run on existing schema", source: "n/a", status: "rejected", confidence: 0.5, evidence: ["Throws on conflict"] },
    ],
    analysis: {
      rootCause: {
        title: "seed:demo requires fresh schema",
        summary: "scripts/seed-demo.ts assumes an empty database. Without db:reset, conflicting rows make it throw.",
        file: "scripts/seed-demo.ts",
        line: 14,
      },
      assumption: {
        incorrect: "Seeding is idempotent.",
        actual: "Seeding is destructive — must run after db:reset.",
      },
      sourceOfTruth: { file: "scripts/seed-demo.ts", reason: "Throws explicitly on conflict; no other docs describe behavior." },
      confidence: {
        score: 0.9,
        validatedByTests: true,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.85 },
          { label: "Diff scope is small", score: 0.95 },
          { label: "Greptile risk score", score: 0.85 },
          { label: "Source-of-truth located", score: 0.95 },
        ],
      },
      futureWarning: "Always document seeding pre-conditions in scripts/README.md.",
      reviewedBy: ["CLōD"],
    },
    memory_cards: ["mc_007"],
    tokens: { input: 6_700, output: 2_100 },
    cost_usd: 0.11,
    test_summary: { passed: 4, failed: 0, skipped: 0 },
  },
  {
    id: "session_006",
    task: "Reproduce flaky payment webhook test",
    description: "CI shows pay-webhook.test.ts flakes ~1 in 10 runs. Need a deterministic repro before fixing.",
    status: "running",
    started_at: "2026-05-09T20:48:00Z",
    finished_at: "2026-05-09T20:48:00Z",
    duration_ms: 120_000,
    base_commit: "deadbeef",
    end_commit: "deadbeef",
    branch: "debug/pay-webhook-flake",
    agent: { name: "Cursor Agent", model: "claude-opus-4.7", avatar: "C" },
    repo: "monorepo/api",
    changed_files: [
      { path: "tests/pay-webhook.test.ts", added: 0, removed: 0, language: "ts", status: "modified" },
    ],
    diff: [],
    commands: [
      { command: "for i in $(seq 1 50); do pnpm test pay-webhook; done", output: "running iter 12/50…", exit_code: -1, duration_ms: 0 },
    ],
    timeline: [
      { id: "t1", ts: "20:48:00", kind: "session_start", title: "Session started", tone: "info" },
      { id: "t2", ts: "20:48:30", kind: "command", title: "Running 50x", detail: "Looking for the flake", tone: "info" },
    ],
    assumptions: [
      { id: "a1", text: "Flake is timing-related", source: "guess", status: "initial", confidence: 0.5, evidence: [] },
    ],
    analysis: {
      rootCause: { title: "Investigation in progress", summary: "Reproducing the flake before any fix is committed." },
      assumption: {
        incorrect: "(unknown)",
        actual: "(unknown)",
      },
      sourceOfTruth: { file: "tests/pay-webhook.test.ts", reason: "Awaiting reproduction." },
      confidence: {
        score: 0.2,
        validatedByTests: false,
        breakdown: [
          { label: "Tests cover failure mode", score: 0.2 },
          { label: "Diff scope is small", score: 0.5 },
          { label: "Greptile risk score", score: 0.3 },
          { label: "Source-of-truth located", score: 0.2 },
        ],
      },
      futureWarning: "Don't merge a fix until the flake is reproduced deterministically.",
      reviewedBy: ["Greptile"],
    },
    memory_cards: [],
    tokens: { input: 1_200, output: 320 },
    cost_usd: 0.02,
    test_summary: { passed: 0, failed: 0, skipped: 0 },
  },
];

export const assumptionShifts: AssumptionShift[] = [
  {
    id: "shift_001",
    topic: "OAuth token expiry",
    initial: { assumption: "Token expiry defined in docs/oauth.md (24h)", source: "docs/oauth.md L42" },
    corrected: { assumption: "Token expiry enforced by SESSION_TTL_MS = 1h in src/auth/session.ts", source: "src/auth/session.ts L42" },
    trigger: "Failed auth regression tests",
    detected_in_session: "session_001",
  },
  {
    id: "shift_002",
    topic: "useUser scope",
    initial: { assumption: "useUser() can be called anywhere in the tree.", source: "auto-import" },
    corrected: { assumption: "useUser() requires <SessionProvider> ancestor.", source: "src/hooks/useUser.ts" },
    trigger: "Unit test returned null user",
    detected_in_session: "session_002",
  },
  {
    id: "shift_003",
    topic: "Cart write semantics",
    initial: { assumption: "PATCH /cart serializes concurrent writes server-side.", source: "implicit" },
    corrected: { assumption: "Client must send a `version` for optimistic locking.", source: "server/handlers/cart.ts" },
    trigger: "Greptile diff review + race regression",
    detected_in_session: "session_003",
  },
  {
    id: "shift_004",
    topic: "Demo seeding pre-conditions",
    initial: { assumption: "seed:demo is idempotent.", source: "n/a" },
    corrected: { assumption: "seed:demo requires `pnpm db:reset` first.", source: "scripts/seed-demo.ts" },
    trigger: "Conflict on second run",
    detected_in_session: "session_005",
  },
];

export const cliCommands = [
  {
    cmd: "blackbox start \"Fix OAuth redirect bug\"",
    desc: "Start a recording. Captures base commit, branch, and a snapshot of the working tree.",
    output: [
      "✓ Snapshot saved at a3f12c9",
      "✓ Session session_001 started",
      "  → run your agent in Cursor as usual…",
    ],
  },
  {
    cmd: "blackbox finish",
    desc: "End the recording. Stores the diff, commands run, and triggers memory generation.",
    output: [
      "✓ Captured 24/-9 across 4 files",
      "✓ Sent diff to Greptile for review",
      "✓ CLōD generated 2 memory cards",
      "✓ Nia indexed cards for retrieval",
      "✓ Open dashboard → http://localhost:5173/sessions/session_001",
    ],
  },
  {
    cmd: "blackbox context \"add comment avatars\"",
    desc: "Retrieve relevant non-stale memory cards for a new task before you start.",
    output: [
      "Retrieved 2 cards for \"add comment avatars\":",
      "  • [semantic] useUser() must be called inside <SessionProvider>",
      "  • [risk]      useUser ⚠ marked stale — re-verify",
      "→ Paste this into your agent context to avoid known traps.",
    ],
  },
  {
    cmd: "blackbox stale-check",
    desc: "Re-hashes source files and marks any memory whose stale_if_changed file moved.",
    output: [
      "Checked 7 cards.",
      "  • mc_003 → STALE (src/hooks/useUser.ts changed)",
      "  • all others → fresh",
    ],
  },
  {
    cmd: "blackbox dashboard",
    desc: "Open the local web UI to replay sessions, browse memories, and review root causes.",
    output: ["▶ open http://localhost:5173"],
  },
];

/* --------------------------------- Helpers --------------------------------- */

export function getSession(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export function getMemoryCard(id: string): MemoryCard | undefined {
  return memoryCards.find((m) => m.id === id);
}

export function statusMeta(status: SessionStatus): {
  label: string;
  dot: string;
  text: string;
  bg: string;
} {
  switch (status) {
    case "success":
      return {
        label: "Resolved",
        dot: "bg-[color:var(--color-success)]",
        text: "text-[color:var(--color-success)]",
        bg: "bg-[color:var(--color-success)]/10",
      };
    case "failed":
      return {
        label: "Failed",
        dot: "bg-[color:var(--color-danger)]",
        text: "text-[color:var(--color-danger)]",
        bg: "bg-[color:var(--color-danger)]/10",
      };
    case "partial":
      return {
        label: "Partial",
        dot: "bg-[color:var(--color-warn)]",
        text: "text-[color:var(--color-warn)]",
        bg: "bg-[color:var(--color-warn)]/10",
      };
    case "running":
      return {
        label: "Running",
        dot: "bg-[color:var(--color-electric)]",
        text: "text-[color:var(--color-electric)]",
        bg: "bg-[color:var(--color-electric)]/10",
      };
  }
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}
