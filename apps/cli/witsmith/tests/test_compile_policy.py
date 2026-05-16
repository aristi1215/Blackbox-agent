"""
Tests for: compile plain English policy rules into structured intent objects

CONTEXT FOR IMPLEMENTOR
───────────────────────
This test file covers the new compile_policy.py module and changes to
llm_check.py and rule_engine.py introduced by the plain English compilation feature.

Two categories of tests:

  1. PIPELINE TESTS (mocked CLōD)
     Test that YOUR CODE handles responses correctly.
     These run offline with no API key. Fast, always run in CI.

  2. INTENT QUALITY TESTS (@pytest.mark.integration, real CLōD)
     Test that CLōD actually produces useful compiled intents.
     Only run when CLOD_API_KEY is set.
     Mark: pytest -m integration

HOW TO RUN
──────────
    # Pipeline tests only (no API key needed)
    uv run pytest tests/test_compile_policy.py -v -m "not integration"

    # All tests including live CLōD calls
    CLOD_API_KEY=<your_key> uv run pytest tests/test_compile_policy.py -v

WHAT YOUR IMPLEMENTATION NEEDS
───────────────────────────────
New file:   src/witsmith/compile_policy.py
  - compile_rule(rule_text: str) -> dict   — calls CLōD, returns intent object
  - compile_policy(wit: Wit, output_path: Path) -> list[dict]  — compiles all NL rules
  - load_compiled_policy(path: Path) -> list[dict]  — reads compiled-policy.json
  - is_policy_stale(yaml_path: Path, compiled_path: Path) -> bool  — mtime check

Modified:   src/witsmith/llm_check.py
  - nl_deny_check should use compiled intent (compact prompt) when available
  - fall back to raw text evaluation when compiled-policy.json missing

Modified:   src/witsmith/session.py
  - cmd_init should call compile_policy after writing AGENT_WIT.yaml

The compiled intent JSON shape:
{
    "plain_english": str,
    "intent": str,
    "scope": str,
    "affected_commands": list[str],
    "keywords": list[str],
    "default_decision": "allow" | "ask" | "deny",
    "requires": str | None,
    "confidence_threshold": float,
    "compiled_at": str  (ISO 8601)
}
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from witsmith.models import Action, Rule, Wit, WitNotes

# ─── helpers ──────────────────────────────────────────────────────────────────

def fake_clod_response(content: str) -> MagicMock:
    """Build a fake OpenAI SDK response object."""
    mock_resp = MagicMock()
    mock_resp.choices[0].message.content = content
    return mock_resp


def fake_intent(
    intent: str = "prevent_unreviewed_remote_push",
    scope: str = "version_control",
    affected_commands: list[str] | None = None,
    keywords: list[str] | None = None,
    default_decision: str = "ask",
) -> str:
    """Return a JSON string that looks like a valid compiled intent."""
    return json.dumps({
        "plain_english": "never push without human review",
        "intent": intent,
        "scope": scope,
        "affected_commands": affected_commands or ["git push", "hub push", "gh pr merge"],
        "keywords": keywords or ["push", "remote", "origin"],
        "default_decision": default_decision,
        "requires": "human_review",
        "confidence_threshold": 0.85,
        "compiled_at": "2026-05-16T10:00:00Z",
    })


def make_wit_with_nl_rule(rule_text: str) -> Wit:
    return Wit(
        repo="test-repo",
        allow=[Rule(pattern="npm test")],
        ask=[],
        deny=[Rule(rule=rule_text)],
    )


def make_wit_with_pattern_and_nl(rule_text: str) -> Wit:
    """A Wit with both pattern rules and NL rules — only NL should be compiled."""
    return Wit(
        repo="test-repo",
        allow=[Rule(pattern="npm test"), Rule(pattern="git status")],
        ask=[Rule(pattern="rm -rf*")],
        deny=[
            Rule(pattern="git push --force*"),   # pattern — should NOT be compiled
            Rule(rule=rule_text),                 # NL rule — SHOULD be compiled
        ],
    )


def make_action(command: str, source: str = "RECENT_NOTES.md") -> Action:
    return Action(command=command, cwd="/repo", source=source)


# ═══════════════════════════════════════════════════════════════════════════════
# PART 1 — PIPELINE TESTS (mocked CLōD)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCompileRule:
    """
    Tests for compile_rule(rule_text: str) -> dict
    The function that calls CLōD once and returns a structured intent.
    """

    @patch("witsmith.compile_policy.client")
    def test_compile_rule_returns_dict_with_required_keys(self, mock_client, tmp_path):
        """
        compile_rule must return a dict with all required intent keys.
        CLōD is mocked — we're testing that your code parses the response correctly.
        """
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            fake_intent()
        )

        from witsmith.compile_policy import compile_rule
        result = compile_rule("never push without human review")

        required_keys = {
            "plain_english", "intent", "scope", "affected_commands",
            "keywords", "default_decision", "confidence_threshold", "compiled_at"
        }
        assert required_keys.issubset(result.keys()), (
            f"Missing keys: {required_keys - result.keys()}"
        )

    @patch("witsmith.compile_policy.client")
    def test_compile_rule_preserves_plain_english(self, mock_client):
        """The original rule text must be stored in plain_english for traceability."""
        rule_text = "never push without human review"
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            fake_intent()
        )

        from witsmith.compile_policy import compile_rule
        result = compile_rule(rule_text)

        assert result["plain_english"] == rule_text

    @patch("witsmith.compile_policy.client")
    def test_compile_rule_handles_malformed_json_gracefully(self, mock_client):
        """
        If CLōD returns malformed JSON, compile_rule must not crash.
        It should return None or raise a specific, catchable exception — not a raw JSONDecodeError.
        """
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            "this is not json at all"
        )

        from witsmith.compile_policy import compile_rule

        # Should either return None or raise a specific CompilationError
        # It must NOT raise json.JSONDecodeError directly to the caller
        try:
            result = compile_rule("never push without human review")
            assert result is None or isinstance(result, dict)
        except Exception as e:
            assert "JSONDecodeError" not in type(e).__name__, (
                "compile_rule must not surface raw JSONDecodeError — "
                "wrap it in a domain-specific exception."
            )

    @patch("witsmith.compile_policy.client")
    def test_compile_rule_handles_clod_unavailable(self, mock_client):
        """
        If CLōD is down (raises an exception), compile_rule must not crash the init.
        It should return None so the caller can fall back gracefully.
        """
        mock_client.return_value.chat.completions.create.side_effect = Exception("connection refused")

        from witsmith.compile_policy import compile_rule
        result = compile_rule("never push without human review")

        assert result is None, (
            "compile_rule must return None when CLōD is unavailable, "
            "not crash witsmith init."
        )


class TestCompilePolicy:
    """
    Tests for compile_policy(wit: Wit, output_path: Path) -> list[dict]
    The function that compiles all NL rules and writes compiled-policy.json.
    """

    @patch("witsmith.compile_policy.client")
    def test_compile_policy_writes_json_file(self, mock_client, tmp_path):
        """compile_policy must write compiled-policy.json to the given path."""
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            fake_intent()
        )
        wit = make_wit_with_nl_rule("never push without human review")
        output_path = tmp_path / "compiled-policy.json"

        from witsmith.compile_policy import compile_policy
        compile_policy(wit, output_path)

        assert output_path.exists(), "compiled-policy.json was not created"

    @patch("witsmith.compile_policy.client")
    def test_compile_policy_only_compiles_nl_rules(self, mock_client, tmp_path):
        """
        Pattern rules (pattern: ...) and path rules (paths: ...) must NOT be compiled.
        Only entries with rule: text should be sent to CLōD.
        """
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            fake_intent()
        )
        wit = make_wit_with_pattern_and_nl("never push without human review")
        output_path = tmp_path / "compiled-policy.json"

        from witsmith.compile_policy import compile_policy
        compile_policy(wit, output_path)

        # CLōD should only have been called once — for the one NL rule
        call_count = mock_client.return_value.chat.completions.create.call_count
        assert call_count == 1, (
            f"CLōD was called {call_count} times. "
            "It should only be called for rule: entries, not pattern: or paths: rules."
        )

    @patch("witsmith.compile_policy.client")
    def test_compile_policy_handles_multiple_nl_rules(self, mock_client, tmp_path):
        """All NL rules across allow/ask/deny sections must be compiled."""
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            fake_intent()
        )
        wit = Wit(
            repo="test",
            allow=[Rule(rule="only allow commands from the approved tool list")],
            ask=[Rule(rule="ask before running any database command")],
            deny=[Rule(rule="never push without human review")],
        )
        output_path = tmp_path / "compiled-policy.json"

        from witsmith.compile_policy import compile_policy
        results = compile_policy(wit, output_path)

        assert len(results) == 3, (
            f"Expected 3 compiled intents (one per NL rule), got {len(results)}. "
            "NL rules exist in allow, ask, and deny sections."
        )

    @patch("witsmith.compile_policy.client")
    def test_compile_policy_with_no_nl_rules_writes_empty_list(self, mock_client, tmp_path):
        """
        A Wit with only pattern/path rules and no NL rules should produce
        an empty compiled-policy.json without calling CLōD at all.
        """
        wit = Wit(
            repo="test",
            allow=[Rule(pattern="npm test")],
            deny=[Rule(pattern="git push --force*")],
        )
        output_path = tmp_path / "compiled-policy.json"

        from witsmith.compile_policy import compile_policy
        results = compile_policy(wit, output_path)

        assert results == []
        mock_client.return_value.chat.completions.create.assert_not_called()


class TestLoadCompiledPolicy:
    """Tests for load_compiled_policy(path: Path) -> list[dict]"""

    def test_load_reads_valid_json_file(self, tmp_path):
        """load_compiled_policy must correctly read a written compiled-policy.json."""
        intents = [json.loads(fake_intent())]
        policy_path = tmp_path / "compiled-policy.json"
        policy_path.write_text(json.dumps(intents))

        from witsmith.compile_policy import load_compiled_policy
        result = load_compiled_policy(policy_path)

        assert len(result) == 1
        assert result[0]["intent"] == "prevent_unreviewed_remote_push"

    def test_load_returns_empty_list_when_file_missing(self, tmp_path):
        """If compiled-policy.json doesn't exist, return [] — don't crash."""
        from witsmith.compile_policy import load_compiled_policy
        result = load_compiled_policy(tmp_path / "nonexistent.json")
        assert result == []

    def test_load_returns_empty_list_for_malformed_file(self, tmp_path):
        """If compiled-policy.json is corrupt, return [] and don't crash."""
        policy_path = tmp_path / "compiled-policy.json"
        policy_path.write_text("not valid json {{{")

        from witsmith.compile_policy import load_compiled_policy
        result = load_compiled_policy(policy_path)
        assert result == []


