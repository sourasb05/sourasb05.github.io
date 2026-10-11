#!/usr/bin/env python3
"""Build assets/data/sjr.json, the quartile lookup used by "Look up any journal".

Input: the full SCImago Journal Rank export. Download it once a year (new data
appears around April/May) from https://www.scimagojr.com/journalrank.php with the
"Download data" button and save it as data/scimagojr.csv. SCImago blocks scripts,
so this step has to be done in a browser.

Usage:  python3 scripts/build_sjr_lookup.py [path/to/scimagojr.csv]

Output: "j" is a list of [best quartile 1-4, SJR, h-index] per journal, and "issn" maps every
ISSN (digits only, e.g. "23274662") to its index in "j". Kept compact because the page loads it.
Data © SCImago Journal & Country Rank, used with attribution.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "scimagojr.csv"
OUT = ROOT / "assets" / "data" / "sjr.json"


def number(s):
    try:
        return float(str(s).replace(",", "."))
    except ValueError:
        return None


def main():
    text = SRC.read_text(encoding="utf-8-sig")
    rows = csv.DictReader(text.splitlines(), delimiter=";")
    # The file name carries the year, e.g. "scimagojr 2025.csv"; otherwise use the "Total Docs. (YYYY)" column.
    year = re.search(r"(20\d\d)", SRC.name) or re.search(r"Total Docs\. \((20\d\d)\)", text.splitlines()[0])
    journals, issns = [], {}
    for r in rows:
        if (r.get("Type") or "").strip().lower() != "journal":
            continue
        quartile = (r.get("SJR Best Quartile") or r.get("SJR Quartile") or "").strip()
        if quartile not in ("Q1", "Q2", "Q3", "Q4"):
            continue
        sjr = number(r.get("SJR"))
        h = number(r.get("H index"))
        journals.append([int(quartile[1]), round(sjr, 3) if sjr is not None else None, int(h) if h is not None else None])
        for issn in re.findall(r"[0-9]{7}[0-9Xx]", r.get("Issn") or ""):
            issns[issn.upper()] = len(journals) - 1
    payload = {"year": year.group(1) if year else "", "source": "SCImago Journal & Country Rank", "j": journals, "issn": issns}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {len(journals)} journals, {len(issns)} ISSNs ({OUT.stat().st_size // 1024} KB) to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
