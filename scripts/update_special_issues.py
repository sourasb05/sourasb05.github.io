#!/usr/bin/env python3
"""Refresh assets/js/special_issues.js with open journal special issues.

Scrapes the public call-for-papers listings below, keeps calls whose title matches
the research topics in KEYWORDS, and drops calls whose deadline has passed.
Hand-picked calls from other publishers live in assets/js/journals.js instead.

Usage:  python3 scripts/update_special_issues.py      (standard library only)
"""
import html
import http.cookiejar
import json
import re
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "js" / "special_issues.js"
UA = "Mozilla/5.0 (compatible; sourasb05-site-bot/1.0; +https://sourasb05.github.io)"

# Topic filters. AI-focused venues need a narrower filter, since every call there is about AI.
CORE = r"federat|edge|\biot\b|internet of things|secur|privacy|intrusion|cybersec|cyber[- ]?attack|attack|forensic|" \
       r"unlearn|poison|continual|decentrali|distributed|tiny ?ai|lightweight"
BROAD = CORE + r"|learning|agentic|\bllms?\b|foundation model|neural"
# Hardware and application topics that match the keywords above but are outside these research areas.
EXCLUDE = r"underwater|antenna|metasurface|optical|in-orbit|satellite|hvac|supply chain"

SECURITY = r"secur|privacy|trust|intrusion|cyber|attack|forensic|unlearn|adversar|poison|threat"
COMM = r"communicat|network|wireless|\b6g\b|sensing|\bisac\b|antenna|spectrum"

COMSOC = "https://www.comsoc.org/publications/"
SOURCES = [
    ("iotj", "IEEE Internet of Things Journal", "https://ieee-iotj.org/special-issues/", BROAD),
    ("comsoc", "IEEE Journal on Selected Areas in Communications", COMSOC + "journals/ieee-jsac/cfp", BROAD),
    ("comsoc", "IEEE Open Journal of the Communications Society", COMSOC + "journals/ieee-ojcoms/cfp", BROAD),
    ("comsoc", "IEEE Transactions on Network and Service Management", COMSOC + "journals/ieee-tnsm/cfp", BROAD),
    ("comsoc", "IEEE Network", COMSOC + "magazines/ieee-network/cfp", BROAD),
    ("comsoc", "IEEE Communications Magazine", COMSOC + "magazines/ieee-communications-magazine/cfp", BROAD),
    ("comsoc", "IEEE Wireless Communications", COMSOC + "magazines/ieee-wireless-communications/cfp", BROAD),
    ("springer", "Discover Artificial Intelligence (Springer)", "https://link.springer.com/journal/44163/collections", CORE),
    ("springer", "Machine Learning (Springer)", "https://link.springer.com/journal/10994/collections", CORE),
]

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with opener.open(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def text(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def parse_date(s):
    """Last date in a string like 'Extended to March 31st, 2027' or '15 December 2026'."""
    found = []
    for m in re.finditer(r"([A-Za-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d\d)", s):
        if m.group(1)[:3].lower() in MONTHS:
            found.append((int(m.group(3)), MONTHS[m.group(1)[:3].lower()], int(m.group(2))))
    for m in re.finditer(r"(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(20\d\d)", s):
        if m.group(2)[:3].lower() in MONTHS:
            found.append((int(m.group(3)), MONTHS[m.group(2)[:3].lower()], int(m.group(1))))
    for m in re.finditer(r"(20\d\d)-(\d\d)-(\d\d)", s):
        found.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
    try:
        return date(*found[-1]) if found else None
    except ValueError:
        return None


def parse_iotj(page, base):
    page = re.sub(r"<!--.*?-->", "", page, flags=re.S)  # old calls are kept in HTML comments
    for li in re.findall(r"<li>(.*?)</li>", page, re.S):
        a = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>', li, re.S)
        dl = re.search(r"Submission Deadline:(.*?)(?:<br|$)", li, re.S | re.I)
        if a and dl:
            yield text(a.group(2)), a.group(1), parse_date(text(dl.group(1)))


def parse_comsoc(page, base):
    for row in re.findall(r'<tr class="table__row">(.*?)</tr>', page, re.S):
        a = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>', row, re.S)
        dl = re.search(r'manuscript-submission-date[^>]*>.*?<time datetime="([0-9-]+)', row, re.S)
        if a and dl:
            yield text(a.group(2)), urllib.request.urljoin(base, a.group(1)), parse_date(dl.group(1))


def parse_springer(page, base):
    for card in re.findall(r'<article class="app-card-collection">(.*?)</article>', page, re.S):
        a = re.search(r'href="(/collections/[^"]+)"[^>]*>(.*?)</a>', card, re.S)
        status = re.search(r"Submission status</dt>\s*<dd>(.*?)</dd>", card, re.S)
        dl = re.search(r"Submission deadline</dt>\s*<dd>(.*?)</dd>", card, re.S)
        if a and dl and status and text(status.group(1)).lower() == "open":
            yield text(a.group(2)), urllib.request.urljoin(base, a.group(1)), parse_date(text(dl.group(1)))


PARSERS = {"iotj": parse_iotj, "comsoc": parse_comsoc, "springer": parse_springer}
# Text every real listing page contains; anything else (a bot check, a redesign) counts as a failed fetch.
MARKERS = {"iotj": "Submission Deadline", "comsoc": "manuscript-submission-date", "springer": "app-card-collection"}


def category(title):
    t = title.lower()
    if re.search(SECURITY, t):
        return "security"
    if re.search(COMM, t):
        return "comm"
    return "ai"


def previous_items():
    """Items from the last run, used when a source cannot be reached this time."""
    try:
        s = OUT.read_text()
        return json.loads(s[s.index("{"):s.rindex("}") + 1])["items"]
    except (OSError, ValueError, KeyError):
        return []


def main():
    today = datetime.now(timezone.utc).date()
    old = previous_items()
    items, seen = [], set()
    for kind, journal, url, keywords in SOURCES:
        try:
            page = fetch(url)
            if MARKERS[kind] not in page:
                title = re.search(r"<title>(.*?)</title>", page, re.S)
                raise ValueError(f"unexpected page ({len(page)} bytes, title: {text(title.group(1)) if title else '-'})")
        except Exception as e:  # one broken source should not stop the others
            kept = [i for i in old if i["journal"] == journal and i["deadline"] >= today.isoformat()]
            print(f"warning: {journal}: {e} (keeping {len(kept)} calls from last run)")
            items += kept
            seen.update(i["link"] for i in kept)
            continue
        n = 0
        for title, link, deadline in PARSERS[kind](page, url):
            if not deadline or deadline < today or link in seen:
                continue
            if not re.search(keywords, title.lower()) or re.search(EXCLUDE, title.lower()):
                continue
            seen.add(link)
            items.append({
                "title": title,
                "journal": journal,
                "deadline": deadline.isoformat(),
                "category": category(title),
                "link": link,
            })
            n += 1
        print(f"{journal}: {n} open calls")

    items.sort(key=lambda i: i["deadline"])
    payload = {"updated": today.isoformat(), "items": items}
    OUT.write_text(
        "/* Generated by scripts/update_special_issues.py — do not edit by hand.\n"
        " * Add hand-picked calls to assets/js/journals.js instead. */\n"
        "window.SPECIAL_ISSUES = " + json.dumps(payload, indent=1, ensure_ascii=False) + ";\n"
    )
    print(f"wrote {len(items)} special issues to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
