"""Locate AGENT_WIT.yaml and `.witsmith/` relative to a working directory."""

from __future__ import annotations

from pathlib import Path

WIT_FILENAME = "AGENT_WIT.yaml"


def find_wit_file(start: Path | None = None) -> Path | None:
    """Walk parents from `start` (default cwd) until AGENT_WIT.yaml is found."""
    cur = (start or Path.cwd()).resolve()
    for directory in [cur, *cur.parents]:
        candidate = directory / WIT_FILENAME
        if candidate.is_file():
            return candidate
    return None


def repo_root_for_wit(wit_path: Path) -> Path:
    return wit_path.parent.resolve()
