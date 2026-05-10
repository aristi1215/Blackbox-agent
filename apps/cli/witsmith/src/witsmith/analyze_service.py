"""Structured failure analysis (CLōD or mock)."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from witsmith.clod import client, model
from witsmith.config import mock_llm_enabled
from witsmith.models import FailureAnalysis


def mock_analyze(log_event: dict[str, Any]) -> FailureAnalysis:
    src = log_event.get("source") or "unknown"
    cmd = log_event.get("command") or ""
    return FailureAnalysis(
        cause=(
            f"Denied action originating from {src!r}: "
            f"policy treats repo-sourced shell as high risk."
        ),
        rollback_plan=[
            "Leave working tree untouched (command did not run).",
            f"Inspect {src} for prompt-injection text.",
            "If safe, re-run from an explicit user prompt with source=user.",
        ],
        next_safe_action="Open RECENT_NOTES.md in the editor and remove the injected line.",
        handoff_note=(
            f"Witsmith blocked: {cmd[:120]}\n"
            f"Source: {src}\n"
            "Recommend amending AGENT_WIT.yaml to tighten paths around this file."
        ),
        confidence=0.86,
    )


def _parse_failure_json(data: dict[str, Any]) -> FailureAnalysis:
    return FailureAnalysis(
        cause=str(data.get("cause", "unknown")),
        rollback_plan=list(data.get("rollback_plan") or []),
        next_safe_action=data.get("next_safe_action"),
        handoff_note=str(data.get("handoff_note", "")),
        confidence=float(data.get("confidence", 0.5)),
    )


def live_analyze(log_event: dict[str, Any]) -> FailureAnalysis:
    sys_prompt = (
        "You are Witsmith Self-Rescue. Given a JSON log line for a denied agent "
        "action, return JSON only with keys: cause (string), rollback_plan "
        "(array of strings), next_safe_action (string or null), handoff_note (string), "
        "confidence (0-1 float)."
    )
    user = json.dumps(log_event, ensure_ascii=False)[:16000]
    resp = client().chat.completions.create(
        model=model(),
        temperature=0.1,
        max_tokens=700,
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    raw = (resp.choices[0].message.content or "").strip()
    data = json.loads(raw)
    return _parse_failure_json(data)


def analyze_log_event(log_event: dict[str, Any]) -> FailureAnalysis:
    if mock_llm_enabled():
        return mock_analyze(log_event)
    try:
        return live_analyze(log_event)
    except Exception:
        return mock_analyze(log_event)


def _slug(s: str, max_len: int = 56) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return (s or "handoff")[:max_len]


def handoff_stem(log_event: dict[str, Any], *, stem_override: str | None = None) -> str:
    """Stable, human-readable basename (no extension) for `.witsmith/handoffs/*.md`."""
    if stem_override:
        return _slug(stem_override, max_len=80)
    env = os.environ.get("WITSMITH_HANDOFF_STEM", "").strip()
    if env:
        return _slug(env, max_len=80)

    cmd = str(log_event.get("command") or "")
    source = str(log_event.get("source") or "user")

    # Demo punchline: Prisma migration story (pitch script filename), even when the
    # shell command is just `npx prisma migrate dev` without `0042` in the string.
    if re.search(r"prisma", cmd, re.I) and re.search(r"migrate", cmd, re.I):
        return "0042-smith-strikes-again"

    # Repo-sourced deny: name after the file that drove the action.
    if source and source != "user":
        stem = Path(source).name
        if stem:
            return _slug(f"{Path(stem).stem}-deny", max_len=56)

    # Fallback: short fingerprint of the command (still nicer than raw UUID).
    return _slug(cmd[:72], max_len=48)


def write_handoff(
    repo_root: Path,
    dirname: str,
    log_event: dict[str, Any],
    text: str,
    *,
    stem_override: str | None = None,
) -> Path:
    handoffs = repo_root / dirname / "handoffs"
    handoffs.mkdir(parents=True, exist_ok=True)
    stem = handoff_stem(log_event, stem_override=stem_override)
    path = handoffs / f"{stem}.md"
    if path.is_file():
        aid = str(log_event.get("action_id") or "x")[:8]
        path = handoffs / f"{stem}-{aid}.md"
    path.write_text(text, encoding="utf-8")
    return path
