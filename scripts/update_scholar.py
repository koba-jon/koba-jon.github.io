import json
import os
import sys
import requests

METRICS_JSON_PATH = "data/metrics.json"


def fetch_total_citations(author_id: str, api_key: str) -> int:
    print("Fetching via SerpAPI...", flush=True)
    params = {
        "engine": "google_scholar_author",
        "author_id": author_id,
        "api_key": api_key,
    }
    r = requests.get("https://serpapi.com/search", params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    citations = data["cited_by"]["table"][0]["citations"]["all"]
    print(f"Citations: {citations}", flush=True)
    return int(citations)


def main() -> int:
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID", "").strip()
    api_key    = os.environ.get("SERPAPI_KEY", "").strip()

    if not scholar_id:
        print("ERROR: GOOGLE_SCHOLAR_ID is not set.", file=sys.stderr)
        return 1
    if not api_key:
        print("ERROR: SERPAPI_KEY is not set.", file=sys.stderr)
        return 1
    if not os.path.exists(METRICS_JSON_PATH):
        print(f"ERROR: {METRICS_JSON_PATH} not found.", file=sys.stderr)
        return 1

    with open(METRICS_JSON_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    try:
        citations = fetch_total_citations(scholar_id, api_key)
        metrics["citations"] = citations
        with open(METRICS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(metrics, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Updated citations: {citations}", flush=True)
    except Exception as e:
        print(f"WARNING: {e}", flush=True)
        print("Keeping previous citation count.", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
