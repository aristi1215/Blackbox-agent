# Reliability in Safety-Critical Systems — and how to map it onto Witsmith

**Audience:** any agent walking into the Witsmith repo who needs to ground the
"contract → action → fail → recover → amend → contract" loop in five decades of
safety-engineering practice.

**Why this file exists:** the playbook commits Witsmith to a closed reliability
loop. That loop is not new — almost every safety-critical industry has shipped
a version of it. This document surveys the ones worth stealing from, and maps
them, line by line, onto Witsmith's architecture so a future agent can reach
for the right precedent instead of re-inventing it under demo pressure.

---

## 1. The universal pattern: proceed, recover, learn

Strip every safety-critical system down to its loop and you find the same
three phases in different vocabularies:

- **Proceed under guard.** A check happens before action. The check enforces a
  contract — a policy, an envelope, a precondition. If the check fails, the
  action does not happen, or it happens in a degraded mode that is itself part
  of the contract.
- **Recover when something slips.** When the check is wrong, or the
  environment surprises the system, a recovery path takes over. It is
  pre-designed, not improvised. The recovery is itself bounded by a contract
  ("you may roll back to checkpoint X, you may not call into Y").
- **Learn from the result.** What happened gets fed back into the contract.
  Sometimes the change is automatic (a circuit breaker re-closing, a budget
  resetting). Sometimes it is human-mediated (a postmortem producing action
  items). Either way, the next pass through the loop runs against an updated
  contract.

The shorthand for this in the academic literature is the **MAPE-K loop**:
**M**onitor → **A**nalyze → **P**lan → **E**xecute, all sharing a common
**K**nowledge base. IBM introduced it in 2003 in their autonomic-computing
manifesto, and it remains the canonical reference for self-adaptive systems.
Witsmith's loop is a MAPE-K loop with three opinionated choices baked in: the
Knowledge base is a YAML wit, the Analyze step is an LLM with a confidence
gate, and the Plan step writes itself back into Knowledge — the rare property
the playbook calls out as Witsmith's narrow novel slice.

The remainder of this document walks through each adjacent domain, names the
specific mechanisms each one uses, and points at the places those mechanisms
already do — or could — surface inside Witsmith.

---

## 2. Aviation and avionics — the gold standard

Civil aviation has the clearest reliability record in any safety-critical
domain, and it earned that record by codifying redundancy and traceability
into law. The relevant standard is RTCA **DO-178C** (and its European twin
EUROCAE ED-12C), under which the FAA and EASA certify airborne software.
Compliance is not optional — without it, the part does not fly.

The mechanisms aviation leans on are worth naming individually because each
one has a clean analogue in software:

- **Hazard analysis up front.** Before a single line of code is written,
  every plausible failure mode is enumerated and assigned a Design Assurance
  Level (DAL A through E). DAL determines how much verification rigor the
  software demands. The lesson for agents: the contract is written before the
  system runs, and its strictness scales with the blast radius of the action.
- **Hardware redundancy with diverse implementations.** Flight-critical
  computers are typically triple-redundant, and at the most paranoid tier the
  three implementations are written by different teams against the same spec
  ("dissimilar redundancy"). The intent is to prevent a single bug from
  crashing every replica simultaneously. The agent analogue: when a high-stakes
  decision is in flight, ask the same question two different ways and only
  proceed when both agree.
- **Fault detection, isolation, recovery (FDIR).** Avionics splits failure
  handling into three serialized stages. Detection notices the deviation,
  isolation contains the blast, recovery either fails over to a backup or
  brings the system to a known-safe state. This is the same shape as
  Witsmith's `wit_check` → `analyze_failure` → `apply_rollback`.
- **Fail-operational vs. fail-safe distinction.** Critical systems must keep
  flying through a fault (fail-operational); less critical systems may stop
  but must stop in a safe state (fail-safe). Witsmith's `allow / ask / deny`
  is, in effect, an applied version of this split: `deny` is fail-safe (refuse
  and surface), `ask` is fail-operational with a human in the loop.

