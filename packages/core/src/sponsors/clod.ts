import Anthropic from "@anthropic-ai/sdk";
import { EvidenceBundle, Claim, MemoryCard } from "../types";

// CLōD sponsor integration — primary memory card generator and session summarizer
// Uses Claude as the underlying model (CLōD wraps it)

const client = new Anthropic({
  apiKey: process.env.CLOD_API_KEY ?? process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.CLOD_BASE_URL, // CLōD endpoint; falls back to Anthropic if unset
});

const MODEL = process.env.CLOD_MODEL ?? "claude-sonnet-4-6";

export async function summarizeWithClod(bundle: EvidenceBundle): Promise<string> {
  const prompt = `You are analyzing a software development session. Summarize what happened concisely in 2-3 sentences.

Task: ${bundle.task}
Changed files: ${bundle.changedFiles.join(", ")}
Commands run: ${bundle.commands.map((c) => `${c.command} (exit ${c.exitCode})`).join(", ")}
Agent trace excerpt: ${bundle.agentTrace.slice(0, 500)}
Diff excerpt: ${bundle.diff.slice(0, 1000)}

Respond with only the summary text.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  return (message.content[0] as { type: "text"; text: string }).text.trim();
}

export async function inferHypothesesWithClod(bundle: EvidenceBundle): Promise<string[]> {
  const prompt = `You are analyzing a software development session to identify non-obvious inferences.

Task: ${bundle.task}
Changed files: ${bundle.changedFiles.join(", ")}
Failed commands: ${bundle.commands.filter((c) => c.exitCode !== 0).map((c) => `"${c.command}": ${c.output.slice(0, 200)}`).join("\n")}
Agent trace: ${bundle.agentTrace.slice(0, 800)}
Diff: ${bundle.diff.slice(0, 1500)}

List up to 3 inferred hypotheses about root causes or patterns. Each on its own line, no bullet points.
Only include hypotheses with at least medium confidence. Respond with an empty response if none.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: "text"; text: string }).text.trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).slice(0, 3);
}

export async function generateMemoryCardsWithClod(
  bundle: EvidenceBundle,
  claims: Claim[],
  summary: string
): Promise<MemoryCard[]> {
  const prompt = `You are generating memory cards from a software development session. Each card should capture a reusable insight.

Session summary: ${summary}
Task: ${bundle.task}
Changed files: ${bundle.changedFiles.join(", ")}
Claims:
${claims.map((c) => `- [${c.kind}] ${c.text}`).join("\n")}

Generate 1-5 memory cards as a JSON array. Each card must follow this exact schema:
{
  "type": "episodic" | "semantic" | "procedural" | "risk",
  "claimType": "observed" | "agent_reported" | "inferred",
  "content": "string — the memory",
  "evidence": ["string"],
  "sourceFiles": ["string — file paths from the session"],
  "confidence": "low" | "medium" | "high",
  "retrieveWhen": ["keyword strings"],
  "staleIfChanged": ["file paths that would invalidate this memory"]
}

Respond with only the JSON array.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: "text"; text: string }).text.trim();

  let parsed: Omit<MemoryCard, "id" | "sessionId" | "isStale" | "createdAt">[];
  try {
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]") + 1;
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd));
  } catch {
    return [];
  }

  return parsed.map((card, i) => ({
    ...card,
    id: `memory_${bundle.sessionId}_${i}`,
    sessionId: bundle.sessionId,
    isStale: false,
    createdAt: new Date().toISOString(),
  }));
}
