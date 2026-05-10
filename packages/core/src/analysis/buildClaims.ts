import { Claim, EvidenceBundle } from "../types";

export function buildObservedClaims(bundle: EvidenceBundle): Claim[] {
  const claims: Claim[] = [];

  if (bundle.changedFiles.length > 0) {
    claims.push({
      id: `claim_observed_${Date.now()}_files`,
      kind: "observed",
      text: `The session changed: ${bundle.changedFiles.join(", ")}.`,
      confidence: "high",
      evidence: ["git diff --name-only"],
    });
  }

  const failedCommands = bundle.commands.filter((c) => c.exitCode !== 0);
  for (const cmd of failedCommands) {
    claims.push({
      id: `claim_observed_${Date.now()}_${cmd.command.replace(/\s/g, "_")}`,
      kind: "observed",
      text: `Command "${cmd.command}" failed with exit code ${cmd.exitCode}.`,
      confidence: "high",
      evidence: [`command output: ${cmd.output.slice(0, 200)}`],
    });
  }

  return claims;
}

export function buildAgentReportedClaims(bundle: EvidenceBundle): Claim[] {
  if (!bundle.agentTrace) return [];

  return [
    {
      id: `claim_agent_${Date.now()}_trace`,
      kind: "agent_reported",
      text: "Agent trace was captured for this session.",
      confidence: "medium",
      evidence: [".blackbox/agent-trace.md"],
    },
  ];
}

export function buildInferredClaims(
  bundle: EvidenceBundle,
  llmInferences: string[]
): Claim[] {
  return llmInferences.map((text, i) => ({
    id: `claim_inferred_${Date.now()}_${i}`,
    kind: "inferred" as const,
    text,
    confidence: "medium" as const,
    evidence: ["llm analysis of diff and agent trace"],
  }));
}
