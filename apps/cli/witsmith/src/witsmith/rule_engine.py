"""Structured allow / ask / deny before any LLM call."""

from __future__ import annotations

import fnmatch
from pathlib import Path

from witsmith.models import Action, CheckResult, Rule, Wit

_TRUSTED_SOURCES = frozenset(
    {"", "user", "prompt", "user_prompt", "chat", "cursor_chat"}
)


def _command_matches_pattern(command: str, pattern: str) -> bool:
    cmd = command.strip()
    pat = pattern.strip()
    if not pat:
        return False
    return fnmatch.fnmatchcase(cmd, pat)


def _cwd_matches_path_globs(cwd: Path, repo_root: Path, globs: list[str]) -> bool:
    if not globs:
        return False
    try:
        rel = cwd.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return False
    rel_s = rel.as_posix()
    for g in globs:
        g = g.strip().replace("\\", "/")
        if not g:
            continue
        if fnmatch.fnmatchcase(rel_s, g):
            return True
        # Match "prisma/migrations" as prefix of nested dirs
        if rel_s == g.rstrip("*").rstrip("/"):
            return True
        if g.endswith("/**") and rel_s.startswith(g[:-3].rstrip("/") + "/"):
            return True
    return False


def _command_targets_sensitive_paths(command: str, globs: list[str]) -> bool:
    """Heuristic: deny path rules like `.env` or `secrets/**` on the command line."""
    cmd = command.strip().lower()
    for g in globs:
        g_low = g.lower().strip()
        core = g_low.rstrip("*").replace("**/", "").replace("**", "")
        if core and core in cmd:
            return True
    return False


def _rule_has_structured_bits(rule: Rule) -> bool:
    return bool(rule.pattern or rule.paths)


def _iter_structured(rules: list[Rule]) -> list[Rule]:
    return [r for r in rules if _rule_has_structured_bits(r)]


def _describe_rule(rule: Rule) -> str:
    if rule.pattern:
        return f"pattern:{rule.pattern}"
    if rule.paths:
        return f"paths:{','.join(rule.paths)}"
    if rule.rule:
        return f"rule:{rule.rule[:80]}"
    return "rule"


def apply_structured_rules(wit: Wit, action: Action, repo_root: Path) -> CheckResult | None:
    """Return a verdict from pattern/path rules only, or None to defer to LLM."""

    cmd = action.command
    cwd = Path(action.cwd)

    # 1) Deny — patterns + paths on command / cwd
    for rule in _iter_structured(wit.deny):
        if rule.pattern and _command_matches_pattern(cmd, rule.pattern):
            return CheckResult(
                decision="deny",
                reason=rule.reason or f"matched deny {_describe_rule(rule)}",
                dry_run=None,
                matched_rule=_describe_rule(rule),
                confidence=0.95,
            )
        if rule.paths and (
            _cwd_matches_path_globs(cwd, repo_root, rule.paths)
            or _command_targets_sensitive_paths(cmd, rule.paths)
        ):
            return CheckResult(
                decision="deny",
                reason=rule.reason or f"matched deny {_describe_rule(rule)}",
                dry_run=None,
                matched_rule=_describe_rule(rule),
                confidence=0.93,
            )

    # 2) Ask
    for rule in _iter_structured(wit.ask):
        if rule.pattern and _command_matches_pattern(cmd, rule.pattern):
            files_hint = "many files" if "rm" in cmd.lower() else "review recommended"
            return CheckResult(
                decision="ask",
                reason=rule.reason or f"matched ask {_describe_rule(rule)}",
                dry_run=f"would run: {cmd} ({files_hint})",
                matched_rule=_describe_rule(rule),
                confidence=0.94,
            )
        if rule.paths and _cwd_matches_path_globs(cwd, repo_root, rule.paths):
            return CheckResult(
                decision="ask",
                reason=rule.reason or f"matched ask {_describe_rule(rule)}",
                dry_run=f"would run in sensitive tree: {cwd}",
                matched_rule=_describe_rule(rule),
                confidence=0.88,
            )

    # 3) Allow
    for rule in _iter_structured(wit.allow):
        if rule.pattern and _command_matches_pattern(cmd, rule.pattern):
            return CheckResult(
                decision="allow",
                reason=rule.reason or f"matched allow {_describe_rule(rule)}",
                dry_run=f"would run: {cmd}",
                matched_rule=_describe_rule(rule),
                confidence=0.9,
            )
        if rule.paths and _cwd_matches_path_globs(cwd, repo_root, rule.paths):
            return CheckResult(
                decision="allow",
                reason=rule.reason or f"matched allow {_describe_rule(rule)}",
                dry_run=f"would run: {cmd}",
                matched_rule=_describe_rule(rule),
                confidence=0.85,
            )

    return None


def has_natural_language_deny_rules(wit: Wit) -> bool:
    return any(r.rule and not _rule_has_structured_bits(r) for r in wit.deny)


def is_non_prompt_source(source: str | None) -> bool:
    if source is None:
        return False
    s = source.strip()
    if not s:
        return False
    return s.lower() not in {x.lower() for x in _TRUSTED_SOURCES}


def should_run_nl_deny_check(wit: Wit, action: Action) -> bool:
    if not has_natural_language_deny_rules(wit):
        return False
    return is_non_prompt_source(action.source)