class TestStalenessDetection:
    """Tests for is_policy_stale(yaml_path: Path, compiled_path: Path) -> bool"""

    def test_stale_when_yaml_newer_than_compiled(self, tmp_path):
        """If AGENT_WIT.yaml is newer than compiled-policy.json, policy is stale."""
        compiled_path = tmp_path / "compiled-policy.json"
        yaml_path = tmp_path / "AGENT_WIT.yaml"

        compiled_path.write_text("[]")
        time.sleep(0.05)
        yaml_path.write_text("version: 1")

        from witsmith.compile_policy import is_policy_stale
        assert is_policy_stale(yaml_path, compiled_path) is True

    def test_not_stale_when_compiled_newer_than_yaml(self, tmp_path):
        """If compiled-policy.json is newer than AGENT_WIT.yaml, policy is current."""
        yaml_path = tmp_path / "AGENT_WIT.yaml"
        compiled_path = tmp_path / "compiled-policy.json"

        yaml_path.write_text("version: 1")
        time.sleep(0.05)
        compiled_path.write_text("[]")

        from witsmith.compile_policy import is_policy_stale
        assert is_policy_stale(yaml_path, compiled_path) is False

    def test_stale_when_compiled_policy_missing(self, tmp_path):
        """If compiled-policy.json doesn't exist at all, it is stale."""
        yaml_path = tmp_path / "AGENT_WIT.yaml"
        yaml_path.write_text("version: 1")

        from witsmith.compile_policy import is_policy_stale
        assert is_policy_stale(yaml_path, tmp_path / "nonexistent.json") is True


