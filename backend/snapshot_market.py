"""
Market snapshot job (run hourly by .github/workflows/market.yml).

Writes the same JSON the live /market endpoints return, so the deployed
dashboard can serve it as static files:

    <out>/market.json            — quotes for every instrument
    <out>/history-<RANGE>.json   — daily closes for 1M, 3M, 6M, 1Y, 5Y

Only needs yfinance, pandas and fastapi (no TensorFlow).
Usage:  python snapshot_market.py --out ../data-out
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from market import RANGE_TO_PERIOD, _build_history, _build_quotes


def _write(out: str, name: str, payload: dict) -> None:
    payload = {**payload, "source": "snapshot"}
    path = os.path.join(out, name)
    with open(path, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"[SNAPSHOT] Wrote {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", required=True, help="Directory to write the JSON files into")
    args = parser.parse_args()
    os.makedirs(args.out, exist_ok=True)

    quotes = _build_quotes()
    if len(quotes["quotes"]) < 2:
        # Yahoo returned (almost) nothing, likely a rate limit. Keep the
        # previous snapshot rather than overwrite it with an empty one.
        print(f"[SNAPSHOT] Only {len(quotes['quotes'])} quotes returned; keeping previous files.")
        return 1
    _write(args.out, "market.json", quotes)

    failed = []
    for range_key in RANGE_TO_PERIOD:
        try:
            _write(args.out, f"history-{range_key}.json", _build_history(range_key))
        except Exception as exc:
            failed.append(range_key)
            print(f"[SNAPSHOT] history {range_key} failed: {exc}")
    return 0 if not failed else 2


if __name__ == "__main__":
    sys.exit(main())
