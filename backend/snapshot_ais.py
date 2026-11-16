"""
Live tanker positions from AIS (run hourly by .github/workflows/market.yml).

Listens to aisstream.io's free WebSocket feed for a few minutes in boxes
around the main oil chokepoints and lanes, keeps only tankers (AIS ship types
80–89), and writes their latest positions to <out>/tankers.json:

    {"fetched_at": "...", "vessels": [{"mmsi", "name", "lat", "lng", "sog",
      "cog", "destination", "ship_type", "time"}, ...]}

Needs a free API key from https://aisstream.io (sign in with GitHub) in the
AISSTREAM_API_KEY environment variable; without one it exits quietly.

Usage:  python snapshot_ais.py --out ../data-out [--seconds 180]
"""

import argparse
import asyncio
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

AIS_URL = "wss://stream.aisstream.io/v0/stream"

# [[lat_min, lon_min], [lat_max, lon_max]] boxes where tanker traffic concentrates
# and terrestrial AIS coverage is good.
BOXES = {
    "Persian Gulf & Hormuz": [[23.0, 47.5], [30.5, 58.5]],
    "Gulf of Oman": [[21.5, 56.5], [26.0, 61.0]],
    "Red Sea & Bab el-Mandeb": [[11.5, 32.0], [30.0, 44.5]],
    "Suez & East Med": [[30.0, 28.0], [35.5, 35.5]],
    "Malacca & Singapore": [[-1.0, 95.0], [7.0, 105.0]],
    "South China coast": [[20.0, 110.0], [32.0, 123.0]],
    "Korea & Japan": [[32.0, 126.0], [37.0, 141.0]],
    "North Sea & Channel": [[49.0, -6.0], [58.0, 9.0]],
    "US Gulf Coast": [[25.0, -98.0], [30.5, -87.0]],
    "Gulf of Guinea": [[0.0, 2.0], [7.0, 9.0]],
}

TANKER_TYPES = range(80, 90)


def parse_messages(messages: list[dict]) -> list[dict]:
    """Combine position reports and static data into one record per tanker."""
    positions: dict[int, dict] = {}
    static: dict[int, dict] = {}

    for msg in messages:
        kind = msg.get("MessageType")
        meta = msg.get("MetaData") or {}
        body = (msg.get("Message") or {}).get(kind) or {}
        mmsi = meta.get("MMSI") or body.get("UserID")
        if not mmsi:
            continue

        if kind == "ShipStaticData":
            static[mmsi] = {
                "ship_type": body.get("Type"),
                "destination": (body.get("Destination") or "").strip(),
                "name": (body.get("Name") or meta.get("ShipName") or "").strip(),
            }
        elif kind == "PositionReport":
            lat, lng = meta.get("latitude", body.get("Latitude")), meta.get("longitude", body.get("Longitude"))
            if lat is None or lng is None or not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            sog = body.get("Sog")
            cog = body.get("Cog")
            positions[mmsi] = {
                "mmsi": mmsi,
                "name": (meta.get("ShipName") or "").strip(),
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                # 102.3 kn / 360° are AIS "not available" values
                "sog": round(sog, 1) if sog is not None and sog < 102.2 else None,
                "cog": round(cog, 1) if cog is not None and cog < 360 else None,
                "time": _iso(meta.get("time_utc")),
            }

    vessels = []
    for mmsi, pos in positions.items():
        info = static.get(mmsi)
        if not info or info["ship_type"] not in TANKER_TYPES:
            continue
        vessels.append({**pos, "name": info["name"] or pos["name"], "destination": info["destination"], "ship_type": info["ship_type"]})
    return sorted(vessels, key=lambda v: v["mmsi"])


def _iso(value) -> str:
    # aisstream sends e.g. "2026-11-16 09:12:33.123456789 +0000 UTC"
    if not value:
        return datetime.now(timezone.utc).isoformat()
    try:
        date, clock = str(value).split(" ")[:2]
        return f"{date}T{clock[:15].rstrip('.')}+00:00"
    except ValueError:
        return datetime.now(timezone.utc).isoformat()


async def collect(api_key: str, seconds: int) -> list[dict]:
    import websockets

    messages: list[dict] = []
    subscribe = {
        "APIKey": api_key,
        "BoundingBoxes": list(BOXES.values()),
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
    }
    deadline = time.monotonic() + seconds
    async with websockets.connect(AIS_URL, open_timeout=20, max_size=2**22) as ws:
        await ws.send(json.dumps(subscribe))
        while (remaining := deadline - time.monotonic()) > 0:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
            except asyncio.TimeoutError:
                break
            data = json.loads(raw)
            if "error" in data:
                raise RuntimeError(f"aisstream.io error: {data['error']}")
            messages.append(data)
    return messages


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", required=True, help="Directory to write tankers.json into")
    parser.add_argument("--seconds", type=int, default=180, help="How long to listen (default 180)")
    args = parser.parse_args()

    api_key = os.getenv("AISSTREAM_API_KEY", "").strip()
    if not api_key:
        print("[AIS] AISSTREAM_API_KEY not set; skipping live tanker snapshot.")
        return 0

    messages = asyncio.run(collect(api_key, args.seconds))
    vessels = parse_messages(messages)
    print(f"[AIS] {len(messages)} messages → {len(vessels)} tankers")
    if not vessels:
        print("[AIS] No tankers identified; keeping the previous snapshot.")
        return 1

    os.makedirs(args.out, exist_ok=True)
    path = os.path.join(args.out, "tankers.json")
    with open(path, "w") as f:
        json.dump({"fetched_at": datetime.now(timezone.utc).isoformat(), "vessels": vessels}, f, separators=(",", ":"))
    print(f"[AIS] Wrote {path}")

    # Keep a copy where the local FastAPI /market/tankers endpoint looks for it.
    from config import CACHE_DIR

    shutil.copy(path, os.path.join(CACHE_DIR, "tankers.json"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