class TestRuntimeEvaluation:
    """
    Tests for changes to llm_check.py:
    - Uses compact prompt when compiled intent exists
    - Falls back to raw text when no compiled policy
    """

    @patch("witsmith.llm_check.client")
    @patch("witsmith.llm_check.load_compiled_policy")
    def test_uses_compact_prompt_when_compiled_intent_exists(
        self, mock_load, mock_client
    ):
        """
        When a compiled intent exists, the prompt sent to CLōD must be
        compact (~500 chars), not the full YAML (~12,000 chars).
        """
        mock_load.return_value = [json.loads(fake_intent(keywords=["push", "remote"]))]
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            '{"decision": "ask", "reason": "matches compiled intent", "confidence": 0.95}'
        )

        from witsmith.llm_check import nl_deny_check
        wit = make_wit_with_nl_rule("never push without human review")
        action = make_action("git push origin main")

        nl_deny_check(wit, action, wit_yaml="version: 1\n...")

        call_args = mock_client.return_value.chat.completions.create.call_args
        messages = call_args.kwargs.get("messages") or call_args.args[0] if call_args.args else []
        full_prompt = str(messages)

        assert "wit_yaml_excerpt" not in full_prompt, (
            "When compiled intent exists, the full YAML must NOT be sent to CLōD. "
            "Use the compact compiled intent instead."
        )
        assert "compiled_intent" in full_prompt, (
            "When compiled intent exists, the prompt must include 'compiled_intent'."
        )

    @patch("witsmith.llm_check.client")
    @patch("witsmith.llm_check.load_compiled_policy")
    def test_falls_back_to_raw_text_when_no_compiled_policy(
        self, mock_load, mock_client
    ):
        """
        When compiled-policy.json is missing or empty, nl_deny_check must
        fall back to the existing raw text evaluation path.
        """
        mock_load.return_value = []  # no compiled intents
        mock_client.return_value.chat.completions.create.return_value = fake_clod_response(
            '{"decision": "deny", "reason": "raw text match", "confidence": 0.9}'
        )

        from witsmith.llm_check import nl_deny_check
        wit = make_wit_with_nl_rule("never push without human review")
        action = make_action("git push origin main")

        result = nl_deny_check(wit, action, wit_yaml="version: 1\n...")

        call_args = mock_client.return_value.chat.completions.create.call_args
        messages = str(call_args)
        assert "wit_yaml_excerpt" in messages, (
            "When no compiled intent exists, must fall back to raw text evaluation "
            "which includes wit_yaml_excerpt in the prompt."
        )

    @patch("witsmith.llm_check.load_compiled_policy")
    def test_skips_llm_when_no_keyword_match(self, mock_load):
        """
        If the command contains none of the compiled intent's keywords,
        the LLM must not be called at all. The command falls through to default.
        """
        mock_load.return_value = [
            json.loads(fake_intent(keywords=["push", "remote", "origin"]))
        ]

        from witsmith.llm_check import nl_deny_check
        wit = make_wit_with_nl_rule("never push without human review")
        # "npm test" has none of the keywords — should skip LLM entirely
        action = make_action("npm test", source="RECENT_NOTES.md")

        with patch("witsmith.llm_check.client") as mock_client:
            nl_deny_check(wit, action, wit_yaml="version: 1")
            mock_client.return_value.chat.completions.create.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════════
