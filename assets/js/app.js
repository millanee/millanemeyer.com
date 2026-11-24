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
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var parent = canvas.parentElement;
    var stage = canvas.closest(".hero") || parent;
    var dots = [];
    var width = 0;
    var height = 0;
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = 0;
    var lastTime = 0;
    var onScreen = true;
    var resizeTimer = 0;

    function baseSpeed() {
      return 12 + Math.random() * 16;
    }

    function makeDot(x, y) {
      var angle = Math.random() * Math.PI * 2;
      var v = baseSpeed();
      return {
        x: x,
        y: y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        base: v,
        wander: Math.random() * Math.PI * 2
      };
    }

    function desiredCount() {
      return width < 700 ? 42 : 62;
    }

    function layout(nextW, nextH, rebuild) {
      var prevW = width;
      var prevH = height;
      width = Math.max(1, nextW);
      height = Math.max(1, nextH);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuild || !dots.length || prevW < 2) {
        dots = [];
        var created = desiredCount();
        for (var i = 0; i < created; i += 1) {
          dots.push(makeDot(Math.random() * width, Math.random() * height));
        }
        return;
      }
      var sx = width / prevW;
      var sy = height / prevH;
      for (var j = 0; j < dots.length; j += 1) {
        dots[j].x = Math.min(width - 1, Math.max(0, dots[j].x * sx));
        dots[j].y = Math.min(height - 1, Math.max(0, dots[j].y * sy));
      }
      var want = desiredCount();
      while (dots.length < want) dots.push(makeDot(Math.random() * width, Math.random() * height));
      if (dots.length > want) dots.length = want;
    }

    function readSize() {
      var rect = parent.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      var link = width < 700 ? 112 : 148;
      for (var i = 0; i < dots.length; i += 1) {
        var dot = dots[i];
        ctx.beginPath();
        ctx.fillStyle = "rgba(58, 30, 46, 0.55)";
        ctx.arc(dot.x, dot.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
        for (var j = i + 1; j < dots.length; j += 1) {
          var other = dots[j];
          var gap = Math.hypot(dot.x - other.x, dot.y - other.y);
          if (gap < link) {
            ctx.strokeStyle = "rgba(224, 138, 60, " + ((1 - gap / link) * 0.55) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    }

    function integrate(dt) {
      for (var i = 0; i < dots.length; i += 1) {
        var dot = dots[i];
        dot.wander += dt * 0.85;
        var ax = Math.cos(dot.wander) * 10;
        var ay = Math.sin(dot.wander * 0.83 + 1.3) * 10;
        if (mouse.active) {
          var dx = dot.x - mouse.x;
          var dy = dot.y - mouse.y;
          var dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 0.001) {
            var push = (1 - dist / 150) * 80;
            ax += (dx / dist) * push;
            ay += (dy / dist) * push;
          }
        }
        dot.vx += ax * dt;
        dot.vy += ay * dt;
        var mag = Math.hypot(dot.vx, dot.vy) || 1;
        var next = mag + (dot.base - mag) * (1 - Math.exp(-2.4 * dt));
        if (next < 12) next = 12;
        if (next > 96) next = 96;
        dot.vx = (dot.vx / mag) * next;
        dot.vy = (dot.vy / mag) * next;
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;
        if (dot.x < 1) {
          dot.x = 1;
          dot.vx = Math.abs(dot.vx);
        } else if (dot.x > width - 1) {
          dot.x = width - 1;
          dot.vx = -Math.abs(dot.vx);
        }
        if (dot.y < 1) {
          dot.y = 1;
          dot.vy = Math.abs(dot.vy);
        } else if (dot.y > height - 1) {
          dot.y = height - 1;
          dot.vy = -Math.abs(dot.vy);
        }
      }
    }

    function frame(now) {
      if (!onScreen || document.hidden) {
        rafId = 0;
        return;
      }
      if (!lastTime) lastTime = now;
      var dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      if (dt > 0) integrate(dt);
      draw();
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || rafId || !onScreen || document.hidden) return;
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
    }

    var box = readSize();
    layout(box.w, box.h, true);
    if (reduced) {
      draw();
    } else {
      start();
    }

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var next = readSize();
        if (Math.abs(next.w - width) < 24) return;
        layout(next.w, next.h, false);
        if (reduced) draw();
      }, 160);
    });

    function releaseMouse() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    if (!reduced && finePointer) {
      stage.addEventListener("pointermove", function (event) {
        if (event.pointerType !== "mouse") return;
        var rect = parent.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        mouse.active = true;
      });
      stage.addEventListener("pointerleave", releaseMouse);
      document.addEventListener("mouseleave", releaseMouse);
      window.addEventListener("blur", releaseMouse);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if (!reduced && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        onScreen = !!(entries[0] && entries[0].isIntersecting);
        if (onScreen) start();
        else stop();
      }, { threshold: 0 });
      observer.observe(stage);
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
