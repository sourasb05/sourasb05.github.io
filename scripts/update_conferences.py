#!/usr/bin/env python3
"""Refresh assets/js/conferences.js with upcoming conferences.

Data comes from the community-maintained ccf-deadlines repository
(https://github.com/ccfddl/ccf-deadlines), merged with hand-maintained
entries in data/conferences_extra.yml.

Usage:  python3 scripts/update_conferences.py      (requires PyYAML)
"""
import io
import json
import re
import tarfile
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "js" / "conferences.js"
EXTRA = ROOT / "data" / "conferences_extra.yml"
SOURCE = "https://codeload.github.com/ccfddl/ccf-deadlines/tar.gz/refs/heads/main"

# Which ccf-deadlines files to include, by category on the page.
SELECTED = {
    "ai": [
        "AI/aaai", "AI/ijcai", "AI/nips", "AI/icml", "AI/iclr", "AI/aistats", "AI/uai",
        "AI/cvpr", "AI/iccv", "AI/eccv", "AI/wacv", "AI/acl", "AI/emnlp", "AI/naacl",
        "AI/ecai", "AI/iconip", "AI/ijcnn", "DB/sigkdd", "MX/www", "MX/mlsys",
    ],
    "security": [
        "SC/sp", "SC/ccs", "SC/uss", "SC/ndss", "SC/eurosp", "SC/raid", "SC/acsac",
        "SC/asiaccs", "SC/esorics", "SC/dsn", "SC/wisec", "SC/pets", "SC/satml",
        "SC/cns", "SC/securecomm", "SC/trustcom", "SC/dimva", "SC/acns",
        "NW/sensys", "NW/ipsn", "NW/mobisys", "HI/percom",
    ],
    "comm": [
        "NW/infocom", "NW/sigcomm", "NW/mobicom", "NW/nsdi", "NW/icc", "NW/globecom",
        "NW/wcnc", "NW/conext", "NW/mobihoc", "NW/secon", "NW/iwqos", "NW/lcn",
        "NW/icnp", "NW/networking", "NW/wowmom", "NW/icccn", "NW/mswim", "NW/imc",
        "SC/noms",
    ],
}

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def tz_offset(tz):
    """'AoE' -> -12h, 'UTC-8' -> -8h, 'UTC+5:30' -> +5.5h."""
    tz = (tz or "AoE").strip()
    if tz.upper() == "AOE":
        return timedelta(hours=-12)
    m = re.match(r"UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$", tz, re.I)
    if not m:
        return timedelta(0)
    sign = 1 if m.group(1) == "+" else -1
    return sign * timedelta(hours=int(m.group(2)), minutes=int(m.group(3) or 0))


def to_utc(value, tz):
    """Deadline string in the given timezone -> aware UTC datetime, or None."""
    if not value or str(value).strip().upper() in ("TBA", "TBD"):
        return None
    try:
        local = datetime.strptime(str(value).strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None
    return (local - tz_offset(tz)).replace(tzinfo=timezone.utc)


def event_end(date_str, year):
    """Best-effort end date of the event from strings like 'June 30 - July 4, 2026'."""
    s = str(date_str or "")
    years = re.findall(r"\b(20\d\d)\b", s)
    y = int(years[-1]) if years else int(year)
    month, day = None, None
    for tok in re.findall(r"[A-Za-z]+|\d+", s):
        key = tok[:3].lower()
        if key in MONTHS:
            month, day = MONTHS[key], None
        elif tok.isdigit() and len(tok) <= 2 and month:
            day = int(tok)
    if not month:
        return datetime(y, 12, 31, tzinfo=timezone.utc)
    if not day:  # month only -> end of that month
        nxt = datetime(y + (month == 12), month % 12 + 1, 1, tzinfo=timezone.utc)
        return nxt - timedelta(days=1)
    try:
        return datetime(y, month, day, tzinfo=timezone.utc)
    except ValueError:
        return datetime(y, month, 28, tzinfo=timezone.utc)


def load_ccf():
    with urllib.request.urlopen(SOURCE, timeout=60) as r:
        data = r.read()
    files = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for m in tar.getmembers():
            parts = m.name.split("/")
            if len(parts) == 4 and parts[1] == "conference" and parts[3].endswith(".yml"):
                files[f"{parts[2]}/{parts[3][:-4]}"] = tar.extractfile(m).read().decode("utf-8")
    return files


def build_items(series, category, now, source):
    items = []
    for conf in series.get("confs") or []:
        end = event_end(conf.get("date"), conf.get("year"))
        if end + timedelta(days=1) < now:
            continue  # event already over
        tz = conf.get("timezone", "AoE")
        deadlines, abstracts, tba = [], [], False
        for t in conf.get("timeline") or []:
            d = to_utc(t.get("deadline"), tz)
            if d:
                deadlines.append(d)
            else:
                tba = True
            a = to_utc(t.get("abstract_deadline"), tz)
            if a:
                abstracts.append(a)
        upcoming = sorted(d for d in deadlines if d >= now)
        nxt = upcoming[0] if upcoming else (max(deadlines) if deadlines else None)
        abs_up = sorted(a for a in abstracts if a >= now and (not nxt or a <= nxt))
        rank = series.get("rank") or {}
        items.append({
            "name": series.get("title"),
            "full": series.get("description", ""),
            "category": category,
            "year": conf.get("year"),
            "link": conf.get("link", ""),
            "deadline": nxt.strftime("%Y-%m-%dT%H:%M:%SZ") if nxt else None,
            "abstract": abs_up[0].strftime("%Y-%m-%dT%H:%M:%SZ") if abs_up else None,
            "tz": tz,
            # TBA deadline counts as open only if the event is still months away.
            "open": bool(upcoming) or (tba and not deadlines and end > now + timedelta(days=90)),
            "date": conf.get("date", ""),
            "place": conf.get("place", ""),
            "core": rank.get("core") if rank.get("core") not in (None, "N") else None,
            "note": conf.get("note", ""),
            "source": source,
        })
    return items


def main():
    now = datetime.now(timezone.utc)
    files = load_ccf()
    items = []
    for category, keys in SELECTED.items():
        for key in keys:
            if key not in files:
                print(f"warning: {key} not found in ccf-deadlines")
                continue
            for series in yaml.safe_load(files[key]) or []:
                items += build_items(series, category, now, "ccf-deadlines")
    for series in yaml.safe_load(EXTRA.read_text()) or []:
        items += build_items(series, series["category"], now, "manual")

    payload = {"updated": now.strftime("%Y-%m-%d"), "items": items}
    OUT.write_text(
        "/* Generated by scripts/update_conferences.py — do not edit by hand.\n"
        " * Sources: https://github.com/ccfddl/ccf-deadlines and data/conferences_extra.yml */\n"
        "window.CONFERENCES = " + json.dumps(payload, indent=1, ensure_ascii=False) + ";\n"
    )
    print(f"wrote {len(items)} conferences to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
