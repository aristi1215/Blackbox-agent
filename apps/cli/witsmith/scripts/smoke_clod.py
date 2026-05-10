"""Smoke-test the CLōD route end-to-end.

Run on the user's Mac:
    uv run python scripts/smoke_clod.py

Pass = a one-line greeting from the configured model via api.clod.io.

Uses `WITSMITH_SMOKE_MODEL` when set (loaded via `.env`), otherwise `WITSMITH_MODEL`.
Prefer a CLōD free-tier model here so the daily free-request bucket applies;
reasoning/premium IDs may return 403 when wallet is $0 or team quota is exhausted.
"""

from __future__ import annotations

import os
import sys

from witsmith.clod import client, model


def main() -> int:
    try:
        c = client()
        m = os.environ.get("WITSMITH_SMOKE_MODEL") or model()
    except Exception as e:
        print(f"[FAIL] could not build client: {e}")
        return 1

    print(f"[ok] client built, base_url={c.base_url}, model={m}")

    try:
        resp = c.chat.completions.create(
            model=m,
            max_tokens=64,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Reply with exactly: 'witsmith smoke test ok'. "
                        "No quotes, no extra words."
                    ),
                }
            ],
        )
    except Exception as e:
        print(f"[FAIL] CLōD request errored: {e}")
        return 2

    text = (resp.choices[0].message.content or "").strip()
    print(f"[response] {text!r}")
    if resp.usage:
        print(
            f"[usage] in={resp.usage.prompt_tokens} "
            f"out={resp.usage.completion_tokens} "
            f"total={resp.usage.total_tokens}"
        )

    if "witsmith smoke test ok" in text.lower():
        print("[PASS] CLōD round-trip succeeded.")
        return 0
    print("[WARN] response didn't match expected string but the route is alive.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
