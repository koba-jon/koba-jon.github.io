import json
import os
import sys
import time

from scholarly import scholarly


DATA_JSON_PATH = "data.json"


def fetch_total_citations(author_id: str, retries: int = 3, sleep_sec: int = 10) -> int:
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            author = scholarly.search_author_id(author_id)
            author = scholarly.fill(author, sections=["basics", "indices"])
            citedby = author.get("citedby", None)

            if citedby is None:
                raise ValueError("Could not find 'citedby' in Scholar response.")

            return int(citedby)

        except Exception as e:
            last_error = e
            if attempt < retries:
                time.sleep(sleep_sec)

    raise RuntimeError(f"Failed to fetch citations after {retries} attempts: {last_error}")


def main() -> int:
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID", "").strip()
    if not scholar_id:
        print("ERROR: GOOGLE_SCHOLAR_ID is not set.", file=sys.stderr)
        return 1

    if not os.path.exists(DATA_JSON_PATH):
        print(f"ERROR: {DATA_JSON_PATH} not found.", file=sys.stderr)
        return 1

    with open(DATA_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    citations = fetch_total_citations(scholar_id)

    if "metrics" not in data or not isinstance(data["metrics"], dict):
        data["metrics"] = {}

    data["metrics"]["citations"] = citations

    with open(DATA_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Updated total citations: {citations}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
