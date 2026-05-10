"""Runtime configuration (env flags, Witsmith data directory name)."""

from __future__ import annotations

import os

from witsmith.clod import _load_env_once


def witsmith_data_dirname() -> str:
    _load_env_once()
    return os.environ.get("WITSMITH_DIR", ".witsmith")


def mock_llm_enabled() -> bool:
    """When true, skip live CLōD calls and use deterministic demo outputs."""
    _load_env_once()
    return os.environ.get("WITSMITH_MOCK_LLM", "").strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def confidence_ask_threshold() -> float:
    _load_env_once()
    return float(os.environ.get("WITSMITH_CONFIDENCE_ASK_BELOW", "0.7"))
