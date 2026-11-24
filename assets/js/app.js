(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // One requestAnimationFrame loop drives every per-frame task on the page.
  // Tasks may remove themselves while running; adding a task twice is a no-op.
  var ticker = (function () {
    var tasks = [];
    var id = 0;
    function run(now) {
      id = 0;
      for (var i = tasks.length - 1; i >= 0; i -= 1) {
        if (tasks[i]) tasks[i](now);
      }
      if (tasks.length && !id) id = requestAnimationFrame(run);
    }
    return {
      add: function (fn) {
        if (tasks.indexOf(fn) === -1) tasks.push(fn);
        if (!id) id = requestAnimationFrame(run);
      },
      remove: function (fn) {
        var i = tasks.indexOf(fn);
        if (i !== -1) tasks.splice(i, 1);
        if (!tasks.length && id) {
          cancelAnimationFrame(id);
          id = 0;
        }
      }
    };
  })();

  ready(function () {
    initNav();
    initProgress();
    initLangMemory();
    initTypewriter();
    initReveals();
    initTimeline();
    initCounters();
    initNetwork();
    initTilt();
    initMagnetic();
    initCursor();
    initCertificates();
  });

  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;
    var label = toggle.querySelector(".sr-only");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      if (label) {
        label.textContent = open ? toggle.getAttribute("data-label-close") : toggle.getAttribute("data-label-open");
      }
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) setOpen(false);
    });
  }

  function initProgress() {
    var bar = document.querySelector(".progress span");
    if (!bar) return;
    var update = function () {
      ticker.remove(update);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var value = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, value)) + ")";
    };
    var schedule = function () { ticker.add(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }

  function initLangMemory() {
    document.querySelectorAll("[data-set-lang]").forEach(function (link) {
      link.addEventListener("click", function () {
        try {
          localStorage.setItem("mm-lang", link.getAttribute("data-set-lang"));
        } catch (error) {
          /* storage can be blocked; the link still navigates */
        }
      });
    });
  }

  function initTypewriter() {
    var el = document.getElementById("typewriter");
    if (!el) return;
    var roles = [];
    try {
      roles = JSON.parse(el.getAttribute("data-roles") || "[]");
    } catch (error) {
      roles = [];
    }
    if (!roles.length) return;
    if (reduced) {
      el.textContent = roles[0];
      return;
    }

    var roleIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var word = roles[roleIndex];
      if (!deleting) {
        charIndex += 1;
        el.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) {
          deleting = true;
          window.setTimeout(tick, 1600);
          return;
        }
        window.setTimeout(tick, 78);
        return;
      }
      charIndex -= 1;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        window.setTimeout(tick, 280);
        return;
      }
      window.setTimeout(tick, 36);
    }

    el.textContent = "";
    tick();
  }

  function initReveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) { node.classList.add("is-in"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function initTimeline() {
    var timeline = document.querySelector(".timeline");
    if (!timeline) return;
    if (reduced || !("IntersectionObserver" in window)) {
      timeline.classList.add("is-drawn");
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          timeline.classList.add("is-drawn");
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(timeline);
  }

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    function render(node, value) {
      var decimals = Number(node.getAttribute("data-decimals") || "0");
      var suffix = node.getAttribute("data-suffix") || "";
      var text = decimals ? value.toFixed(decimals) : String(Math.round(value));
      node.textContent = text + suffix;
    }

    function play(node) {
      var target = Number(node.getAttribute("data-count"));
      if (reduced) {
        render(node, target);
        return;
      }
      var start = performance.now();
      var duration = 1100;
      function frame(now) {
        var t = Math.max(0, Math.min(1, (now - start) / duration));
        var eased = 1 - Math.pow(1 - t, 3);
        render(node, target * eased);
        if (t >= 1) ticker.remove(frame);
      }
      ticker.add(frame);
    }

    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(play);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          play(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function initNetwork() {
    var canvas = document.querySelector(".network");
    if (!canvas) return;
    var hero = canvas.closest(".hero");
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!hero || !ctx) return;
    // Line alphas are bucketed so each frame strokes a few batched paths with prebuilt colour strings.
    var LEVELS = 8;
    var inkStyles = [];
    var amberStyles = [];
    for (var l = 0; l < LEVELS; l += 1) {
      var strength = (l + 0.5) / LEVELS;
      inkStyles.push("rgba(58, 30, 46, " + (strength * 0.1).toFixed(4) + ")");
      amberStyles.push("rgba(224, 138, 60, " + (strength * 0.28 + 0.1).toFixed(4) + ")");
    }
    var mouse = { x: -9999, y: -9999 };
    var dots = [];
    var pairA = null;
    var pairB = null;
    var pairLevel = null;
    var w = 0;
    var h = 0;
    var heroWidth = 0;
    var heroX = 0;
    var heroY = 0;
    var dpr = 1;
    var running = false;
    var onScreen = true;

    function seed(rect) {
      var count = reduced ? 28 : Math.min(80, Math.floor((rect.width * rect.height) / 14000));
      dots = [];
      for (var i = 0; i < count; i += 1) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25 * dpr,
          vy: (Math.random() - 0.5) * 0.25 * dpr,
          r: (1 + Math.random() * 1.4) * dpr
        });
      }
      var pairs = (count * (count - 1)) / 2;
      pairA = new Uint8Array(pairs);
      pairB = new Uint8Array(pairs);
      pairLevel = new Uint8Array(pairs);
    }

    // Returns true when the canvas size changed. A hero of 0x0 (not laid out yet) is ignored.
    // The backing store is capped at 1.5x: the faint dots look the same and there are far fewer pixels to fill.
    function resize() {
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      heroX = rect.left + window.scrollX;
      heroY = rect.top + window.scrollY;
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      var nextW = Math.floor(rect.width * ratio);
      var nextH = Math.floor(rect.height * ratio);
      if (nextW === w && nextH === h && ratio === dpr) return false;
      var rebuild = !dots.length || rect.width !== heroWidth || ratio !== dpr;
      if (!rebuild) {
        for (var i = 0; i < dots.length; i += 1) dots[i].y *= nextH / h;
      }
      w = canvas.width = nextW;
      h = canvas.height = nextH;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      heroWidth = rect.width;
      dpr = ratio;
      if (rebuild) seed(rect);
      return true;
    }

    function move() {
      var mx = mouse.x * dpr;
      var my = mouse.y * dpr;
      var influence = 140 * dpr;
      var influence2 = influence * influence;
      for (var i = 0; i < dots.length; i += 1) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        var dx = d.x - mx;
        var dy = d.y - my;
        var dist2 = dx * dx + dy * dy;
        if (dist2 < influence2) {
          var dist = Math.sqrt(dist2) || 1;
          var f = ((influence - dist) / influence) * 0.35;
          d.x += (dx / dist) * f * 4;
          d.y += (dy / dist) * f * 4;
        }
        if (d.x < 0) { d.x = 0; d.vx = Math.abs(d.vx); }
        else if (d.x > w) { d.x = w; d.vx = -Math.abs(d.vx); }
        if (d.y < 0) { d.y = 0; d.vy = Math.abs(d.vy); }
        else if (d.y > h) { d.y = h; d.vy = -Math.abs(d.vy); }
      }
    }

    function render() {
      ctx.clearRect(0, 0, w, h);
      var mx = mouse.x * dpr;
      var my = mouse.y * dpr;
      var influence = 140 * dpr;
      var influence2 = influence * influence;
      var link = 110 * dpr;
      var link2 = link * link;
      var n = dots.length;
      var i;
      ctx.fillStyle = "rgba(58, 30, 46, 0.16)";
      ctx.beginPath();
      for (i = 0; i < n; i += 1) {
        ctx.moveTo(dots[i].x + dots[i].r, dots[i].y);
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
      }
      ctx.fill();

      var count = 0;
      for (var a = 0; a < n; a += 1) {
        var da = dots[a];
        for (var b = a + 1; b < n; b += 1) {
          var db = dots[b];
          var gx = da.x - db.x;
          var gy = da.y - db.y;
          var gap2 = gx * gx + gy * gy;
          if (gap2 > link2) continue;
          var level = Math.min(LEVELS - 1, Math.floor((1 - Math.sqrt(gap2) / link) * LEVELS));
          var midX = (da.x + db.x) / 2 - mx;
          var midY = (da.y + db.y) / 2 - my;
          pairA[count] = a;
          pairB[count] = b;
          pairLevel[count] = midX * midX + midY * midY < influence2 ? LEVELS + level : level;
          count += 1;
        }
      }
      ctx.lineWidth = dpr * 0.8;
      for (var s = 0; s < LEVELS * 2; s += 1) {
        var started = false;
        for (i = 0; i < count; i += 1) {
          if (pairLevel[i] !== s) continue;
          if (!started) {
            ctx.beginPath();
            started = true;
          }
          ctx.moveTo(dots[pairA[i]].x, dots[pairA[i]].y);
          ctx.lineTo(dots[pairB[i]].x, dots[pairB[i]].y);
        }
        if (!started) continue;
        ctx.strokeStyle = s < LEVELS ? inkStyles[s] : amberStyles[s - LEVELS];
        ctx.stroke();
      }
    }

    function frame() {
      move();
      render();
    }

    function stop() {
      running = false;
      ticker.remove(frame);
    }

    function start() {
      if (reduced || !w || !onScreen || document.hidden) {
        stop();
        return;
      }
      running = true;
      ticker.add(frame);
    }

    function boot() {
      resize();
      if (!w) {
        requestAnimationFrame(boot);
        return;
      }
      render();
      start();
    }

    function onResize() {
      if (resize() && !running) render();
    }

    requestAnimationFrame(boot);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);

    if (!reduced) {
      hero.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        mouse.x = event.pageX - heroX;
        mouse.y = event.pageY - heroY;
      });
      hero.addEventListener("pointerleave", function () {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        if (onScreen) start();
        else stop();
      }).observe(hero);
    }
  }

  // Pointer effects measure their element once per hover (not on every move, which forces layout and
  // reads back the transform they just applied) and write styles at most once per frame.
  function hoverEffect(el, apply) {
    var rect = null;
    var event = null;
    function write() {
      ticker.remove(write);
      if (event) apply(event, rect);
    }
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      if (!rect) rect = el.getBoundingClientRect();
      event = e;
      ticker.add(write);
    });
    el.addEventListener("pointerleave", function () {
      ticker.remove(write);
      event = null;
      rect = null;
      el.style.transform = "";
    });
    window.addEventListener("scroll", function () { rect = null; }, { passive: true });
  }

  function bindTilt(selector, max) {
    if (reduced || !finePointer) return;
    document.querySelectorAll(selector).forEach(function (el) {
      hoverEffect(el, function (event, rect) {
        var px = (event.clientX - rect.left) / rect.width;
        var py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty("--mx", (px * 100) + "%");
        el.style.setProperty("--my", (py * 100) + "%");
        var rx = (0.5 - py) * max;
        var ry = (px - 0.5) * max;
        el.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      });
    });
  }

  function initTilt() {
    bindTilt(".portrait-tilt", 8);
    bindTilt(".project", 6);
  }

  function initMagnetic() {
    if (reduced || !finePointer) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      hoverEffect(el, function (event, rect) {
        var x = event.clientX - (rect.left + rect.width / 2);
        var y = event.clientY - (rect.top + rect.height / 2);
        el.style.transform = "translate(" + (x * 0.22).toFixed(1) + "px, " + (y * 0.28).toFixed(1) + "px)";
      });
    });
  }

  function initCursor() {
    if (reduced || !finePointer) return;
    var root = document.querySelector(".cursor");
    if (!root) return;
    var dot = root.querySelector(".cursor-dot");
    var ring = root.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    document.body.classList.add("has-cursor");
    root.style.display = "block";
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var rx = x;
    var ry = y;
    var visible = false;

    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      dot.style.transform = "translate(" + x + "px, " + y + "px)";
      ring.style.transform = "translate(" + rx.toFixed(2) + "px, " + ry.toFixed(2) + "px)";
      if (Math.abs(x - rx) <= 0.4 && Math.abs(y - ry) <= 0.4) ticker.remove(loop);
    }

    document.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        visible = true;
        root.style.opacity = "1";
      }
      ticker.add(loop);
    });

    document.addEventListener("pointerover", function (event) {
      var target = event.target;
      var hot = target && target.closest && target.closest("a, button");
      root.classList.toggle("is-hot", Boolean(hot));
    });
  }

  function initCertificates() {
    var dialog = document.getElementById("cert-lightbox");
    if (!dialog) return;
    var image = dialog.querySelector("img");
    var closeBtn = dialog.querySelector(".lightbox-close");
    var lastFocus = null;

    function open(stage) {
      var full = stage.getAttribute("data-full");
      var alt = stage.getAttribute("data-alt") || "";
      if (!full) return;
      image.src = full;
      image.alt = alt;
      lastFocus = document.activeElement;
      dialog.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      dialog.hidden = true;
      image.removeAttribute("src");
      image.alt = "";
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll(".cert-stage").forEach(function (stage) {
      stage.addEventListener("click", function () { open(stage); });
    });

    closeBtn.addEventListener("click", close);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !dialog.hidden) close();
    });
  }
})();
