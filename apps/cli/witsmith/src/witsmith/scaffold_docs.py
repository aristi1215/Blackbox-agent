"""Create repo-root hackathon docs beside AGENT_WIT.yaml when they are missing."""

from __future__ import annotations

from importlib import resources

from pathlib import Path

_REPO_ROOT_FILES = ("DONE.md", "AGENTS.md", "RECENT_NOTES.md")


def ensure_hackathon_docs(repo_root: Path) -> list[str]:
    """Write bundled templates next to wit if filenames are absent. Never overwrites."""
    pkg = resources.files("witsmith.scaffold_templates")
    root = Path(repo_root).resolve()
    created: list[str] = []
    for name in _REPO_ROOT_FILES:
        dest = root / name
        if dest.exists():
            continue
        body = pkg.joinpath(name).read_bytes()
        dest.write_bytes(body)
        created.append(name)
    return created
