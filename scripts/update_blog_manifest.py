#!/usr/bin/env python3
"""Generate data/posts.json from markdown files in blog/."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "blog"
MANIFEST_PATH = ROOT / "data" / "posts.json"


def latest_commit_iso8601(path: Path) -> str | None:
    rel = path.relative_to(ROOT)
    result = subprocess.run(
        [
            "git",
            "log",
            "-1",
            "--format=%cI",
            "--",
            str(rel),
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    iso = result.stdout.strip()
    if not iso:
        return None

    parsed = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def load_existing_manifest() -> dict[str, str]:
    if not MANIFEST_PATH.exists():
        return {}

    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    if not isinstance(data, list):
        return {}

    existing: dict[str, str] = {}
    for entry in data:
        if not isinstance(entry, dict):
            continue
        path = entry.get("path")
        updated_at = entry.get("updatedAt")
        if isinstance(path, str) and isinstance(updated_at, str):
            existing[path] = updated_at

    return existing


def main() -> None:
    existing_manifest = load_existing_manifest()
    entries = []
    for md_file in sorted(BLOG_DIR.rglob("*.md")):
        rel_path = md_file.relative_to(ROOT).as_posix()
        # Keep previously recorded timestamps stable so adding a new post
        # does not rewrite `updatedAt` for existing posts.
        updated_at = existing_manifest.get(rel_path)
        if not updated_at:
            updated_at = latest_commit_iso8601(md_file)
        if not updated_at:
            updated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        entries.append(
            {
                "path": rel_path,
                "updatedAt": updated_at,
            }
        )

    entries.sort(
        key=lambda item: (
            item["updatedAt"],
            item["path"],
        ),
        reverse=True,
    )

    MANIFEST_PATH.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

if __name__ == "__main__":
    main()