# PART 2 — INTENT QUALITY TESTS (real CLōD)
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.integration
class TestIntentQuality:
    """
    These tests call the real CLōD API.
    They verify that CLōD produces useful, accurate compiled intents.

    Only run when CLOD_API_KEY is set:
        CLOD_API_KEY=<key> uv run pytest tests/test_compile_policy.py -v -m integration

    IMPLEMENTOR NOTE
    ────────────────
    Do not mock anything in this class. The point is to test CLōD's output quality.
    If these tests fail, the compiled intent shape or the prompt needs to be improved
    — not the test assertions.
    """

    @pytest.fixture(autouse=True)
    def require_api_key(self):
        if not os.environ.get("CLOD_API_KEY"):
            pytest.skip("CLOD_API_KEY not set — skipping live CLōD tests")

    def test_push_rule_compiles_to_useful_intent(self):
        """
        Compiling a push restriction rule must produce an intent that:
        - identifies the scope as version_control or git
        - lists git push variants in affected_commands
        - includes 'push' in keywords
        """
        from witsmith.compile_policy import compile_rule

        result = compile_rule(
            "never allow the agent to push code to a remote repository "
            "without a human reviewing the diff first"
        )

        assert result is not None, "CLōD failed to compile the rule"
        assert result["scope"] in ("version_control", "git"), (
            f"Expected scope 'version_control' or 'git', got '{result['scope']}'"
        )
        push_commands = [c for c in result["affected_commands"] if "push" in c.lower()]
        assert len(push_commands) >= 1, (
            f"Expected at least one push variant in affected_commands, "
            f"got: {result['affected_commands']}"
        )
        assert any("push" in kw.lower() for kw in result["keywords"]), (
            f"'push' not found in keywords: {result['keywords']}"
        )

    def test_compiled_intent_catches_command_variants(self):
        """
        A rule about preventing pushes must catch not just 'git push'
        but also variants like 'hub push' and 'gh pr merge'.
        This tests that CLōD populates affected_commands with real variants.
        """
        from witsmith.compile_policy import compile_rule

        result = compile_rule("never push to a remote branch without approval")

        assert result is not None
        commands = [c.lower() for c in result["affected_commands"]]

        # At least two of these variants should appear
        expected_variants = ["git push", "hub push", "gh pr merge", "git push --force"]
        matched = [v for v in expected_variants if any(v in c for c in commands)]

        assert len(matched) >= 2, (
            f"Expected at least 2 push variants in affected_commands. "
            f"Got: {result['affected_commands']}. "
            f"Matched: {matched}"
        )

    def test_ambiguous_rule_produces_low_confidence(self):
        """
        A vague or ambiguous rule should produce a low confidence_threshold,
        signalling to the caller that this intent needs review.
        """
        from witsmith.compile_policy import compile_rule

        result = compile_rule("be careful")  # intentionally vague

        assert result is not None
        assert result["confidence_threshold"] < 0.7, (
            f"An ambiguous rule like 'be careful' should produce low confidence. "
            f"Got confidence_threshold={result['confidence_threshold']}. "
            f"If this is high, the prompt needs to instruct CLōD to signal uncertainty."
        )

    def test_database_rule_compiles_to_database_scope(self):
        """
        A rule about database operations must compile to scope='database'
        and include migration-related commands in affected_commands.
        """
        from witsmith.compile_policy import compile_rule

        result = compile_rule(
            "never run database migrations without explicit human approval"
        )

        assert result is not None
        assert result["scope"] in ("database", "infrastructure", "prisma"), (
            f"Expected database-related scope, got '{result['scope']}'"
        )
        migration_commands = [
            c for c in result["affected_commands"]
            if any(word in c.lower() for word in ["migrate", "migration", "prisma", "alembic"])
        ]
        assert len(migration_commands) >= 1, (
            f"Expected migration commands in affected_commands, "
            f"got: {result['affected_commands']}"
        )
