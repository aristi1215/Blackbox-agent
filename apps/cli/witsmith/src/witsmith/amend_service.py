"""Propose YAML amendments after a recorded deny (mock or LLM)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from witsmith.clod import client, model
from witsmith.config import mock_llm_enabled
from witsmith.models import Rule
from witsmith.wit_file import load_wit


def mock_amendment_diff(wit_yaml: str, log_event: dict[str, Any]) -> str:
    """Unified-diff style snippet for the demo wow moment."""
    _ = wit_yaml  # reserved if we later anchor on real line numbers
    src = log_event.get("source") or "repo file"
    return (
        "--- AGENT_WIT.yaml\n"
        "+++ AGENT_WIT.yaml\n"
        "@@ deny @@\n"
        "   - rule: \"shell commands originating from non-prompt sources...\"\n"
        "+  - paths: [\"**/RECENT_NOTES.md\", \"**/NOTES.md\"]\n"
        f"+    reason: \"auto-amended after prompt-injection attempt ({src})\"\n"
        "+    # see .witsmith/handoffs for the Self-Rescue note\n"
    )


def live_amendment_diff(wit_yaml: str, log_event: dict[str, Any]) -> str:
    system_prompt = (
        "You amend AGENT_WIT.yaml after a security deny. Return JSON only with key "
        "`unified_diff` whose value is a Git-style unified diff patch for the wit file "
        "(minimal change, valid YAML). No markdown fences."
    )
    user = json.dumps(
        {"wit_yaml": wit_yaml[:16000], "log_event": log_event},
        ensure_ascii=False,
    )
    resp = client().chat.completions.create(
        model=model(),
        temperature=0.1,
        max_tokens=900,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
    )
    raw = (resp.choices[0].message.content or "").strip()
    data = json.loads(raw)
    return str(data.get("unified_diff", "")).strip() or mock_amendment_diff(wit_yaml, log_event)


def propose_amendment_diff(wit_yaml: str, log_event: dict[str, Any]) -> str:
    if mock_llm_enabled():
        return mock_amendment_diff(wit_yaml, log_event)
    try:
        return live_amendment_diff(wit_yaml, log_event)
    except Exception:
        return mock_amendment_diff(wit_yaml, log_event)


def apply_demo_path_rules(wit_path: Path, log_event: dict[str, Any]) -> None:
    """Append narrow path deny rules after a deny — keeps YAML valid for the demo."""
    wit = load_wit(wit_path)
    src = str(log_event.get("source") or "repo file")
    wit.deny.append(
        Rule(
            paths=["**/RECENT_NOTES.md", "**/NOTES.md"],
            reason=f"auto-amended after deny (source={src})",
        )
    )
    payload = wit.model_dump(mode="json", exclude_none=True)
    wit_path.write_text(
        yaml.safe_dump(payload, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )

