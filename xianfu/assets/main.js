/* 通關暗號核對值（SHA-256，十六進位小寫）。請勿把明文寫進此檔。
 * 更換暗號：在瀏覽器主控台執行：
 *   crypto.subtle.digest("SHA-256", new TextEncoder().encode("新暗號".trim().toUpperCase()))
 *     .then(function (buf) {
 *       console.log(Array.from(new Uint8Array(buf)).map(function (b) {
 *         return b.toString(16).padStart(2, "0");
 *       }).join(""));
 *     });
 * 將印出的字串貼到 INNER_GATE_HASH。輸入會先 trim 再轉成大寫後再雜湊。
 */
var INNER_GATE_HASH = "45ae1891d4c816022a780b6f8ec92efe5770f63149f2436299075a5d6f01b804";

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var entrance = document.getElementById("entrance");
  var hall = document.getElementById("hall");
  var wipe = document.getElementById("wipe");
  var enterBtn = document.getElementById("enter-btn");
  var backBtn = document.getElementById("back-btn");
  var descendBtn = document.getElementById("descend-btn");
  var pathChoice = document.getElementById("path-choice");
  var pathInner = document.getElementById("path-inner");
  var pathOuter = document.getElementById("path-outer");
  var innerGate = document.getElementById("inner-gate");
  var innerForm = document.getElementById("inner-gate-form");
  var innerPass = document.getElementById("inner-pass");
  var innerToken = document.getElementById("inner-token");
  var innerErr = document.getElementById("inner-gate-err");
  var innerGateBack = document.getElementById("inner-gate-back");
  var enterUi = document.querySelector(".enter-ui");
  var GATE_SESSION = "leo-xianfu-inner";
  var swoopEl = document.getElementById("swoop");
  var ambient = document.getElementById("ambient");
  var audioBtn = document.getElementById("audio-toggle");
  var modal = document.getElementById("modal");
  var sheet = modal && modal.querySelector(".sheet");
  var entering = false;
  var swooping = false;
  var lastFocus = null;
  var timers = [];
  var mobile = function () { return window.matchMedia("(max-width: 799px)").matches; };
  var currentNpc = "master";

  function later(fn, ms) {
    var t = window.setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
  }

  function setScene(name) {
    document.body.setAttribute("data-scene", name);
    if (entrance) entrance.setAttribute("aria-hidden", name === "entrance" || name === "choice" ? "false" : "true");
    if (hall) hall.setAttribute("aria-hidden", name === "hall" ? "false" : "true");
    if (swoopEl) swoopEl.setAttribute("aria-hidden", name === "swoop" ? "false" : "true");
  }

  function resetEnterClasses() {
    entrance.classList.remove("is-zoom", "is-midzoom", "is-gone");
    hall.classList.remove("in");
    if (wipe) wipe.classList.remove("flash", "fog", "mid", "out");
    if (swoopEl) swoopEl.classList.remove("on", "is-dive", "mid");
  }

  function officeUrl() {
    var h = location.hostname;
    if (h === "127.0.0.1" || h === "localhost" || h === "" || location.protocol === "file:") {
      return "https://wuz5566tt-oss.github.io/office/";
    }
    return new URL("../office/", location.href).href;
  }

  /* ---- audio: start only after a user tap ---- */
  function syncAudioUi() {
    if (!audioBtn || !ambient) return;
    var muted = ambient.muted || ambient.paused;
    audioBtn.classList.toggle("is-muted", muted);
    audioBtn.setAttribute("aria-pressed", muted ? "false" : "true");
    audioBtn.setAttribute("aria-label", muted ? "開啟音境" : "關閉音境");
  }
  function startAudio() {
    if (!ambient) return;
    if (audioBtn) audioBtn.hidden = false;
    ambient.volume = 0.42;
    ambient.muted = false;
    var p = ambient.play();
    if (p && p.catch) p.catch(function () {});
    syncAudioUi();
  }
  if (audioBtn) {
    audioBtn.addEventListener("click", function () {
      if (!ambient) return;
      if (ambient.paused || ambient.muted) {
        startAudio();
      } else {
        ambient.muted = true;
        ambient.pause();
        syncAudioUi();
      }
    });
  }
  if (ambient) {
    ambient.addEventListener("play", syncAudioUi);
    ambient.addEventListener("pause", syncAudioUi);
  }

  function innerUnlocked() {
    try { return sessionStorage.getItem(GATE_SESSION) === "ok"; } catch (e) { return false; }
  }
  function rememberUnlock() {
    try { sessionStorage.setItem(GATE_SESSION, "ok"); } catch (e) {}
  }
  function hexSha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }
  function hideGate() {
    if (innerGate) innerGate.hidden = true;
    if (enterUi) enterUi.classList.remove("gating");
    if (innerErr) innerErr.textContent = "";
    if (innerToken) innerToken.classList.remove("is-wrong");
  }
  function showGate(opts) {
    opts = opts || {};
    startAudio();
    if (pathChoice) pathChoice.hidden = true;
    if (enterUi) {
      enterUi.classList.add("choosing");
      enterUi.classList.add("gating");
    }
    if (innerGate) innerGate.hidden = false;
    if (innerPass && !opts.keepValue) innerPass.value = "";
    if (innerErr && !opts.wrong) innerErr.textContent = "";
    if (innerToken) innerToken.classList.remove("is-wrong");
    setScene("choice");
    if (opts.wrong) applyGateWrong(opts.sample);
    else if (innerPass) later(function () { innerPass.focus(); }, 80);
  }
  function applyGateWrong(sample) {
    if (innerPass && typeof sample === "string") innerPass.value = sample;
    if (innerErr) innerErr.textContent = "暗號有誤，請向師門確認";
    if (innerToken) {
      innerToken.classList.remove("is-wrong");
      void innerToken.offsetWidth;
      innerToken.classList.add("is-wrong");
    }
  }
  function requestInner() {
    startAudio();
    if (innerUnlocked()) {
      hideGate();
      hideChoice();
      enterHall();
      return;
    }
    showGate();
  }
  function submitGate(e) {
    if (e) e.preventDefault();
    if (!innerPass) return;
    var phrase = (innerPass.value || "").trim().toUpperCase();
    if (!phrase) {
      applyGateWrong();
      return;
    }
    if (!window.crypto || !crypto.subtle) {
      if (innerErr) innerErr.textContent = "暗號有誤，請向師門確認";
      return;
    }
    hexSha256(phrase).then(function (hex) {
      if (hex === INNER_GATE_HASH) {
        rememberUnlock();
        hideGate();
        hideChoice();
        enterHall();
      } else {
        applyGateWrong();
        if (innerPass) {
          innerPass.select();
          innerPass.focus();
        }
      }
    }).catch(function () {
      if (innerErr) innerErr.textContent = "暗號有誤，請向師門確認";
    });
  }
  function showChoice() {
    startAudio();
    hideGate();
    if (pathChoice) pathChoice.hidden = false;
    if (enterUi) {
      enterUi.classList.add("choosing");
      enterUi.classList.remove("gating");
    }
    setScene("choice");
  }
  function hideChoice() {
    if (pathChoice) pathChoice.hidden = true;
    if (enterUi) enterUi.classList.remove("choosing");
  }

  function enterHall(opts) {
    opts = opts || {};
    if (entering && !opts.force && !opts.instant) return;
    entering = true;
    clearTimers();
    hideChoice();
    startAudio();

    if (reduce || opts.instant) {
      resetEnterClasses();
      entrance.classList.add("is-gone");
      hall.classList.add("in");
      setScene("hall");
      showNpc(currentNpc);
      entering = false;
      return;
    }

    // ~2.5s cinematic: flash → zoom+blur → fog wipe → hall push-in
    wipe.classList.remove("out", "fog", "mid");
    wipe.classList.add("flash");
    later(function () { entrance.classList.add("is-zoom"); }, 180);
    later(function () {
      wipe.classList.remove("flash");
      wipe.style.opacity = "0";
      void wipe.offsetWidth;
      wipe.classList.add("fog");
      wipe.style.opacity = "";
    }, 700);
    later(function () {
      hall.classList.add("in");
      setScene("hall");
      showNpc(currentNpc);
    }, 1300);
    later(function () { wipe.classList.add("out"); }, 1900);
    later(function () {
      entrance.classList.add("is-gone");
      entering = false;
      if (typeof opts.onDone === "function") opts.onDone();
    }, 2500);

    if (opts.freezeAt) {
      later(function () {
        clearTimers();
        entering = false;
        if (typeof opts.onFreeze === "function") opts.onFreeze();
      }, opts.freezeAt);
    }
  }

  function leaveHall() {
    closeModal();
    clearTimers();
    hall.classList.remove("in");
    wipe.classList.remove("flash", "fog", "mid", "out"); wipe.style.opacity="";
    entrance.classList.remove("is-zoom", "is-midzoom", "is-gone");
    hideChoice();
    hideGate();
    if (swoopEl) swoopEl.classList.remove("on", "is-dive", "mid");
    setScene("entrance");
    entering = false;
    swooping = false;
  }

  function swoopDown(opts) {
    opts = opts || {};
    if (swooping && !opts.force && !opts.freeze) return;
    swooping = true;
    closeModal();
    clearTimers();
    startAudio();
    hideChoice();

    if (reduce && !opts.freeze) {
      location.href = officeUrl();
      return;
    }

    hall.classList.remove("in");
    entrance.classList.remove("is-gone", "is-zoom", "is-midzoom");
    if (swoopEl) {
      swoopEl.classList.remove("is-dive", "mid");
      swoopEl.classList.add("on");
    }
    setScene("swoop");

    if (opts.freeze) {
      if (swoopEl) swoopEl.classList.add("mid");
      swooping = false;
      return;
    }

    void swoopEl.offsetWidth;
    swoopEl.classList.add("is-dive");
    later(function () {
      location.href = officeUrl();
    }, 2000);
  }

  function freezeSwoop() {
    swoopDown({ freeze: true, force: true });
  }

  function showNpc(id) {
    currentNpc = id;
    var npcs = document.querySelectorAll(".hall-stage .npc");
    npcs.forEach(function (el) {
      el.classList.toggle("is-on", el.getAttribute("data-id") === id);
    });
    var array = document.querySelector(".array-btn");
    if (array) {
      array.classList.toggle("is-lit", id === "master" || id === "envoy" || id === "referral");
    }
    document.querySelectorAll(".dock button[data-focus]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-focus") === id);
    });
  }

  var order = ["library", "elder", "master", "envoy", "star", "steward"];
  function shiftNpc(dir) {
    var i = order.indexOf(currentNpc);
    if (i < 0) i = 2;
    i = (i + dir + order.length) % order.length;
    showNpc(order[i]);
  }

  if (enterBtn) enterBtn.addEventListener("click", function () { showChoice(); });
  if (pathInner) pathInner.addEventListener("click", function () { requestInner(); });
  if (pathOuter) pathOuter.addEventListener("click", function () { swoopDown(); });
  if (innerForm) innerForm.addEventListener("submit", submitGate);
  if (innerGateBack) innerGateBack.addEventListener("click", function () { showChoice(); });
  if (backBtn) backBtn.addEventListener("click", leaveHall);
  if (descendBtn) descendBtn.addEventListener("click", function () { swoopDown(); });

  /* swipe on mobile hall */
  var stage = document.getElementById("hall-stage");
  if (stage) {
    var sx = 0, sy = 0, tracking = false;
    stage.addEventListener("pointerdown", function (e) {
      if (!mobile() || !hall.classList.contains("in")) return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    window.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        shiftNpc(dx < 0 ? 1 : -1);
      }
    });
  }

  /* modal */
  var portraits = {
    master: "assets/img/npc-master.webp",
    elder: "assets/img/npc-elder.webp",
    star: "assets/img/npc-star.webp",
    canon: "assets/img/npc-library.webp",
    steward: "assets/img/npc-steward.webp",
    referral: "assets/img/npc-envoy.webp"
  };

  function openPanel(id) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.querySelectorAll(".panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + id);
    });
    var port = modal.querySelector(".portrait img");
    if (port && portraits[id]) {
      port.src = portraits[id];
      port.parentElement.hidden = false;
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    if (sheet) sheet.scrollTop = 0;
    var closer = modal.querySelector(".close-btn");
    if (closer) closer.focus();
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-panel]").forEach(function (el) {
    el.addEventListener("click", function () {
      var id = el.getAttribute("data-panel");
      var focus = el.getAttribute("data-focus");
      if (focus) showNpc(focus);
      if (id) openPanel(id);
    });
  });
  document.querySelectorAll(".dock [data-focus]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (!el.getAttribute("data-panel")) {
        e.stopPropagation();
        showNpc(el.getAttribute("data-focus"));
      }
    });
  });

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.classList.contains("backdrop") || e.target.classList.contains("close-btn")) closeModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
    if (document.body.getAttribute("data-scene") === "hall" && modal && !modal.classList.contains("open")) {
      if (e.key === "ArrowRight") shiftNpc(1);
      if (e.key === "ArrowLeft") shiftNpc(-1);
    }
  });

  var form = document.getElementById("verify-form");
  var msg = document.getElementById("form-msg");
  if (form && msg) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // 不送出至任何伺服器；驗證與開通由後端串接後處理。
      msg.textContent = "驗證編號已送出，請等待 Leo 團隊確認後開通。";
    });
  }

  document.querySelectorAll(".npc-inner img, .portrait img").forEach(function (img) {
    img.addEventListener("error", function () {
      var src = img.getAttribute("src") || "";
      if (src.indexOf(".webp") !== -1) {
        img.src = src.replace(".webp", ".jpg");
        var npc = img.closest(".npc");
        if (npc) npc.classList.add("use-blend");
      }
    });
  });

  /* particles + fireflies */
  var canvas = document.getElementById("dust");
  if (canvas && !reduce && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dots = [], flies = [], running = true;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      dots = [];
      flies = [];
      var area = window.innerWidth * window.innerHeight;
      var desk = window.innerWidth >= 800;
      var n = Math.round(Math.min(220, Math.max(40, area / 12000)));
      var sizeBoost = desk ? 1.25 : 1;
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: (Math.random() * 1.6 + 0.3) * sizeBoost,
          a: Math.random() * 0.4 + 0.1,
          vx: (Math.random() - 0.5) * (desk ? 0.28 : 0.18),
          vy: (Math.random() - 0.5) * (desk ? 0.32 : 0.22) - 0.06,
          tw: Math.random() * Math.PI * 2,
          ts: 0.008 + Math.random() * 0.014
        });
      }
      var fn = Math.round(Math.min(52, Math.max(12, area / 42000)));
      for (var j = 0; j < fn; j++) {
        flies.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight * 0.85,
          r: (Math.random() * 1.8 + 1.1) * sizeBoost,
          a: Math.random() * 0.5 + 0.35,
          vx: (Math.random() - 0.5) * (desk ? 0.4 : 0.25),
          vy: (Math.random() - 0.5) * (desk ? 0.32 : 0.2),
          tw: Math.random() * Math.PI * 2,
          ts: 0.02 + Math.random() * 0.03
        });
      }
    }
    function tick() {
      if (!running) return;
      var w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy; d.tw += d.ts;
        if (d.x < -8) d.x = w + 8;
        if (d.x > w + 8) d.x = -8;
        if (d.y < -8) d.y = h + 8;
        if (d.y > h + 8) d.y = -8;
        var alpha = d.a * (0.5 + 0.5 * Math.sin(d.tw));
        ctx.beginPath();
        ctx.fillStyle = "rgba(243, 230, 196," + alpha + ")";
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      var scene = document.body.getAttribute("data-scene") || "entrance";
      if (scene === "entrance" || scene === "choice") {
        for (var k = 0; k < flies.length; k++) {
          var f = flies[k];
          f.x += f.vx; f.y += f.vy; f.tw += f.ts;
          if (f.x < -10) f.x = w + 10;
          if (f.x > w + 10) f.x = -10;
          if (f.y < -10) f.y = h * 0.8;
          if (f.y > h + 10) f.y = 0;
          var fa = f.a * (0.25 + 0.75 * Math.abs(Math.sin(f.tw)));
          ctx.beginPath();
          ctx.fillStyle = "rgba(255, 236, 170," + fa + ")";
          ctx.shadowColor = "rgba(243, 230, 196," + (fa * 0.9) + ")";
          ctx.shadowBlur = window.innerWidth >= 800 ? 16 : 10;
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      requestAnimationFrame(tick);
    }
    resize(); seed();
    window.addEventListener("resize", function () { resize(); seed(); });
    document.addEventListener("visibilitychange", function () {
      running = document.visibilityState !== "hidden";
      if (running) requestAnimationFrame(tick);
      if (ambient && !ambient.muted) {
        if (running) ambient.play().catch(function () {});
        else ambient.pause();
      }
    });
    requestAnimationFrame(tick);
  }

  function freezeMid() {
    clearTimers();
    entering = false;
    resetEnterClasses();
    hideChoice();
    entrance.classList.add("is-zoom");
    wipe.classList.add("fog", "mid");
    hall.classList.remove("in");
    setScene("entrance");
  }

  function freezeEnterZoom() {
    clearTimers();
    entering = false;
    resetEnterClasses();
    hideChoice();
    hideGate();
    entrance.classList.add("is-midzoom");
    if (wipe) wipe.classList.remove("flash", "fog", "mid", "out");
    setScene("entrance");
  }

  /* desktop depth: lerp pointer into CSS vars, transform only */
  if (!reduce && window.matchMedia &&
      window.matchMedia("(min-width:800px) and (pointer:fine)").matches) {
    var parx = 0, pary = 0, tx = 0, ty = 0;
    function tickParallax() {
      parx += (tx - parx) * 0.06;
      pary += (ty - pary) * 0.06;
      document.body.style.setProperty("--parx", parx.toFixed(4));
      document.body.style.setProperty("--pary", pary.toFixed(4));
      requestAnimationFrame(tickParallax);
    }
    window.addEventListener("pointermove", function (e) {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      tx = (e.clientX / w - 0.5) * 2;
      ty = (e.clientY / h - 0.5) * 2;
    }, { passive: true });
    requestAnimationFrame(tickParallax);
  }

  window.__xianfu = {
    enter: enterHall,
    leave: leaveHall,
    open: openPanel,
    close: closeModal,
    show: showNpc,
    freezeMid: freezeMid,
    freezeEnterZoom: freezeEnterZoom,
    showChoice: showChoice,
    showGate: showGate,
    showGateWrong: function () { showGate({ wrong: true, keepValue: true, sample: "XXXX" }); },
    swoop: swoopDown,
    freezeSwoop: freezeSwoop,
    officeUrl: officeUrl
  };

  var hash = (location.hash || "").replace("#", "");
  if (hash === "hall" || hash.indexOf("panel-") === 0) {
    enterHall({ instant: true });
    if (hash.indexOf("panel-") === 0) {
      later(function () { openPanel(hash.replace("panel-", "")); }, 80);
    }
  } else if (hash === "choice") {
    showChoice();
  } else if (hash === "gate" || hash === "pass") {
    showGate();
  } else if (hash === "swoop") {
    freezeSwoop();
  }

  showNpc("master");
})();
