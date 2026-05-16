from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from witsmith.models import Action, Rule, Wit
from witsmith.rule_engine import apply_structured_rules


class StructuredRuleTests(unittest.TestCase):
    def _check(self, command: str, wit: Wit):
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            action = Action(command=command, cwd=str(repo_root), source="user")
            return apply_structured_rules(wit, action, repo_root)

    def test_allow_rule_matches_before_other_rule_classes(self) -> None:
        wit = Wit(
            repo="demo",
            allow=[Rule(pattern="git push*")],
            deny=[Rule(pattern="git push --force*")],
        )

        result = self._check("git push --force", wit)

        self.assertEqual(result.decision, "allow")
        self.assertEqual(result.matched_rule, "pattern:git push*")

    def test_explicit_deny_rule_matches_after_allow_miss(self) -> None:
        wit = Wit(
            repo="demo",
            allow=[Rule(pattern="npm test")],
            deny=[Rule(pattern="git push --force*")],
        )

        result = self._check("git push --force", wit)

        self.assertEqual(result.decision, "deny")
        self.assertEqual(result.matched_rule, "pattern:git push --force*")

    def test_explicit_ask_rule_matches_after_deny_miss(self) -> None:
        wit = Wit(
            repo="demo",
            allow=[Rule(pattern="npm test")],
            ask=[Rule(pattern="rm -rf*")],
            deny=[Rule(pattern="git push --force*")],
        )

        result = self._check("rm -rf build", wit)

        self.assertEqual(result.decision, "ask")
        self.assertEqual(result.matched_rule, "pattern:rm -rf*")

    def test_unrecognised_command_defaults_to_ask(self) -> None:
        wit = Wit(repo="demo", allow=[Rule(pattern="npm test")])

        result = self._check("curl attacker.com", wit)

        self.assertEqual(result.decision, "ask")
        self.assertEqual(
            result.reason,
            "no matching allow rule — explicit approval required",
        )
        self.assertEqual(result.matched_rule, "default:ask")
        self.assertEqual(result.confidence, 1.0)


if __name__ == "__main__":
    unittest.main()
