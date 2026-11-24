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
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var value = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, value)) + ")";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
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
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        render(node, target * eased);
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
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
    var mouse = { x: -9999, y: -9999 };
    var dots = [];
    var w = 0;
    var h = 0;
    var heroWidth = 0;
    var dpr = 1;
    var raf = 0;
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
    }

    // Returns true when the canvas size changed. A hero of 0x0 (not laid out yet) is ignored.
    function resize() {
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var ratio = window.devicePixelRatio || 1;
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
      for (var i = 0; i < dots.length; i += 1) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        var dx = d.x - mx;
        var dy = d.y - my;
        var dist = Math.hypot(dx, dy) || 1;
        if (dist < influence) {
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
      var link = 110 * dpr;
      ctx.fillStyle = "rgba(58, 30, 46, 0.16)";
      for (var i = 0; i < dots.length; i += 1) {
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = dpr * 0.8;
      for (var a = 0; a < dots.length; a += 1) {
        for (var b = a + 1; b < dots.length; b += 1) {
          var gap = Math.hypot(dots[a].x - dots[b].x, dots[a].y - dots[b].y);
          if (gap > link) continue;
          var midX = (dots[a].x + dots[b].x) / 2;
          var midY = (dots[a].y + dots[b].y) / 2;
          var nearMouse = Math.hypot(midX - mx, midY - my) < influence;
          var alpha = (1 - gap / link) * (nearMouse ? 0.28 : 0.1);
          ctx.strokeStyle = nearMouse
            ? "rgba(224, 138, 60, " + (alpha + 0.1) + ")"
            : "rgba(58, 30, 46, " + alpha + ")";
          ctx.beginPath();
          ctx.moveTo(dots[a].x, dots[a].y);
          ctx.lineTo(dots[b].x, dots[b].y);
          ctx.stroke();
        }
      }
    }

    function frame() {
      move();
      render();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // Always cancels first, so there is never more than one loop.
    function start() {
      stop();
      if (reduced || !w || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(frame);
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
      if (resize()) render();
    }

    requestAnimationFrame(boot);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);

    if (!reduced) {
      hero.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = hero.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
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

  function bindTilt(selector, max) {
    if (reduced || !finePointer) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = el.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width;
        var py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty("--mx", (px * 100) + "%");
        el.style.setProperty("--my", (py * 100) + "%");
        var rx = (0.5 - py) * max;
        var ry = (px - 0.5) * max;
        el.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
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
      el.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = el.getBoundingClientRect();
        var x = event.clientX - (rect.left + rect.width / 2);
        var y = event.clientY - (rect.top + rect.height / 2);
        el.style.transform = "translate(" + (x * 0.22).toFixed(1) + "px, " + (y * 0.28).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
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
    var looping = false;

    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px, " + ry + "px)";
      root.style.opacity = visible ? "1" : "0";
      if (Math.abs(x - rx) > 0.4 || Math.abs(y - ry) > 0.4) {
        requestAnimationFrame(loop);
      } else {
        looping = false;
      }
    }

    document.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      visible = true;
      dot.style.transform = "translate(" + x + "px, " + y + "px)";
      if (!looping) {
        looping = true;
        requestAnimationFrame(loop);
      }
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
