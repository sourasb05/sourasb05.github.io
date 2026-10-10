(function () {
  // Apply saved theme before paint to avoid a flash.
  try {
    var saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {}

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(d) {
    var parts = String(d).split("-");
    if (parts.length === 1) return parts[0];
    var m = MONTHS[parseInt(parts[1], 10) - 1] || "";
    return m + " " + parts[0];
  }

  function newsItemHTML(item) {
    var links = (item.links || []).map(function (l) {
      return '<a href="' + l.url + '" target="_blank" rel="noopener">[' + l.label + "]</a>";
    }).join("");
    var tag = item.tag ? '<span class="news-tag" data-tag="' + item.tag + '">' + item.tag + "</span>" : "";
    return '<li class="news-item" data-tag="' + (item.tag || "") + '">' +
      '<div class="news-date">' + formatDate(item.date) + "</div>" +
      '<div class="news-body">' + tag + item.text +
      (links ? ' <span class="news-links">' + links + "</span>" : "") +
      "</div></li>";
  }

  function renderNews() {
    var news = window.NEWS || [];

    document.querySelectorAll("[data-news-count]").forEach(function (el) {
      var t = el.getAttribute("data-news-count");
      el.textContent = news.filter(function (i) { return !t || i.tag === t; }).length;
    });

    // Home page: latest N items.
    var latest = document.getElementById("news-latest");
    if (latest) {
      var n = parseInt(latest.getAttribute("data-count"), 10) || 5;
      latest.innerHTML = news.slice(0, n).map(newsItemHTML).join("");
    }

    // News page: all items grouped by year, with tag filters.
    var all = document.getElementById("news-all");
    if (!all) return;

    function draw(filter) {
      var html = "", year = null, open = false;
      news.forEach(function (item) {
        if (filter && item.tag !== filter) return;
        var y = String(item.date).slice(0, 4);
        if (y !== year) {
          if (open) html += "</ul>";
          html += '<div class="news-year">' + y + '</div><ul class="news-list">';
          year = y;
          open = true;
        }
        html += newsItemHTML(item);
      });
      if (open) html += "</ul>";
      all.innerHTML = html || '<p class="meta">No news in this category yet.</p>';
    }

    var filters = document.getElementById("news-filters");
    if (filters) {
      var tags = [];
      news.forEach(function (i) { if (i.tag && tags.indexOf(i.tag) < 0) tags.push(i.tag); });
      filters.innerHTML = ['<button class="chip-btn" data-filter="" aria-pressed="true">All</button>']
        .concat(tags.map(function (t) {
          return '<button class="chip-btn" data-filter="' + t + '" aria-pressed="false">' +
            t.charAt(0).toUpperCase() + t.slice(1) + "</button>";
        })).join("");
      filters.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-filter]");
        if (!btn) return;
        filters.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        draw(btn.getAttribute("data-filter"));
      });
    }
    draw("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".menu-toggle");
    if (toggle && header) {
      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var themeBtn = document.querySelector(".theme-toggle");
    if (themeBtn) {
      var isDark = function () {
        var t = document.documentElement.getAttribute("data-theme");
        if (t) return t === "dark";
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      };
      var sync = function () { themeBtn.textContent = isDark() ? "☀" : "☾"; };
      sync();
      themeBtn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        sync();
      });
    }

    renderNews();

    // Fade sections in as they scroll into view.
    var els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("visible"); });
    }
  });
})();