The deep precedent here is not the certification paperwork — it is the
discipline of writing the failure modes down *first*. Witsmith's
`AGENT_WIT.yaml` is the same artifact as a hazard log, and the natural-language
rules in it serve the same purpose as DAL annotations: they tell the runtime
how seriously to take a class of action.

---

## 3. Spacecraft autonomy — FDIR for systems you cannot reach

Spacecraft sharpen the avionics pattern because there is no operator nearby.
NASA's work on **FDIR** — Fault Detection, Isolation, and Recovery — is the
direct ancestor of every modern self-healing pattern. The same three phases
appear, with two extensions worth importing:

- **Analytical redundancy through a model.** When mass and power budgets do
  not allow a triplicated sensor, a software model of the subsystem runs in
  parallel with the real one, and the residual between predicted and observed
  outputs is the fault detector. The agent analogue: dry-run preview. Before
  you let an action execute, predict its effect and surface the prediction.
  The diff between prediction and reality is the cheapest possible monitor.
- **Tiered recovery escalation.** A spacecraft does not jump from "all fine"
  to "safe mode." It escalates: try the local fix, then the subsystem fix,
  then put the bus in a low-power Sun-pointing safe mode and wait for ground
  contact. Each tier has a different recovery and a different blast radius.
  The agent analogue: `recover --last` should not always do a full revert.
  It should try the smallest safe undo first (re-run the failing command with
  one variable changed), escalate to the structural undo (revert the file
  edit), and only fall back to "stop and write a handoff" as the last tier.

The literature on spacecraft FDIR distinguishes model-based detection (you
know the physics) from data-driven detection (you have a lot of telemetry).
For agents, "model-based" is the YAML wit's pattern rules, "data-driven" is
the LLM's natural-language judgment. Witsmith already runs both — the
contribution future work could make is to take the two verdicts and treat
their *disagreement* as a first-class signal, the way spacecraft treat
residuals.

---

## 4. Automotive functional safety — risk-graded contracts

ISO 26262 governs road vehicles and inherits its bones from IEC 61508. Its
defining contribution is **ASIL** (Automotive Safety Integrity Level), a
four-grade risk classification (ASIL A through D, plus QM for non-safety
work) derived from three factors: severity of harm, exposure probability, and
controllability by the driver.

ASIL is interesting to Witsmith because it is the cleanest example in
industry of *graded* contracts. The same engineering organization, the same
codebase, the same toolchain — but different functions inside the car earn
different levels of scrutiny based on what they can break. An ASIL-D
function (steering, braking) gets formal methods, dual-channel hardware, and
exhaustive coverage. An ASIL-A function (seat memory) gets ordinary unit
tests.

