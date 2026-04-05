#!/usr/bin/env python3
"""Generate blog/posts.json from markdown files in blog/."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "blog"
MANIFEST_PATH = BLOG_DIR / "posts.json"
REDIRECT_MARKER = "<!-- AUTO-GENERATED BLOG REDIRECT -->"


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

    generated_redirect_paths = set()
    for item in entries:
        slug = Path(item["path"]).relative_to("blog").with_suffix("").as_posix()
        encoded_slug = quote(slug, safe="/-_~.")
        redirect_path = BLOG_DIR / f"{slug}.html"
        generated_redirect_paths.add(redirect_path.resolve())
        redirect_path.parent.mkdir(parents=True, exist_ok=True)
        redirect_path.write_text(
            "\n".join(
                [
                    "<!DOCTYPE html>",
                    "<html lang=\"en\">",
                    "<head>",
                    "  <meta charset=\"UTF-8\">",
                    f"  {REDIRECT_MARKER}",
                    "  <meta http-equiv=\"refresh\" content=\"0; url=post.html?slug="
                    f"{encoded_slug}\">",
                    "  <title>Redirecting…</title>",
                    "</head>",
                    "<body>",
                    "  <p>Redirecting to the blog post… "
                    f"<a href=\"post.html?slug={encoded_slug}\">Continue</a></p>",
                    "</body>",
                    "</html>",
                    "",
                ]
            ),
            encoding="utf-8",
        )

    for html_file in BLOG_DIR.rglob("*.html"):
        if html_file.name == "post.html":
            continue
        if html_file.resolve() in generated_redirect_paths:
            continue
        try:
            content = html_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if REDIRECT_MARKER in content:
            html_file.unlink()


if __name__ == "__main__":
    main()
