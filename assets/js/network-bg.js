/*
 * Animated network backgrounds.
 *
 * Add data-network="federated" or data-network="decentralized" to any element
 * (it needs position: relative). Optional data-network-tone="light" draws in
 * white, for use on dark/gradient backgrounds.
 *
 *  federated:     clients drift around a server; in each round a few clients send
 *                 updates to the server, which aggregates and broadcasts back.
 *  decentralized: nodes connect to nearby peers and gossip updates hop to hop.
 */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rgba(hex, a) {
    hex = hex.trim();
    if (hex.indexOf("rgb") === 0) return hex.replace(/rgba?\(([^)]+)\)/, function (_, v) {
      return "rgba(" + v.split(",").slice(0, 3).join(",") + "," + a + ")";
    });
    if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function NetworkBg(host) {
    this.host = host;
    this.mode = host.getAttribute("data-network");
    this.light = host.getAttribute("data-network-tone") === "light";
    this.canvas = document.createElement("canvas");
    this.canvas.className = "net-bg";
    this.canvas.setAttribute("aria-hidden", "true");
    host.insertBefore(this.canvas, host.firstChild);
    this.ctx = this.canvas.getContext("2d");
    this.packets = [];
    this.rings = [];
    this.visible = true;
    this.last = 0;
    this.nextRound = 600;
    this.resize();
    this.readColors();

    var self = this;
    if ("ResizeObserver" in window) new ResizeObserver(function () { self.resize(); }).observe(host);
    else window.addEventListener("resize", function () { self.resize(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { self.visible = e[0].isIntersecting; }).observe(host);
    }
    new MutationObserver(function () { self.readColors(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", function () { self.readColors(); });
    }

    if (reduceMotion) { this.draw(); return; }
    requestAnimationFrame(function loop(t) {
      self.tick(t);
      requestAnimationFrame(loop);
    });
  }

  NetworkBg.prototype.readColors = function () {
    var cs = getComputedStyle(document.documentElement);
    this.c1 = this.light ? "#ffffff" : (cs.getPropertyValue("--accent") || "#3451d1");
    this.c2 = this.light ? "#d9fffb" : (cs.getPropertyValue("--accent-2") || "#0ea5a4");
    if (reduceMotion) this.draw();
  };

  NetworkBg.prototype.resize = function () {
    var r = this.host.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout();
  };

  NetworkBg.prototype.layout = function () {
    var w = this.w, h = this.h;
    var density = this.mode === "decentralized" ? 9000 : 22000;
    var count = Math.max(10, Math.min(34, Math.round(w * h / density)));
    this.nodes = [];
    for (var i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 2.2 + Math.random() * 2,
        glow: 0
      });
    }
    if (this.mode === "federated") {
      // Server sits on the right, away from the main text.
      this.server = { x: w * (w < 700 ? 0.82 : 0.86), y: h * 0.5, r: 9, glow: 0 };
    }
    this.packets = [];
    this.rings = [];
    if (reduceMotion) this.draw();
  };

  NetworkBg.prototype.neighbors = function (n) {
    var max = Math.min(170, Math.max(110, this.w / 6));
    return this.nodes.filter(function (m) {
      if (m === n) return false;
      var dx = m.x - n.x, dy = m.y - n.y;
      return dx * dx + dy * dy < max * max;
    });
  };

  NetworkBg.prototype.send = function (from, to, color, onArrive) {
    this.packets.push({ from: from, to: to, t: 0, speed: 0.008 + Math.random() * 0.004, color: color, onArrive: onArrive });
  };

  NetworkBg.prototype.startRound = function () {
    var self = this;
    if (this.mode === "federated") {
      // Pick a few clients, upload to server, aggregate, then broadcast back.
      var picked = this.nodes.slice().sort(function () { return Math.random() - 0.5; })
        .slice(0, Math.max(3, Math.round(this.nodes.length * 0.3)));
      var arrived = 0;
      picked.forEach(function (n) {
        n.glow = 1;
        self.send(n, self.server, self.c2, function () {
          arrived++;
          if (arrived === picked.length) {
            self.server.glow = 1;
            self.rings.push({ x: self.server.x, y: self.server.y, r: self.server.r, a: 0.6 });
            setTimeout(function () {
              picked.forEach(function (m) {
                self.send(self.server, m, self.c1, function () { m.glow = 1; });
              });
            }, 350);
          }
        });
      });
      this.nextRound = 4200;
    } else {
      // Gossip: a node shares with its neighbors, who pass it on once.
      var seed = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      seed.glow = 1;
      this.rings.push({ x: seed.x, y: seed.y, r: seed.r, a: 0.5 });
      var seen = [seed];
      this.neighbors(seed).forEach(function (m) {
        seen.push(m);
        self.send(seed, m, self.c2, function () {
          m.glow = 1;
          self.neighbors(m).slice(0, 2).forEach(function (k) {
            if (seen.indexOf(k) >= 0) return;
            seen.push(k);
            self.send(m, k, self.c1, function () { k.glow = 1; });
          });
        });
      });
      this.nextRound = 1700;
    }
  };

  NetworkBg.prototype.tick = function (t) {
    var dt = Math.min(50, t - (this.last || t));
    this.last = t;
    if (!this.visible || document.hidden) return;

    var w = this.w, h = this.h;
    this.nodes.forEach(function (n) {
      n.x += n.vx * dt * 0.06;
      n.y += n.vy * dt * 0.06;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      n.glow = Math.max(0, n.glow - dt / 900);
    });
    if (this.server) this.server.glow = Math.max(0, this.server.glow - dt / 1200);

    var still = [];
    this.packets.forEach(function (p) {
      p.t += p.speed * dt / 16;
      if (p.t >= 1) { if (p.onArrive) p.onArrive(); }
      else still.push(p);
    });
    this.packets = still;

    this.rings = this.rings.filter(function (r) {
      r.r += dt * 0.05;
      r.a -= dt / 1400;
      return r.a > 0;
    });

    this.nextRound -= dt;
    if (this.nextRound <= 0) this.startRound();
    this.draw();
  };

  NetworkBg.prototype.draw = function () {
    var ctx = this.ctx, self = this;
    ctx.clearRect(0, 0, this.w, this.h);
    var base = this.light ? 0.22 : 0.16;

    // Edges
    ctx.lineWidth = 1;
    if (this.mode === "federated") {
      this.nodes.forEach(function (n) {
        ctx.strokeStyle = rgba(self.c1, base * 0.6 + n.glow * 0.25);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(self.server.x, self.server.y);
        ctx.stroke();
      });
    } else {
      var max = Math.min(170, Math.max(110, this.w / 6));
      for (var i = 0; i < this.nodes.length; i++) {
        for (var j = i + 1; j < this.nodes.length; j++) {
          var a = this.nodes[i], b = this.nodes[j];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < max) {
            ctx.strokeStyle = rgba(self.c1, base * (1 - d / max) * 1.6);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    // Rings
    this.rings.forEach(function (r) {
      ctx.strokeStyle = rgba(self.c2, r.a);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Packets
    this.packets.forEach(function (p) {
      var x = p.from.x + (p.to.x - p.from.x) * p.t;
      var y = p.from.y + (p.to.y - p.from.y) * p.t;
      ctx.fillStyle = rgba(p.color, 0.18);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(p.color, 0.9);
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
    });

    // Nodes
    this.nodes.forEach(function (n) {
      if (n.glow > 0) {
        ctx.fillStyle = rgba(self.c2, n.glow * 0.25);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 7 * n.glow, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(self.c1, 0.35 + n.glow * 0.5);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });

    // Server
    if (this.server) {
      var s = this.server;
      ctx.fillStyle = rgba(this.c1, 0.1 + s.glow * 0.2);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 10 + s.glow * 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(this.c1, 0.75);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(this.c2, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 4, 0, Math.PI * 2); ctx.stroke();
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-network]").forEach(function (el) { new NetworkBg(el); });
  });
})();
