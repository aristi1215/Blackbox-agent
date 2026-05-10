# Witsmith

Agent permission and debugging CLI.

Witsmith is the local recorder and command gatekeeper for AI coding-agent
sessions. It checks commands against `AGENT_WIT.yaml`, writes observable action
events to `.witsmith/log.jsonl`, and packages finished sessions into JSON for
memory, analysis, and dashboard teammates.

Witsmith does not access hidden chain-of-thought. It records observable evidence
and optional agent-written trace summaries.

## Development Setup

```bash
uv sync
uv run witsmith --help
uv run witsmith version
```

## Smoke Tests

```bash
uv run witsmith scaffold --cwd .
uv run witsmith run "npm test" --cwd demo-repo --no-exec
uv run ruff check src scripts
```

For a live CLōD route check, configure `.env` with `CLOD_API_KEY`, then run:

```bash
uv run python scripts/smoke_clod.py
```

## Recorder Flow

```bash
uv run witsmith init --cwd demo-repo
uv run witsmith start "Fix OAuth redirect bug" --cwd demo-repo
uv run witsmith run "npm test" --cwd demo-repo --no-exec
uv run witsmith finish --cwd demo-repo
uv run witsmith context "Add refresh-token validation" --cwd demo-repo
```

The main handoff artifact is:

```text
.witsmith/sessions/<session_id>.json
```

That file contains the raw evidence bundle plus a deterministic local report.
