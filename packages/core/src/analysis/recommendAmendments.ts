import { ContractAmendment, EvidenceBundle } from "../types";

const RISKY_PATTERNS: { pattern: RegExp; rule: string; reason: string }[] = [
  {
    pattern: /prisma migrate/i,
    rule: "prisma-migrate",
    reason: "Database migrations should require explicit approval.",
  },
  {
    pattern: /rm -rf|rimraf/i,
    rule: "destructive-delete",
    reason: "Destructive file deletions should require explicit approval.",
  },
  {
    pattern: /git push --force/i,
    rule: "force-push",
    reason: "Force pushes to shared branches should require explicit approval.",
  },
  {
    pattern: /npm publish|yarn publish/i,
    rule: "publish",
    reason: "Publishing packages should require explicit approval.",
  },
];

export function recommendAmendments(bundle: EvidenceBundle): ContractAmendment[] {
  const amendments: ContractAmendment[] = [];

  for (const cmd of bundle.commands) {
    for (const { pattern, rule, reason } of RISKY_PATTERNS) {
      if (pattern.test(cmd.command)) {
        amendments.push({
          id: `amendment_${Date.now()}_${rule}`,
          sessionId: bundle.sessionId,
          filePath: ".witsmith/AGENT_WIT.yaml",
          diff: `+ ask:\n+   - pattern: "${cmd.command}"`,
          reason,
          evidence: [
            `command "${cmd.command}" ran during session`,
            `exit code: ${cmd.exitCode}`,
          ],
          status: "suggested",
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return amendments;
}
