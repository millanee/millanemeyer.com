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
      el.textContent = roles.join("  ·  ");
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
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var parent = canvas.parentElement;
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;
    var width = 0;
    var height = 0;

    function resize() {
      var rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = width < 700 ? 28 : 58;
      dots = [];
      for (var i = 0; i < count; i += 1) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35
        });
      }
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      var link = width < 700 ? 88 : 126;
      for (var i = 0; i < dots.length; i += 1) {
        var dot = dots[i];
        if (!reduced) {
          var dx = dot.x - mouse.x;
          var dy = dot.y - mouse.y;
          var dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 0) {
            dot.x += (dx / dist) * 0.45;
            dot.y += (dy / dist) * 0.45;
          }
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < 0 || dot.x > width) dot.vx *= -1;
          if (dot.y < 0 || dot.y > height) dot.vy *= -1;
        }
        ctx.beginPath();
        ctx.fillStyle = "rgba(58, 30, 46, 0.55)";
        ctx.arc(dot.x, dot.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
        for (var j = i + 1; j < dots.length; j += 1) {
          var other = dots[j];
          var gap = Math.hypot(dot.x - other.x, dot.y - other.y);
          if (gap < link) {
            ctx.strokeStyle = "rgba(224, 138, 60, " + (1 - gap / link) * 0.55 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
      if (!reduced) requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", function () {
      resize();
      if (reduced) step();
    });

    var stage = canvas.closest(".hero") || parent;
    if (!reduced && finePointer) {
      stage.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = parent.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
      });
      stage.addEventListener("pointerleave", function () {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        if (!reduced) step();
      }
    });
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
})();
