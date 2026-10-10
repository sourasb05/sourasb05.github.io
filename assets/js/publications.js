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
    btn.textContent = "❝ BibTeX";
    btn.setAttribute("aria-expanded", "false");
    actions.appendChild(btn);

    var panel = document.createElement("div");
    panel.className = "bib-panel";
    panel.hidden = true;
    panel.innerHTML = '<pre></pre><button type="button" class="pub-btn bib-copy">Copy</button>';
    panel.querySelector("pre").textContent = bibtex(card);
    card.appendChild(panel);

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
      if (navigator.clipboard) navigator.clipboard.writeText(panel.querySelector("pre").textContent).then(done, function () {});
    });
  });
});
