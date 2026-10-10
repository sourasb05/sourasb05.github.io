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
});
