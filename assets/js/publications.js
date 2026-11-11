/* Filter and search on publications.html. */
document.addEventListener("DOMContentLoaded", function () {
  var filters = document.getElementById("pub-filters");
  var search = document.getElementById("pub-search");
  if (!filters || !search) return;
  var state = { type: "", q: "" };

  function apply() {
    var any = false;
    document.querySelectorAll(".pub-section").forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll(".pub-card").forEach(function (card) {
        var ok = (!state.type || card.getAttribute("data-type") === state.type) &&
          (!state.q || card.getAttribute("data-search").indexOf(state.q) >= 0);
        card.hidden = !ok;
        if (ok) shown++;
      });
      sec.hidden = shown === 0;
      if (shown) any = true;
    });
    document.getElementById("pub-empty").hidden = any;
  }

  filters.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    filters.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    state.type = btn.getAttribute("data-filter");
    apply();
  });
  search.addEventListener("input", function () {
    state.q = search.value.trim().toLowerCase();
    apply();
  });

  // BibTeX: built from each card's title, authors, venue and badge year.
  var ENTRY = { journal: "article", conference: "inproceedings", workshop: "inproceedings", chapter: "incollection", patent: "misc" };

  function text(card, sel) {
    var el = card.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function bibtex(card) {
    var type = card.getAttribute("data-type");
    var title = text(card, ".pub-title");
    var venueLine = text(card, ".pub-venue");
    var year = (text(card, ".pub-badge").match(/\d{4}/) || [""])[0];
    // "Banerjee, S., Bhuyan, D., and Elmroth, E." -> ["Banerjee, S.", "Bhuyan, D.", "Elmroth, E."]
    var parts = text(card, ".pub-authors").replace(/,?\s+and\s+/, ", ").split(/,\s*/);
    var authors = [];
    for (var i = 0; i + 1 < parts.length; i += 2) authors.push(parts[i] + ", " + parts[i + 1]);
    var key = (parts[0] || "").toLowerCase().replace(/[^a-z]/g, "") + year +
      (title.toLowerCase().match(/[a-z]{4,}/) || [""])[0];

    var f = [["title", "{" + title + "}"], ["author", authors.join(" and ")]];
    var venue = text(card, ".venue");
    if (type === "journal") f.push(["journal", venue]);
    else if (type === "patent") f.push(["note", venueLine.replace(/\.$/, "")]);
    else if (venue) f.push(["booktitle", venue]);
    var m;
    if ((m = venueLine.match(/vol\.\s*(\d+)/))) f.push(["volume", m[1]]);
    if ((m = venueLine.match(/no\.\s*(\d+)/))) f.push(["number", m[1]]);
    if ((m = venueLine.match(/pp\.\s*([\d:]+)\s*[–-]\s*([\d:]+)/))) f.push(["pages", m[1] + "--" + m[2]]);
    if ((m = venueLine.match(/\b(Springer|IEEE|ACM)\b/)) && type !== "journal") f.push(["publisher", m[1]]);
    f.push(["year", year]);

    return "@" + ENTRY[type] + "{" + key + ",\n" +
      f.map(function (p) { return "  " + p[0] + " = {" + p[1] + "}"; }).join(",\n") + "\n}";
  }

  // Other citation styles, built from the same card data. Initials only (no full first names on the page).
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function meta(card) {
    var type = card.getAttribute("data-type");
    var venueLine = text(card, ".pub-venue");
    var parts = text(card, ".pub-authors").replace(/,?\s+and\s+/, ", ").split(/,\s*/);
    var people = [];
    for (var i = 0; i + 1 < parts.length; i += 2) people.push({ last: parts[i], init: parts[i + 1] });
    var m, d = { type: type, people: people, title: text(card, ".pub-title").replace(/\.$/, ""),
      venue: text(card, ".venue"), year: (text(card, ".pub-badge").match(/\d{4}/) || [""])[0] };
    d.vol = (m = venueLine.match(/vol\.\s*(\d+)/)) ? m[1] : "";
    d.no = (m = venueLine.match(/no\.\s*(\d+)/)) ? m[1] : "";
    d.pages = (m = venueLine.match(/pp\.\s*([\d:]+)\s*[–-]\s*([\d:]+)/)) ? m[1] + "–" + m[2] : "";
    d.publisher = (m = venueLine.match(/\b(Springer|IEEE|ACM)\b/)) && type !== "journal" ? m[1] : "";
    d.note = type === "patent" ? venueLine.replace(/\.$/, "") : "";
    return d;
  }

  function list(arr, last) { // "A, B, and C" / "A and B"
    if (arr.length < 2) return arr.join("");
    if (arr.length === 2) return arr[0] + " " + last + " " + arr[1];
    return arr.slice(0, -1).join(", ") + ", " + last + " " + arr[arr.length - 1];
  }

  var STYLES = {
    APA: function (d) {
      var au = d.people.map(function (p) { return p.last + ", " + p.init; });
      var a = au.length > 1 ? au.slice(0, -1).join(", ") + (au.length > 2 ? "," : "") + " & " + au[au.length - 1] : au[0] || "";
      var src = d.type === "patent" ? esc(d.note) : (d.type === "journal" ? "<i>" + esc(d.venue) + "</i>" : "In <i>" + esc(d.venue) + "</i>") +
        (d.vol ? ", <i>" + d.vol + "</i>" + (d.no ? "(" + d.no + ")" : "") : "") + (d.pages ? ", " + d.pages : "");
      return esc(a) + " (" + d.year + "). " + esc(d.title) + ". " + src + "." + (d.publisher && d.type !== "journal" ? " " + d.publisher + "." : "");
    },
    MLA: function (d) {
      var p = d.people, a = "";
      if (p.length === 1) a = p[0].last + ", " + p[0].init;
      else if (p.length === 2) a = p[0].last + ", " + p[0].init + ", and " + p[1].init + " " + p[1].last;
      else if (p.length > 2) a = p[0].last + ", " + p[0].init + ", et al";
      var bits = [d.type === "patent" ? esc(d.note) : "<i>" + esc(d.venue) + "</i>"];
      if (d.vol) bits.push("vol. " + d.vol);
      if (d.no) bits.push("no. " + d.no);
      if (d.publisher && d.type !== "journal") bits.push(d.publisher);
      bits.push(d.year);
      if (d.pages) bits.push("pp. " + d.pages);
      return esc(a) + ". \u201c" + esc(d.title) + ".\u201d " + bits.join(", ") + ".";
    },
    IEEE: function (d) {
      var a = list(d.people.map(function (p) { return p.init + " " + p.last; }), "and");
      var bits = [d.type === "patent" ? esc(d.note) : (d.type === "journal" ? "" : "in ") + "<i>" + esc(d.venue) + "</i>"];
      if (d.vol) bits.push("vol. " + d.vol);
      if (d.no) bits.push("no. " + d.no);
      if (d.pages) bits.push("pp. " + d.pages);
      bits.push(d.year);
      return esc(a) + ", \u201c" + esc(d.title) + ",\u201d " + bits.join(", ") + ".";
    },
    Chicago: function (d) {
      var p = d.people, au = p.map(function (x, i) { return i ? x.init + " " + x.last : x.last + ", " + x.init; });
      var a = list(au, "and");
      var src = d.type === "patent" ? esc(d.note) : "<i>" + esc(d.venue) + "</i>" + (d.vol ? " " + d.vol : "") + (d.no ? ", no. " + d.no : "");
      return esc(a) + ". \u201c" + esc(d.title) + ".\u201d " + src + (d.type === "journal" ? " (" + d.year + ")" : "") +
        (d.pages ? ": " + d.pages : "") + (d.type === "journal" || d.type === "patent" ? "" : (d.publisher ? ". " + d.publisher : "") + ", " + d.year) + ".";
    }
  };

  document.querySelectorAll(".pub-card").forEach(function (card) {
    var actions = card.querySelector(".pub-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "pub-actions";
      card.appendChild(actions);
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pub-btn code";
    btn.textContent = "❝ Cite";
    btn.setAttribute("aria-expanded", "false");
    actions.appendChild(btn);

    var d = meta(card);
    var out = { BibTeX: null };
    Object.keys(STYLES).forEach(function (k) { out[k] = STYLES[k](d); });
    var names = ["BibTeX", "APA", "MLA", "IEEE", "Chicago"];

    var panel = document.createElement("div");
    panel.className = "bib-panel";
    panel.hidden = true;
    panel.innerHTML = '<div class="bib-tabs" role="tablist">' + names.map(function (n, i) {
      return '<button type="button" role="tab" class="bib-tab" aria-selected="' + (i === 0) + '">' + n + "</button>";
    }).join("") + '</div><pre class="bib-text"></pre><button type="button" class="pub-btn bib-copy">Copy</button>';
    card.appendChild(panel);
    var pre = panel.querySelector("pre");

    function show(name) {
      panel.querySelectorAll(".bib-tab").forEach(function (t) {
        t.setAttribute("aria-selected", t.textContent === name ? "true" : "false");
      });
      if (name === "BibTeX") pre.textContent = bibtex(card);
      else pre.innerHTML = out[name];
      pre.className = "bib-text" + (name === "BibTeX" ? "" : " wrap");
    }
    show("BibTeX");
    panel.querySelector(".bib-tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".bib-tab");
      if (t) show(t.textContent);
    });

    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });
    var copy = panel.querySelector(".bib-copy");
    copy.addEventListener("click", function () {
      var done = function () {
        copy.textContent = "✓ Copied";
        setTimeout(function () { copy.textContent = "Copy"; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(done, function () {});
    });
  });
});
