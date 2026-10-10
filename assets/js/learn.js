/* Renders learn.html (post list) and post.html (single post) from window.POSTS. */
(function () {
  var TOPICS = {
    "federated-learning": "Federated Learning",
    "continual-learning": "Continual Learning",
    "genai": "GenAI Paper Notes"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function topicTag(t) {
    return '<span class="post-topic" data-topic="' + esc(t) + '">' + esc(TOPICS[t] || t) + "</span>";
  }

  // Render Markdown with LaTeX: protect math from the Markdown parser, then typeset with KaTeX.
  function renderMarkdown(md) {
    var math = [];
    function keep(tex, display) {
      math.push({ tex: tex, display: display });
      return "@@MATH" + (math.length - 1) + "@@";
    }
    md = md.replace(/```[\s\S]*?```|`[^`\n]*`/g, function (code) { return code.replace(/\$/g, "@@DOLLAR@@"); });
    md = md.replace(/\$\$([\s\S]+?)\$\$/g, function (_, tex) { return keep(tex, true); });
    md = md.replace(/\$([^\$\n]+?)\$/g, function (_, tex) { return keep(tex, false); });
    var html = marked.parse(md).replace(/@@DOLLAR@@/g, "$");
    return html.replace(/@@MATH(\d+)@@/g, function (_, i) {
      var m = math[+i];
      try {
        return katex.renderToString(m.tex, { displayMode: m.display, throwOnError: false });
      } catch (e) {
        return esc(m.tex);
      }
    });
  }

  function renderList() {
    var list = document.getElementById("post-list");
    if (!list) return;
    var posts = window.POSTS || [];
    var state = "";

    function draw() {
      var shown = posts.filter(function (p) { return !state || p.topic === state; });
      list.innerHTML = shown.length ? shown.map(function (p) {
        return '<a class="card post-card" href="post.html?p=' + encodeURIComponent(p.slug) + '">' +
          '<div class="post-meta">' + topicTag(p.topic) + "<span>" + fmtDate(p.date) + "</span></div>" +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.summary) + "</p>" +
          '<span class="post-read">Read post →</span></a>';
      }).join("") : '<div class="card post-empty">No posts on this topic yet — coming soon.</div>';
    }

    document.querySelectorAll("[data-topic-filter]").forEach(function (el) {
      el.addEventListener("click", function () {
        var t = el.getAttribute("data-topic-filter");
        state = state === t ? "" : t;
        document.querySelectorAll("[data-topic-filter]").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-topic-filter") === state ? "true" : "false");
        });
        draw();
        document.getElementById("posts").scrollIntoView({ behavior: "smooth" });
      });
    });

    document.querySelectorAll("[data-topic-count]").forEach(function (el) {
      var t = el.getAttribute("data-topic-count");
      var n = posts.filter(function (p) { return p.topic === t; }).length;
      el.textContent = n + (n === 1 ? " post" : " posts");
    });

    draw();
  }

  function renderPost() {
    var body = document.getElementById("post-body");
    if (!body) return;
    var slug = new URLSearchParams(location.search).get("p");
    var post = (window.POSTS || []).filter(function (p) { return p.slug === slug; })[0];
    if (!post) {
      body.innerHTML = '<p>Post not found. <a href="learn.html">Back to all posts</a>.</p>';
      return;
    }
    document.title = post.title + " — Sourasekhar Banerjee";
    document.getElementById("post-title").textContent = post.title;
    document.getElementById("post-meta").innerHTML = topicTag(post.topic) + "<span>" + fmtDate(post.date) + "</span>";

    fetch("posts/" + encodeURIComponent(post.slug) + ".md")
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (md) { body.innerHTML = renderMarkdown(md); })
      .catch(function () {
        body.innerHTML = "<p>Could not load this post. If you opened the file directly, run a local server " +
          "(<code>python3 -m http.server</code>).</p>";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderList();
    renderPost();
  });
})();
