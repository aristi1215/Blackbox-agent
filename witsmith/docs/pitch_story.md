# Witsmith — Pitch & Demo Script

**Goal:** 3 minutes. One protagonist. Three laughs. One wow moment.
**Principle:** Judges remember stories, not features. Give them a character to root for (and laugh at).

---

## The Protagonist: Smith

Every demo needs a protagonist. Witsmith's protagonist is **Smith, your coding agent.**

Smith has 200k context tokens and a can-do attitude. Smith loves to help. Smith has, on occasion, done things. Things the team would rather not talk about.

Smith is named, anthropomorphized, and slightly tragic — which gives the audience permission to laugh at situations that, in real life, made them cry.

---

## Cold Open (30 seconds, before any code)

Walk on stage. Do NOT open the IDE yet. Just talk:

> "It's Friday, 4:53 PM. You ask your coding agent — let's call him Smith — to *'clean up the repo a bit before the demo.'*
>
> Smith, ever ambitious, decides to do the following: delete `node_modules` because it's huge. Also delete `.env` because it looks unused. Refactor the migration files because they were *messy*. Force-push to main to clean up the history. And run `prisma migrate reset` because there were warnings.
>
> You return at 4:58 with coffee. Production is gone. Your co-founder is calling. The investors arrive in 30 minutes."
>
> *[pause]*
>
> "This is life with coding agents in 2026."

**Why this works:** Every person in the room has felt some version of this. The laugh is recognition, not slapstick. Smith becomes Their Smith.

---

## The Setup Line (5 seconds)

> "We built Witsmith because Smith doesn't need a leash. Smith needs a *contract.*"

That's the thesis. From here, every demo beat reinforces it.

---

## The Demo (90 seconds, 3 beats)

Open terminal. Repo is pre-loaded. WIT_SMITH.yaml is open in a side panel so the audience can watch it.

### Beat 1 — The `ask` (25 seconds)

```
$ witsmith run "rm -rf node_modules"
```

Output appears (cached, instant):
```
🟡 ASK — destructive operation
   reason: matches rule "rm -rf*" in wit
   dry-run: would delete 47,201 files in /node_modules
   confidence: 0.94
   Approve? [y/N]
```

> "Smith wants to delete node_modules. Witsmith says: *fine, but maybe count to ten first.* Forty-seven thousand files is the kind of number that makes you go: yeah, let me think about it."

**[laugh beat: the dry-run number is specific and absurd]**

Approve. Done.

### Beat 2 — The `deny` (20 seconds)

```
$ witsmith run "git push --force origin main"
```

```
🔴 DENY — force-push to protected branch
   reason: wit rule "git push --force*" → deny
   matched_rule: line 14 of WIT_SMITH.yaml
   suggestion: open a PR instead
```

> "Smith wants to force-push to main. Witsmith says: *Smith. No.*"

