"""Witsmith MCP server — fastmcp with the four playbook tools wired to real logic."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastmcp import FastMCP

from witsmith.amend_service import propose_amendment_diff
from witsmith.analyze_service import analyze_log_event
from witsmith.check_service import run_wit_check
from witsmith.config import witsmith_data_dirname
from witsmith.layout import find_wit_file, repo_root_for_wit
from witsmith.models import Action
from witsmith.replay import read_event_by_action_id
from witsmith.scaffold_docs import ensure_hackathon_docs
from witsmith.wit_file import wit_yaml_text

mcp = FastMCP("witsmith")


def _wit_path(repo_path: str) -> Path:
    wit = find_wit_file(Path(repo_path))
    if wit is None:
        raise FileNotFoundError(
            f"AGENT_WIT.yaml not found under {repo_path!r} (walked parents)."
        )
    ensure_hackathon_docs(repo_root_for_wit(wit))
    return wit


@mcp.tool()
def wit_init(repo_path: str = ".") -> dict[str, Any]:
    """Return the existing AGENT_WIT.yaml for a repo (LLM drafting is a post-hackathon cut)."""
    root = Path(repo_path).resolve()
    wit = find_wit_file(root)
    if wit is None:
        return {
            "status": "missing",
            "hint": "Add AGENT_WIT.yaml at the repo root (see Witsmith template in the playbook).",
        }
    ensure_hackathon_docs(repo_root_for_wit(wit))
    text = wit.read_text(encoding="utf-8")
    return {
        "status": "exists",
        "path": str(wit),
        "yaml_excerpt": text[:6000],
        "note": "wit_init LLM draft is cut for the hackathon — hand-edit or copy template.",
    }


@mcp.tool()
def wit_check(
    command: str,
    cwd: str,
    diff: str | None = None,
    source: str | None = None,
    repo_path: str = ".",
) -> dict[str, Any]:
    """Decide allow / ask / deny for a proposed action."""
    wit_path = _wit_path(repo_path)
    action = Action(command=command, cwd=cwd, diff=diff, source=source)
    result, meta = run_wit_check(action, wit_path)
    return {**result.model_dump(mode="json"), "meta": meta}


@mcp.tool()
def analyze_failure(
    action_id: str,
    error: str,
    diff: str | None = None,
    repo_path: str = ".",
) -> dict[str, Any]:
    """Produce a structured rollback plan for a failed / denied action."""
    wit_path = _wit_path(repo_path)
    repo_root = repo_root_for_wit(wit_path)
    dirname = witsmith_data_dirname()
    event = read_event_by_action_id(repo_root, dirname, action_id)
    if event is None:
        return {"error": "action_id not found in replay log", "action_id": action_id}
    payload = {**event, "runner_error": error, "diff": diff}
    analysis = analyze_log_event(payload)
    return analysis.model_dump(mode="json")


@mcp.tool()
def propose_amendment(failure_id: str, repo_path: str = ".") -> dict[str, Any]:
    """Return a YAML unified-diff style amendment proposal for the wit."""
    wit_path = _wit_path(repo_path)
    repo_root = repo_root_for_wit(wit_path)
    dirname = witsmith_data_dirname()
    event = read_event_by_action_id(repo_root, dirname, failure_id)
    if event is None:
        return {"error": "failure_id not found in replay log", "failure_id": failure_id}
    yml = wit_yaml_text(wit_path)
    diff = propose_amendment_diff(yml, event)
    return {"failure_id": failure_id, "unified_diff": diff}


def run() -> None:
    """Entry point used by `witsmith-server` console script."""
    mcp.run()


if __name__ == "__main__":
    run()
