#!/usr/bin/env python3
"""Generate blog/posts.json from markdown files in blog/."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "blog"
MANIFEST_PATH = BLOG_DIR / "posts.json"


def latest_commit_iso8601(path: Path) -> str:
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
    if iso:
        parsed = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def main() -> None:
    entries = []
    for md_file in sorted(BLOG_DIR.rglob("*.md")):
        rel_path = md_file.relative_to(ROOT).as_posix()
        entries.append(
            {
                "path": rel_path,
                "updatedAt": latest_commit_iso8601(md_file),
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
