/* Tabs on conferences.html, plus the Special issues and Journals panels (data in journals.js). */
document.addEventListener("DOMContentLoaded", function () {
  var data = window.JOURNALS;
  var siEl = document.getElementById("si-list");
  var jrEl = document.getElementById("jr-list");
  if (!data || !siEl || !jrEl) return;

  var LABELS = { ai: "AI & ML", security: "IoT & Cyber Security", comm: "Communications & Networking" };
  var PLACEHOLDER = {
    conferences: "Search conference or city…",
    "special-issues": "Search topic or journal…",
    journals: "Search journal or publisher…"
  };
  var state = { cat: "", q: "" };
  var now = new Date();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // "YYYY-MM-DD" -> end of that day, Anywhere on Earth (UTC-12).
  function deadlineOf(day) {
    return new Date(day + "T23:59:59-12:00");
  }

  function countdown(d) {
    var days = Math.floor((d - now) / 86400000);
    if (days >= 1) return days + (days === 1 ? " day left" : " days left");
    var hours = Math.max(0, Math.floor((d - now) / 3600000));
    return hours + (hours === 1 ? " hour left" : " hours left");
  }

  function urgency(d) {
    var days = (d - now) / 86400000;
    return days <= 14 ? "soon" : days <= 45 ? "near" : "far";
  }

  function matches(cat, text) {
    if (state.cat && cat !== state.cat) return false;
    return !state.q || text.toLowerCase().indexOf(state.q) >= 0;
  }

  // Hand-picked calls plus the ones collected weekly by scripts/update_special_issues.py.
  var auto = window.SPECIAL_ISSUES || { items: [] };
  var seen = {};
  var openIssues = data.specialIssues.concat(auto.items)
    .filter(function (s) { return seen[s.link] ? false : (seen[s.link] = true); })
    .map(function (s) { return Object.assign({ due: deadlineOf(s.deadline) }, s); })
    .filter(function (s) { return s.due > now; })
    .sort(function (a, b) { return a.due - b.due; });

  function issueCard(s) {
    // Show the calendar date as published in the call, not shifted into the viewer's time zone.
    var date = new Date(s.deadline + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return '<div class="card conf-card" data-cat="' + esc(s.category) + '">' +
      '<div class="conf-top">' +
        '<div class="conf-title"><h3><a href="' + esc(s.link) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a></h3>" +
          '<div class="conf-full">' + esc(s.journal) + "</div></div>" +
        '<div class="conf-badges"><span class="conf-cat" data-cat="' + esc(s.category) + '">' + LABELS[s.category] + "</span></div>" +
      "</div>" +
      '<div class="conf-deadline ' + urgency(s.due) + '">' +
        '<span class="conf-count">' + countdown(s.due) + "</span>" +
        '<span class="conf-dl-date">Submission deadline: ' + date + ' <span class="meta">(AoE)</span></span>' +
      "</div>" +
      '<a class="si-link" href="' + esc(s.link) + '" target="_blank" rel="noopener">Call for papers ↗</a>' +
      "</div>";
  }

  function journalCard(j) {
    var title = esc(j.name) + (j.short ? ' <span class="jr-short">' + esc(j.short) + "</span>" : "");
    return '<div class="card conf-card jr-card" data-cat="' + esc(j.category) + '">' +
      '<div class="conf-top">' +
        '<div class="conf-title"><h3><a href="' + esc(j.link) + '" target="_blank" rel="noopener">' + title + "</a></h3>" +
          '<div class="conf-full">' + esc(j.publisher) + " &middot; " + esc(j.access) + "</div></div>" +
        '<div class="jr-if" title="Journal Impact Factor (JCR 2026 release)">' +
          '<span class="jr-if-num">' + (j.impact == null ? "&mdash;" : j.impact.toFixed(1)) + "</span>" +
          '<span class="jr-if-label">IF</span></div>' +
      "</div>" +
      '<div class="jr-badges">' +
        '<span class="conf-cat" data-cat="' + esc(j.category) + '">' + LABELS[j.category] + "</span>" +
        '<span class="jr-q" data-q="' + esc(j.quartile) + '" title="Best SCImago quartile (SJR 2025)">' + esc(j.quartile) + "</span>" +
        j.index.map(function (i) { return '<span class="jr-idx">' + esc(i) + "</span>"; }).join("") +
      "</div>" +
      "</div>";
  }

  function render() {
    var issues = openIssues.filter(function (s) { return matches(s.category, s.title + " " + s.journal); });
    siEl.innerHTML = issues.length ? issues.map(issueCard).join("")
      : '<p class="meta">No open special issues match your filter.</p>';
    document.getElementById("si-count").textContent = issues.length;

    var journals = data.journals
      .filter(function (j) { return matches(j.category, j.name + " " + j.short + " " + j.publisher); })
      .sort(function (a, b) { return (b.impact || 0) - (a.impact || 0); });
    jrEl.innerHTML = journals.length ? journals.map(journalCard).join("")
      : '<p class="meta">No journals match your filter.</p>';
    document.getElementById("jr-count").textContent = journals.length;
  }

  // Share the category chips and search box with the conference list.
  document.getElementById("conf-filters").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    state.cat = btn.getAttribute("data-filter");
    render();
  });
  var search = document.getElementById("conf-search");
  search.addEventListener("input", function () {
    state.q = search.value.trim().toLowerCase();
    render();
  });

  // Tabs, with the active one kept in the URL hash (#special-issues, #journals).
  var tabs = document.querySelectorAll(".cfp-tab");
  function show(name, push) {
    if (!PLACEHOLDER[name]) name = "conferences";
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-tab") === name ? "true" : "false"); });
    document.querySelectorAll(".cfp-panel").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
    search.placeholder = PLACEHOLDER[name];
    if (push) history.replaceState(null, "", name === "conferences" ? location.pathname : "#" + name);
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { show(t.getAttribute("data-tab"), true); });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1), false); });
  show(location.hash.slice(1), false);

  // "Look up any journal": searches OpenAlex (free, no key) from the visitor's browser.
  var lookupForm = document.getElementById("jr-lookup-form");
  var lookupOut = document.getElementById("jr-lookup-results");
  var curated = {};
  data.journals.forEach(function (j) { curated[j.name.toLowerCase()] = j; });
  var pending = null;

  function lookupCard(r) {
    var stats = r.summary_stats || {};
    var issn = r.issn_l || (r.issn && r.issn[0]) || "";
    var mine = curated[(r.display_name || "").toLowerCase()];
    var meta = [r.host_organization_name, issn && "ISSN " + issn, r.is_in_doaj ? "Open access (DOAJ)" : r.is_oa ? "Open access" : ""]
      .filter(Boolean).map(esc).join(" &middot; ");
    var links = [];
    if (issn) {
      links.push('<a href="https://mjl.clarivate.com/search-results?issn=' + encodeURIComponent(issn) + '" target="_blank" rel="noopener">Web of Science ↗</a>');
      links.push('<a href="https://www.scimagojr.com/journalsearch.php?q=' + encodeURIComponent(issn) + '" target="_blank" rel="noopener">SCImago ↗</a>');
    }
    if (r.homepage_url) links.push('<a href="' + esc(r.homepage_url) + '" target="_blank" rel="noopener">Homepage ↗</a>');
    // Quartile from the SCImago lookup, matched on any of the journal's ISSNs.
    var rank = null;
    if (sjr) {
      (r.issn || [issn]).concat(issn).some(function (i) {
        var k = sjr.issn[String(i || "").replace("-", "").toUpperCase()];
        if (k != null) rank = sjr.j[k];
        return k != null;
      });
    }
    var q = rank ? "Q" + rank[0] : mine ? mine.quartile : "";
    var impact = mine && mine.impact != null
      ? '<div><b>' + mine.impact.toFixed(1) + "</b><span>impact factor</span></div>"
      : '<div title="Official impact factors are published only in Clarivate\'s subscription Journal Citation Reports. Use the Web of Science link to check."><b class="jr-na">n/a</b><span>impact factor</span></div>';
    var quart = q
      ? '<div><b><span class="jr-q" data-q="' + q + '">' + q + "</span></b><span>" +
        (rank && rank[1] != null ? "SJR " + rank[1].toFixed(2) : "SCImago") + "</span></div>"
      : '<div title="' + (sjr ? "Not ranked by SCImago (not indexed in Scopus)" : "Quartile data unavailable") +
        '"><b class="jr-na">&mdash;</b><span>quartile</span></div>';
    return '<div class="jr-hit">' +
      '<div class="jr-hit-main">' +
        "<h4>" + esc(r.display_name) + (mine ? ' <span class="jr-idx">Recommended</span>' : "") + "</h4>" +
        '<div class="meta">' + meta + "</div>" +
        '<div class="jr-hit-links">' + links.join("") + "</div>" +
      "</div>" +
      '<div class="jr-hit-stats">' + impact + quart +
        '<div><b>' + (stats["2yr_mean_citedness"] != null ? stats["2yr_mean_citedness"].toFixed(1) : "&mdash;") + "</b><span>cites / paper</span></div>" +
        '<div><b>' + (stats.h_index != null ? stats.h_index : "&mdash;") + "</b><span>h-index</span></div>" +
      "</div>" +
      "</div>";
  }

  // SCImago quartiles (assets/data/sjr.json, built by scripts/build_sjr_lookup.py), loaded on first search.
  var sjr = null, sjrLoad = null;
  function loadSjr() {
    if (!sjrLoad) {
      sjrLoad = fetch("assets/data/sjr.json")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { sjr = d; })
        .catch(function () {});
    }
    return sjrLoad;
  }

  if (lookupForm) {
    lookupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("jr-lookup-q").value.trim();
      if (q.length < 2) return;
      if (pending) pending.abort();
      pending = window.AbortController ? new AbortController() : null;
      var issn = q.match(/^(\d{4})-?(\d{3}[\dXx])$/);
      var url = "https://api.openalex.org/sources?per_page=8" +
        "&select=display_name,host_organization_name,issn_l,issn,summary_stats,is_oa,is_in_doaj,homepage_url" +
        (issn ? "&filter=issn:" + issn[1] + "-" + issn[2].toUpperCase()
              : "&filter=type:journal&search=" + encodeURIComponent(q));
      lookupOut.innerHTML = '<p class="meta">Searching…</p>';
      Promise.all([
        fetch(url, pending ? { signal: pending.signal } : undefined).then(function (r) {
          if (!r.ok) throw new Error(r.status === 429 ? "Daily lookup limit reached — try again tomorrow." : "Search failed.");
          return r.json();
        }),
        loadSjr()
      ])
        .then(function (res) {
          var hits = (res[0].results || []).filter(function (r) { return r.display_name; });
          lookupOut.innerHTML = hits.length
            ? hits.map(lookupCard).join("") +
              '<p class="meta jr-hit-note">Impact factor is shown for the recommended journals below; for others, check Web of Science. ' +
              "Quartile: best SCImago quartile" + (sjr && sjr.year ? " (SJR " + esc(sjr.year) + ")" : "") + ". " +
              "Cites / paper: OpenAlex&rsquo;s two-year mean citedness, similar to but not the same as the impact factor.</p>"
            : '<p class="meta">No journals found for &ldquo;' + esc(q) + "&rdquo;.</p>";
        })
        .catch(function (err) {
          if (err.name === "AbortError") return;
          lookupOut.innerHTML = '<p class="meta">' + esc(err.message || "Search failed.") + "</p>";
        });
    });
  }

  document.querySelectorAll(".jr-updated").forEach(function (el) { el.textContent = data.updated; });
  var siUpdated = document.getElementById("si-updated");
  if (siUpdated) siUpdated.textContent = auto.updated || data.updated;
  var setStat = function (id, n) { var el = document.getElementById(id); if (el) el.textContent = n; };
  setStat("si-stat-open", openIssues.length);
  setStat("jr-stat-total", data.journals.length);
  render();
});
