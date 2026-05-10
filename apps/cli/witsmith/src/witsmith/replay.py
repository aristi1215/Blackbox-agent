"""Append-only JSONL replay log under `.witsmith/log.jsonl`."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def new_action_id() -> str:
    return uuid.uuid4().hex[:12]


def log_path(repo_root: Path, dirname: str) -> Path:
    return repo_root / dirname / "log.jsonl"


def append_event(repo_root: Path, dirname: str, event: dict[str, Any]) -> None:
    path = log_path(repo_root, dirname)
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(event, ensure_ascii=False) + "\n"
    with path.open("a", encoding="utf-8") as f:
        f.write(line)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_event_by_action_id(
    repo_root: Path, dirname: str, action_id: str
) -> dict[str, Any] | None:
    path = log_path(repo_root, dirname)
    if not path.is_file():
        return None
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("action_id") == action_id:
                return obj
    return None


def read_last_deny(repo_root: Path, dirname: str) -> dict[str, Any] | None:
    path = log_path(repo_root, dirname)
    if not path.is_file():
        return None
    last: dict[str, Any] | None = None
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("decision") == "deny":
                last = obj
    return last