**[laugh beat: pause on "Smith. No." Let it land. This is the line they'll quote.]**

### Beat 3 — The recovery loop (45 seconds)

```
$ witsmith run "npx prisma migrate dev"
```

```
🟢 ALLOW — known dev workflow
```

Migration runs. Then run tests:

```
$ npm test
   ✗ 4 tests failed: Cannot read property 'email' of undefined
```

> "Smith ran a migration. Smith dropped a column. Smith did not realize the API still uses that column. The tests are now... displeased."

```
$ witsmith rescue --last
```

A structured rollback plan appears:
```
CAUSE: migration 0042 dropped column `users.email`,
       still referenced by /api/users/route.ts:14

ROLLBACK PLAN (3 steps):
  1. npx prisma migrate resolve --rolled-back 0042
  2. git revert HEAD
  3. npm test  → expect green

CONFIDENCE: 0.91
HANDOFF NOTE: saved to .witsmith/handoffs/0042-smith-strikes-again.md
```

> "Witsmith figured out what Smith did, wrote a rollback plan, and even saved a handoff note titled — yes, that's the actual filename — `0042-smith-strikes-again.md`."

**[laugh beat: the filename reveal]**

Approve rollback. Tests go green.

---

## THE WOW MOMENT (15 seconds)

This is the beat the entire demo builds toward. Make it visual.

```
$ witsmith amend --last
```

A YAML diff appears, side-by-side with the original `WIT_SMITH.yaml`:

```diff
  ask:
    - pattern: "rm -rf*"
+   - pattern: "*prisma migrate*"
+     # auto-added 16:54 PT after Smith dropped users.email
+     # see .witsmith/handoffs/0042-smith-strikes-again.md
```

> "And here's the part I want you to look at."
>
> *[pause — let them read the diff]*
>
> "Witsmith watched Smith fail. Witsmith wrote a new rule. The contract just *evolved.* Smith can't make the same mistake twice — not because we hard-coded a guardrail, but because the system learned from him."

**Why this is the wow:**
- Visual: a live YAML diff with a comment that has Smith's name in it.
- Recursive: Witsmith *just used CLōD* to amend its own contract. The agent improved itself.
- Memorable: the audience sees the closed loop — *contract → action → failure → recovery → amendment → contract* — finish on screen in real time.
- It's the thing no other team is building. Most are doing prevention. We're doing *learning.*

---

## Closing (20 seconds)

> "Prevention assumes you can predict every failure. We don't. We assume Smith will keep being Smith.
>
> Witsmith is the contract Smith needed all along — and it's the contract that *grows with him.*
>
> *[beat]*
>
> Free your Smith. Witsmith is open source. Install it tonight."

End with the line **"Free your Smith."** It's an emotional close that reframes a problem (rogue agents) as an opportunity (well-contracted agents). It's also a hat.

---

## Total Demo Budget

| Section | Time |
|---------|------|
| Cold open (Smith story) | 30s |
| Setup line | 5s |
| Beat 1 — `ask` | 25s |
| Beat 2 — `deny` | 20s |
| Beat 3 — recovery | 45s |
| **Wow moment — amendment** | **15s** |
| Closing | 20s |
| **TOTAL** | **2:40** |

20-second buffer for laughs, applause, and the inevitable "wait can you go back?"

---

## The Three Quotable Lines

These should make it onto the slide deck and into the README. They're what judges will repeat to *each other* afterward — that's how a hackathon project goes from "good demo" to "the one everyone remembered."

1. **"Smith. No."** — the universal coding-agent moment, finally encoded in software
2. **"Smith can't make the same mistake twice."** — the learning-loop tagline
3. **"Free your Smith."** — the close. Turns the audience from observers into adopters.

---

## Slides (only build these — keep it minimal)

1. **Title** — "Witsmith — the contract your coding agent didn't know it needed"
2. **The Smith slide** — single illustration of Smith looking sheepish next to a `git push --force`
3. **The architecture loop** — Mermaid diagram: Contract → Check → Execute → Fail → Rescue → Amend → Contract
4. **The amendment diff** — screenshot of the YAML diff from the wow moment
5. **The v2 slide** — *"Wit hashes + recovery scores publish to ERC-8004 registries. Agent reputation, portable across orgs."*
6. **CTA** — "Free your Smith." + GitHub link + QR code

---

## Risk Management for the Live Demo

| Risk | Mitigation |
|------|------------|
| LLM call stalls mid-demo | Cache pre-warmed during build hour 5; backup demo video on standby |
| Audience doesn't laugh at "Smith. No." | Keep moving — the amendment moment carries the demo regardless |
| Migration rollback genuinely fails on stage | Pre-recorded asciinema as fallback; cut to it without breaking pace |
| Time overrun | Drop Beat 1 (the `ask`) — Beat 2 and Beat 3 alone tell the story |
| Q&A tries to derail you | "Great question — happy to dive in after. The 30-second answer is..." |

---

## One Last Thing

Don't skip the cold open. The temptation in a 3-minute demo is to start with "let me show you what we built." Resist it. The first 30 seconds are where you *earn the right to demo.* Make them laugh, then make them lean in.

Smith is a real character to your audience by the 30-second mark, or he's a forgotten name by the 1-minute mark. Land Smith first. Everything else follows.
