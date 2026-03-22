import json
import os
import sys

from scholarly import scholarly

DATA_JSON_PATH = "data.json"


def fetch_total_citations(author_id: str) -> int:
    print("Start fetching author...", flush=True)
    author = scholarly.search_author_id(author_id)
    author = scholarly.fill(author)
    print("Author fetched.", flush=True)

    citedby = author.get("citedby", None)
    print(f"citedby raw value: {citedby}", flush=True)

    if citedby is None:
        raise ValueError("Could not find 'citedby' in Scholar response.")

    return int(citedby)


def main() -> int:
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID", "").strip()
    if not scholar_id:
        print("ERROR: GOOGLE_SCHOLAR_ID is not set.", file=sys.stderr, flush=True)
        return 1

    if not os.path.exists(DATA_JSON_PATH):
        print(f"ERROR: {DATA_JSON_PATH} not found.", file=sys.stderr, flush=True)
        return 1

    print("Loading data.json...", flush=True)
    with open(DATA_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    try:
        citations = fetch_total_citations(scholar_id)
        if "metrics" not in data or not isinstance(data["metrics"], dict):
            data["metrics"] = {}
        data["metrics"]["citations"] = citations

        print("Writing updated data.json...", flush=True)
        with open(DATA_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

        print(f"Updated total citations: {citations}", flush=True)

    except Exception as e:
        print(f"WARNING: failed to fetch citations: {e}", flush=True)
        print("Keeping previous citation count.", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
