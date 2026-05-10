export type ContractDecision = {
  decision: "allow" | "ask" | "block";
  reason?: string;
  ruleId?: string;
};

export type ContractEvent = {
  id: string;
  sessionId: string;
  command?: string;
  decision: "allow" | "ask" | "block";
  ruleId?: string;
  reason?: string;
  createdAt: string;
};

export type CommandLog = {
  command: string;
  output: string;
  exitCode: number;
  createdAt: string;
  contractDecision: ContractDecision;
};

export type SessionRecord = {
  id: string;
  task: string;
  repoPath: string;
  branch: string;
  baseCommit: string;
  startedAt: string;
  status: "active" | "finished";
};

export type EvidenceBundle = {
  sessionId: string;
  task: string;
  repoPath: string;
  branch: string;
  baseCommit: string;
  endCommit: string;
  startedAt: string;
  finishedAt: string;
  status: "finished";
  changedFiles: string[];
  diff: string;
  commands: CommandLog[];
  agentTrace: string;
  contractEvents: ContractEvent[];
};

export type Claim = {
  id: string;
  kind: "observed" | "agent_reported" | "inferred";
  text: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
};

export type MemoryCard = {
  id: string;
  sessionId: string;
  type: "episodic" | "semantic" | "procedural" | "risk";
  claimType: "observed" | "agent_reported" | "inferred";
  content: string;
  evidence: string[];
  sourceFiles: string[];
  confidence: "low" | "medium" | "high";
  retrieveWhen: string[];
  staleIfChanged: string[];
  isStale: boolean;
  createdAt: string;
};

export type ContractAmendment = {
  id: string;
  sessionId: string;
  filePath: string;
  diff: string;
  reason: string;
  evidence: string[];
  status: "suggested" | "applied" | "rejected";
  createdAt: string;
};

export type DebugReport = {
  sessionId: string;
  summary: string;
  observedFacts: Claim[];
  agentReportedClaims: Claim[];
  inferredHypotheses: Claim[];
  failureModes: string[];
  memoryCards: MemoryCard[];
  recommendedContractAmendments: ContractAmendment[];
};

export type SessionFile = {
  evidenceBundle: EvidenceBundle;
  report: DebugReport;
};

export type ContextRequest = {
  task: string;
  limit?: number;
};

export type ContextResult = {
  task: string;
  memories: MemoryCard[];
  contextBlock: string;
};

export type ContractCheckInput = {
  command: string;
  sessionId?: string;
  cwd: string;
};
