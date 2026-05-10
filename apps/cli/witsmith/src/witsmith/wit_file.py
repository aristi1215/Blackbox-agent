"""Load and save AGENT_WIT.yaml."""

from __future__ import annotations

from pathlib import Path

import yaml

from witsmith.models import Wit


def load_wit(path: Path) -> Wit:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return Wit.model_validate(raw)


def wit_yaml_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def save_wit_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")
