"""SQLite verdict cache: hash(action + wit text) → JSON CheckResult."""

from __future__ import annotations

import hashlib
import sqlite3
from pathlib import Path

from witsmith.models import Action, CheckResult


def _connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        "CREATE TABLE IF NOT EXISTS verdict_cache ("
        "  key TEXT PRIMARY KEY,"
        "  payload TEXT NOT NULL,"
        "  created_at TEXT NOT NULL DEFAULT (datetime('now'))"
        ")"
    )
    conn.commit()
    return conn


def cache_key(action: Action, wit_yaml: str) -> str:
    normalized = (
        f"{action.command.strip()}\n{action.cwd.strip()}\n"
        f"{action.source or ''}\n{action.diff or ''}\n{wit_yaml.strip()}"
    )
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def cache_get(db_path: Path, key: str) -> CheckResult | None:
    if not db_path.parent.is_dir() and not db_path.exists():
        return None
    try:
        conn = _connect(db_path)
    except OSError:
        return None
    try:
        row = conn.execute(
            "SELECT payload FROM verdict_cache WHERE key = ?", (key,)
        ).fetchone()
    finally:
        conn.close()
    if not row:
        return None
    try:
        return CheckResult.model_validate_json(row[0])
    except Exception:
        return None


def cache_put(db_path: Path, key: str, result: CheckResult) -> None:
    conn = _connect(db_path)
    try:
        conn.execute(
            "INSERT OR REPLACE INTO verdict_cache (key, payload) VALUES (?, ?)",
            (key, result.model_dump_json()),
        )
        conn.commit()
    finally:
        conn.close()