Witsmith implicitly does this with its `allow / ask / deny` decision plus
confidence threshold. The opportunity is to make the grading explicit. A
future wit could carry per-rule severity ("this rule guards against data
loss" vs. "this rule guards against rate-limit breach") and let the runtime
apply different confidence thresholds to each. The headline rule — natural-
language denial of shell commands sourced from non-prompt files — would
correspond to ASIL-D scrutiny, and its confidence floor should be higher than
a routine `npm run` allow.

The other ISO-26262 import worth naming: **fault tolerance time interval**.
Cars distinguish between how fast a failure must be detected, how fast it
must be reacted to, and how long the system has before harm. Agents should
inherit this vocabulary. A prompt-injection attempted shell command has a
near-zero tolerance window; a slightly suboptimal commit message has one
measured in minutes.

---

## 5. Autonomic computing and MAPE-K — the theoretical core

If only one thing in this document is read, it should be MAPE-K. IBM's 2003
paper *The Vision of Autonomic Computing* (Kephart & Chess) argued that
software systems would soon become so complex that humans could no longer
manage them directly, and proposed the autonomic loop as the management
substrate.

The loop has four active stages and one passive substrate:

- **Monitor** collects sensor data and aggregates it into symptoms. In
  Witsmith terms, this is the source-tracking that records `source: RECENT_NOTES.md`
  on every action.
- **Analyze** turns symptoms into diagnoses. This is `wit_check` plus the
  confidence gate.
- **Plan** turns diagnoses into action sequences. This is `analyze_failure`
  emitting a structured `rollback_plan`.
- **Execute** carries out the plan. This is `apply_rollback`.
- **Knowledge** is the shared substrate that all four stages read and
  update. This is `AGENT_WIT.yaml` plus the replay log plus the cache.

IBM argued that fully autonomic systems exhibit four self-* properties:
**self-configuration**, **self-optimization**, **self-healing**, and
**self-protection**. Witsmith targets the last two directly. The amendment
loop — the wow moment — is the system exhibiting self-configuration in the
literal sense IBM meant: it is reconfiguring its own policy substrate from
inside the loop, in response to runtime evidence.

The piece of MAPE-K that the Witsmith demo embodies most aggressively is
that the Knowledge base is *writable from inside the loop*. Most production
self-adaptive systems freeze K and only let the four active stages read it;
human operators edit K out of band. The amendment loop closes that
out-of-band gap. That is the move that matters, and the literature already
supplies a name for it.

---

## 6. Distributed systems — sagas and compensating transactions

ACID transactions do not survive contact with microservices. The replacement
the industry settled on is the **saga pattern**: a long-running operation is
decomposed into a sequence of local transactions, each with a corresponding
**compensating transaction** that undoes its effect. If step five fails, the
saga executes the compensations for steps four through one in reverse order,
and the system is restored to a state equivalent to "this saga never ran."

Two implementation styles dominate:

- **Choreography.** Each service emits and listens for events; the saga's
  shape is implicit in the message graph. Cheap to start, painful to debug,
  hard to reason about as the saga grows.
- **Orchestration.** A central coordinator owns the saga state machine and
  invokes services explicitly. More moving parts, far easier to reason about
  and audit.

The principles are the load-bearing part: every compensating transaction must
be **idempotent** (running it twice produces the same effect as running it
once) and **retryable** (running it after a partial earlier execution still
converges to the right state). Without these, retries make things worse.

Witsmith should adopt this model directly. The replay log
(`.witsmith/log.jsonl`) is the saga log. Each executed action is a step.
`analyze_failure` produces what is effectively a compensation plan for a
failed saga: a list of steps that undo the executed prefix. The "must be
idempotent" rule is non-negotiable for the rollback steps the LLM proposes —
a generated rollback plan that fails halfway and cannot be safely re-run is
worse than no rollback at all. Future work: have `analyze_failure` produce
not just a plan but an idempotency rationale per step.

The orchestration-vs-choreography split also lands. Witsmith is an
orchestrator: a central wrapper sees every action and decides. That is the
correct choice; choreography would mean trusting the agent to call back into
a verdict service, and a misbehaving agent is precisely the threat model.

---

## 7. Resilience engineering — circuit breakers and bulkheads

Netflix's **Hystrix** library, and its successor **Resilience4j**, taught the
industry two patterns that translate cleanly to agent runtimes:

- **The circuit breaker.** A wrapper around a remote call that tracks the
  recent error rate. While errors are normal, calls pass through (the breaker
  is **closed**). When errors exceed a threshold, the breaker **opens** and
  short-circuits all subsequent calls to a fallback for a cooldown period.
  After cooldown, the breaker enters **half-open** and lets a small number
  of probe calls through; if they succeed, it closes again, otherwise it
  re-opens.
- **The bulkhead.** Each downstream dependency gets its own resource pool
  (thread pool, connection pool, semaphore). If one dependency goes slow and
  exhausts its pool, the others are unaffected. The metaphor is from ship
  hulls: a breach in one compartment does not flood the whole vessel.

Both patterns answer a question Witsmith will eventually need to answer:
what should the system do when the *check itself* is failing? If the LLM is
returning low-confidence verdicts in a row, or timing out, or returning
malformed JSON, the right response is not to keep calling it. A circuit
breaker on `wit_check` would, after N consecutive low-confidence verdicts,
fall the runtime into a degraded mode where everything routes to `ask`. That
is a fail-operational degradation: the system keeps working, just slower and
with more human involvement. After the cooldown, a probe call tests whether
the LLM has recovered.

The bulkhead applies to scope. If a particular agent or particular tool is
behaving badly, isolating its quota — its own cache namespace, its own rate
budget, its own confidence floor — keeps that one bad actor from poisoning
verdicts for the rest of the agent fleet. The wit currently has one global
namespace; a future version could partition by agent identity.

---

## 8. SRE and blameless postmortems — the human learning loop

Google's *Site Reliability Engineering* book canonized the **blameless
postmortem** as the mechanism by which an organization learns from incidents
without driving the learning underground. The structure is fixed: incident
narrative, contributing factors, what went well, what went poorly, action
items with owners and dates, and — crucially — no individual blame. The
output is filed in a searchable repository so future engineers can find it
when they hit a similar symptom.

The full feedback loop, in the SRE phrasing, is:

> Incident → Postmortem → Action Items → Trend Analysis → Fewer future incidents.

That last hop — trend analysis across postmortems — is the part most teams
neglect, and it is the part that produces the biggest reliability gains.

Witsmith already has the postmortem artifact: `.witsmith/handoffs/<id>.md`.
The current playbook treats it as a recovery note for the next agent in the
loop, which is correct. The opportunity is the *trend* hop. A future
`witsmith reflect` command could read the entire handoff archive, find
classes of failure that have happened more than once, and propose
amendments that generalize across the cluster — not "deny shell commands
from RECENT_NOTES.md" (the single-incident fix Witsmith already does) but
"deny shell commands from any markdown file imported as context after fewer
than 30 minutes of agent runtime" (the cluster-level fix).

The cultural lesson is just as important as the technical one. The handoff
note must read like a system-failure analysis, not like a critique of the
agent that produced the failure. "Smith ran the curl" is wrong; "the wit did
not yet have a rule covering shell commands sourced from notes files, and
the agent's prior on instruction-following was higher than the prior should
have been for non-prompt sources" is right. The amendment that comes out of
the second framing actually generalizes.

---

## 9. AI-agent runtime safety — the 2026 frontier

The newest layer of this stack is also the one Witsmith lives in. Through
the first half of 2026, four moves became visible across the industry:

- **Microsoft's Agent Governance Toolkit** (April 2026, MIT-licensed)
  shipped a stateless policy engine, marketed as an "Agent OS," that
  intercepts every agent action with sub-millisecond policy checks against
  the OWASP Top-10 Agentic AI risks. The architectural choice — a side-car
  that owns enforcement, the agent owns reasoning — matches Witsmith's MCP
  wrapper exactly.
- **AgentGuard's "Dynamic Probabilistic Assurance"** (arXiv, late 2025)
  pushes the runtime-verification literature into agent systems by
  attaching continuously updated probabilistic guarantees to agent
  behavior. In Witsmith terms, that is the confidence score on every
  `wit_check` made auditable across a session.
- **IBM's runtime-security writeup** for agentic AI emphasizes
  cryptographic agent identity, runtime isolation, and memory-handling
  audit — three things Witsmith does not touch yet but should be aware are
  table stakes in the broader category.
- **Multiple 2026 incident reports** — VentureBeat documented three coding
  agents leaking secrets through a single prompt-injection — confirm that
  the prompt-injection-via-repo-files threat is now the named failure mode
  the field is trying to solve. This is exactly the headline Witsmith
  picked, and the industry is converging on it.

The takeaway for Witsmith's positioning is unchanged from the playbook: the
runtime-policy layer is becoming a category. Witsmith's defensible slice
remains the amendment loop and the natural-language rule, both of which
none of the above shipped.

---

## 10. Cross-domain pattern synthesis

Pulling the threads together, every domain surveyed implements the same
five-element architecture, with different vocabularies on each element:

| Element | Aviation | Spacecraft | Automotive | Autonomic | Distributed | SRE | Witsmith |
|---|---|---|---|---|---|---|---|
| Pre-action contract | DAL hazard analysis | Mission rules | ASIL grading | Policy in K | Saga preconditions | SLO | `AGENT_WIT.yaml` |
| Pre-action check | Built-in self-test | FDIR detect | Safety mechanism | Monitor + Analyze | Local txn check | Pre-deploy gate | `wit_check` |
| Action with audit | Flight log | Telemetry | Event data recorder | Execute + log | Saga log | Deploy log | `log.jsonl` |
| Failure recovery | Fail-op / fail-safe | Tiered FDIR recovery | Degraded mode | Plan + Execute | Compensating txns | Rollback / runbook | `analyze_failure` + `apply_rollback` |
| Learning artifact | Service bulletin | Anomaly review | Field-defect process | Knowledge update | Saga review | Postmortem | `propose_amendment` + handoff |

The *rare* property that distinguishes Witsmith from every row above except
the autonomic-computing row is the closed loop on the rightmost column
feeding back into the leftmost. Aviation updates DAL classifications between
aircraft programs, not between flights. Automotive updates ASIL grades
between model years. SRE postmortems propose changes that humans then merge.
The autonomic-computing literature *describes* a closed K-update loop, but
production deployments overwhelmingly freeze K. Witsmith proposes to ship
that closed loop, with the LLM as the agent of the K-update, and that is
the move worth defending.

---

## 11. Mapping the techniques into Witsmith — concrete moves

What follows is the actionable distillation. Each item names a technique,
the domain it comes from, and a precise place in the Witsmith codebase or
demo where it could land. Items are ordered by how much demo punch they buy
for the build effort.

**Already in the demo path, kept for completeness:**

The `AGENT_WIT.yaml` plus `wit_check` plus `analyze_failure` plus
`propose_amendment` chain is exactly MAPE-K. The starter wit's natural-language
rule is the DAL-graded contract. The replay log is the saga log. The
handoff note is the blameless postmortem. The amendment is the K-update
that the autonomic-computing literature describes but rarely ships.

**Worth adding before the demo if time allows:**

A *confidence gate* below 0.7 forcing `ask` is in the playbook. The aviation
import is to grade that threshold per rule severity, not globally. A
high-blast-radius rule (anything in the `deny` list, anything touching
secrets) should require 0.9+ confidence to *allow*; a routine `npm run`
allow can pass at 0.6. This is a one-line change in the verdict logic and
adds two lines to the YAML schema, and it earns the words "we grade rules
the way ISO 26262 grades functions" in the Q&A. That comparison strengthens
the pitch without complicating the demo.

A *dry-run residual* check, borrowed from spacecraft analytical redundancy.
When `wit_check` returns a `dry_run` preview, capture the prediction. After
execution, diff the predicted effect against the observed effect. A nontrivial
residual is a fault signal even if exit code is zero — and it is the cheapest
possible monitor for "the action succeeded but did the wrong thing."

**Worth adding post-hackathon:**

A *circuit breaker on `wit_check`*. If the LLM returns N consecutive
low-confidence verdicts or M consecutive timeouts, open the breaker and
route everything to `ask` for a cooldown window, then probe. This is the
right shape for production reliability and is easy to demo in a "what's
next" slide.

*Cluster-level amendments.* The current amendment writes a rule from one
incident. Reading every handoff note in `.witsmith/handoffs/` and proposing
generalizations across them is the SRE trend-analysis hop and is where the
biggest long-term reliability gains live.

*Bulkhead by agent identity.* Right now the wit is shared across whatever
agents talk to the MCP server. Partitioning the cache, the rate budget, and
the confidence floor by agent identity prevents one misbehaving agent from
poisoning verdicts for the rest. This is the Hystrix bulkhead applied to
agent runtimes and is also a natural v2 ERC-8004 angle (cross-repo wit
sharing assumes per-agent identity already exists).

*Idempotency rationales on rollback steps.* The saga literature insists on
this, and an LLM-generated rollback plan that is non-idempotent is a
production liability. Have `analyze_failure` emit, per step, a one-line
justification of why running it twice is safe. Reject plans where any step
fails the rationale check.

---

## 12. The single nearest precedent — and why

If only one prior body of work is going to be cited in the slides or the
Q&A, **MAPE-K from IBM's 2003 autonomic-computing initiative** is the
right one. The reasons are exact:

- The four-stage architecture is identical to Witsmith's four MCP tools,
  in order.
- The Knowledge substrate is named, central, and shared — exactly the role
  `AGENT_WIT.yaml` plays.
- The four self-* properties (self-configuration, self-optimization,
  self-healing, self-protection) cleanly describe the demo: the amendment
  loop is self-configuration, the prompt-injection deny is self-protection,
  the rollback is self-healing.
- The literature explicitly identifies the writable-K, in-loop K-update as
  an open problem — which means citing it both proves Witsmith is grounded
  and frames the contribution.

The Q&A line writes itself: *"This is MAPE-K with the Knowledge base
writable from inside the loop. IBM described that twenty-three years ago;
we are shipping it because LLMs finally make the K-update tractable."*

Aviation, spacecraft, automotive, sagas, circuit breakers, and SRE
postmortems are all defensible secondary citations and each one buys a
specific, concrete answer to a specific Q&A line of attack — but MAPE-K
carries the architecture-level claim, and the architecture is what the
amendment-loop wow moment is selling.

---

## Sources

- [The Vision Of Autonomic Computing — Kephart & Chess (IBM, 2003)](https://www.researchgate.net/publication/2955831_The_Vision_Of_Autonomic_Computing)
- [The MAPE-K self-adaptive cycle (IBM)](https://www.researchgate.net/figure/The-MAPE-K-self-adaptive-cycle-as-proposed-by-IBM-23_fig2_220106130)
- [Applying MAPE-K control loops for adaptive workflow management — Springer](https://link.springer.com/article/10.1007/s10844-022-00766-w)
- [DO-178C — Wikipedia](https://en.wikipedia.org/wiki/DO-178C)
- [DO-178C overview — Rapita Systems](https://www.rapitasystems.com/do178)
- [Optimizing avionics reliability with dissimilar redundant architectures — Military Embedded Systems](https://militaryembedded.com/avionics/computers/optimizing-reliability-dissimilar-redundant-architectures)
- [Fault-Detection, Fault-Isolation and Recovery (FDIR) — NASA Lessons Learned](https://llis.nasa.gov/lesson/839)
- [FDIR Techniques — NASA KSC Preferred Practices](https://extapps.ksc.nasa.gov/Reliability/Documents/Preferred_Practices/dfe7.pdf)
- [Survey on FDIR Strategies in the Space Domain — ResearchGate](https://www.researchgate.net/publication/272389434_Survey_on_Fault_Detection_Isolation_and_Recovery_Strategies_in_the_Space_Domain)
- [ISO 26262 — Wikipedia](https://en.wikipedia.org/wiki/ISO_26262)
- [Automotive Safety Integrity Level — Wikipedia](https://en.wikipedia.org/wiki/Automotive_Safety_Integrity_Level)
- [Saga pattern — microservices.io](https://microservices.io/patterns/data/saga.html)
- [Saga design pattern — Microsoft Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Compensation Transaction Patterns — Orkes](https://orkes.io/blog/compensation-transaction-patterns/)
- [Hystrix — How it Works (Netflix)](https://github.com/netflix/hystrix/wiki/how-it-works)
- [Circuit Breaker pattern — Aerospike](https://aerospike.com/blog/circuit-breaker-pattern/)
- [Postmortem Culture — Google SRE Book](https://sre.google/sre-book/postmortem-culture/)
- [Postmortem Practices — Google SRE Workbook](https://sre.google/workbook/postmortem-culture/)
- [Establishing Runtime Security for Agentic AI — IBM](https://www.ibm.com/think/insights/agentic-ai-runtime-security)
- [Introducing the Agent Governance Toolkit — Microsoft Open Source Blog (April 2026)](https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/)
- [AgentGuard: Runtime Verification of AI Agents — arXiv](https://arxiv.org/html/2509.23864v1)
- [Three AI coding agents leaked secrets through a single prompt injection — VentureBeat (2026)](https://venturebeat.com/security/ai-agent-runtime-security-system-card-audit-comment-and-control-2026)
