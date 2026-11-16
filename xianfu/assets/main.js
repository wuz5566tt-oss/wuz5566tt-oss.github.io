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

var STORE_KEY = "leo-xianfu-cultivation";
var TIER_META = {
  shangshang: { name: "上上籤", cls: "tier-ss" },
  shang: { name: "上籤", cls: "tier-s" },
  zhong: { name: "中籤", cls: "tier-z" },
  an: { name: "安籤", cls: "tier-a" }
};
var SLIPS = [
  { text: "先問自己虧得起多少，再決定要不要出手。", tier: "an" },
  { text: "活得久，才看得到下一輪的機會。", tier: "shangshang" },
  { text: "行情不會因為你着急，就提前給答案。", tier: "zhong" },
  { text: "忍住沒把握的手，也是一種功夫。", tier: "shang" },
  { text: "看懂再進；看不懂，就在旁邊看。", tier: "zhong" },
  { text: "倉位是火候，過旺則焦，過弱則生。", tier: "shang" },
  { text: "今天少做一個衝動的決定，明日會謝謝自己。", tier: "zhong" },
  { text: "市場沒有義務成全任何人。", tier: "an" },
  { text: "複盤比預測重要，把走過的路看清楚。", tier: "shang" },
  { text: "安靜，也是交易的一部分。", tier: "zhong" },
  { text: "把風險放在前面想，把期望放在後面放。", tier: "zhong" },
  { text: "不必每天都有動作，有些日子適合按兵。", tier: "an" },
  { text: "計劃寫在進場之前，情緒留在場外。", tier: "shang" },
  { text: "一次定江山的念頭，往往最危險。", tier: "zhong" },
  { text: "守住本金，才有下一手的資格。", tier: "shangshang" },
  { text: "別人的捷徑，常常是你看不見的代價。", tier: "an" },
  { text: "盤面會說話，但只說給願意等的人聽。", tier: "shang" },
  { text: "賺錢的記憶很甜，虧錢的功課更真。", tier: "zhong" },
  { text: "選對時機，比選對說法重要。", tier: "zhong" },
  { text: "心一亂，手就會跟著亂。先安住。", tier: "shang" },
  { text: "機會還會來，但狀態回不來就晚了。", tier: "zhong" },
  { text: "把「一定」兩個字，從盤前的句子裡拿掉。", tier: "an" },
  { text: "小虧是學費，大虧才是災難。先設停損。", tier: "shang" },
  { text: "同路人可同行，判斷仍要自己做。", tier: "zhong" },
  { text: "熱鬧的時候更要慢，冷清的時候更要穩。", tier: "zhong" },
  { text: "修行在日常，不在某一筆。", tier: "an" },
  { text: "先學會在市場活下來。", tier: "shangshang" },
  { text: "今日所忍，是明日的餘地。", tier: "shang" }
];
function slipOf(i) { return SLIPS[i] || SLIPS[0]; }
var REALMS = [
  { name: "練氣", min: 0, next: 30 },
  { name: "築基", min: 30, next: 80 },
  { name: "金丹", min: 80, next: 160 },
  { name: "元嬰", min: 160, next: null }
];
var QI_GAIN = { checkin: 5, slip: 3, chapter: 8 };
var LOTUS_SVG = '<svg class="lotus" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true"><path d="M18 30c-2.2-4.2-3-8-3-11 2.2 1.2 4.2 1.4 6 0 0 3-.8 6.8-3 11z"/><path d="M18 20c-3.5-1.4-7-1.2-10 .6 2.6-4 6-6.6 10-8-1.6 2.8-1.6 5.2 0 7.4z"/><path d="M18 20c3.5-1.4 7-1.2 10 .6-2.6-4-6-6.6-10-8 1.6 2.8 1.6 5.2 0 7.4z"/><path d="M18 18c-1.8-3.4-1.2-7.2 1.2-10.4C16 9 13.4 11.4 12 15c2.2 1 4.2 1.6 6 3z"/><path d="M18 18c1.8-3.4 1.2-7.2-1.2-10.4C20 9 22.6 11.4 24 15c-2.2 1-4.2 1.6-6 3z"/><circle cx="18" cy="17.5" r="2.1"/></svg>';

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var entrance = document.getElementById("entrance");
  var hall = document.getElementById("hall");
  var outer = document.getElementById("outer");
  var wipe = document.getElementById("wipe");
  var enterBtn = document.getElementById("enter-btn");
  var backBtn = document.getElementById("back-btn");
  var outerBackBtn = document.getElementById("outer-back-btn");
  var toOuterBtn = document.getElementById("to-outer-btn");
  var toMortalBtn = document.getElementById("to-mortal-btn");
  var toInnerBtn = document.getElementById("to-inner-btn");
  var pathChoice = document.getElementById("path-choice");
  var pathInner = document.getElementById("path-inner");
  var pathOuter = document.getElementById("path-outer");
  var pathMortal = document.getElementById("path-mortal");
  var innerGate = document.getElementById("inner-gate");
  var innerForm = document.getElementById("inner-gate-form");
  var innerPass = document.getElementById("inner-pass");
  var innerToken = document.getElementById("inner-token");
  var innerErr = document.getElementById("inner-gate-err");
  var innerGateBack = document.getElementById("inner-gate-back");
  var enterUi = document.querySelector(".enter-ui");
  var GATE_SESSION = "leo-xianfu-inner";
  var swoopEl = document.getElementById("swoop");
  var glideEl = document.getElementById("glide");
  var ambient = document.getElementById("ambient");
  var audioBtn = document.getElementById("audio-toggle");
  var modal = document.getElementById("modal");
  var sheet = modal && modal.querySelector(".sheet");
  var entering = false;
  var swooping = false;
  var gliding = false;
  var lastFocus = null;
  var timers = [];
  var mobile = function () { return window.matchMedia("(max-width: 799px)").matches; };
  var currentNpc = "master";
  var currentOuterNpc = "guard";
  var hallOrder = ["library", "elder", "master", "coach", "envoy", "star", "steward"];
  var outerOrder = ["guard", "alchemy", "oracle", "heroes", "guide"];

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
    if (outer) outer.setAttribute("aria-hidden", name === "outer" ? "false" : "true");
    if (swoopEl) swoopEl.setAttribute("aria-hidden", name === "swoop" ? "false" : "true");
    if (glideEl) glideEl.setAttribute("aria-hidden", name === "glide" ? "false" : "true");
  }

  function resetEnterClasses() {
    entrance.classList.remove("is-zoom", "is-midzoom", "is-gone", "is-ascend");
    hall.classList.remove("in");
    if (outer) outer.classList.remove("in");
    if (wipe) wipe.classList.remove("flash", "fog", "mid", "out");
    if (swoopEl) swoopEl.classList.remove("on", "is-dive", "mid");
    if (glideEl) glideEl.classList.remove("on", "is-fly", "mid");
  }

  function officeUrl() {
    var h = location.hostname;
    if (h === "127.0.0.1" || h === "localhost" || h === "" || location.protocol === "file:") {
      return "https://wuz5566tt-oss.github.io/office/";
    }
    return new URL("../office/", location.href).href;
  }

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
    if (outer && outer.classList.contains("in")) {
      leaveToEntrance({ keepAudio: true });
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
    closeAllOmens();
    var fromOuter = !!(outer && outer.classList.contains("in"));

    if (reduce || opts.instant) {
      resetEnterClasses();
      entrance.classList.add("is-gone");
      if (outer) outer.classList.remove("in");
      hall.classList.add("in");
      setScene("hall");
      showNpc(currentNpc, hall);
      renderCult();
      entering = false;
      if (!opts.silent && !opts.freezeAt) later(maybeShowDuty, 400);
      return;
    }

    if (fromOuter) {
      wipe.classList.remove("out", "flash", "mid");
      wipe.classList.add("fog");
      later(function () {
        outer.classList.remove("in");
        hall.classList.add("in");
        entrance.classList.add("is-gone");
        setScene("hall");
        showNpc(currentNpc, hall);
        renderCult();
      }, 500);
      later(function () { wipe.classList.add("out"); }, 1100);
      later(function () {
        entering = false;
        maybeShowDuty();
        if (typeof opts.onDone === "function") opts.onDone();
      }, 1600);
      return;
    }

    wipe.classList.remove("out", "fog", "mid");
    wipe.classList.add("flash");
    later(function () { entrance.classList.add("is-zoom", "is-ascend"); }, 180);
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
      showNpc(currentNpc, hall);
      renderCult();
    }, 1300);
    later(function () { wipe.classList.add("out"); }, 1900);
    later(function () {
      entrance.classList.add("is-gone");
      entering = false;
      maybeShowDuty();
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

  function enterOuter(opts) {
    opts = opts || {};
    if (gliding && !opts.force && !opts.instant && !opts.freeze) return;
    gliding = true;
    closeModal();
    closeAllOmens();
    clearTimers();
    startAudio();
    hideChoice();
    hideGate();
    var fromHall = !!(hall && hall.classList.contains("in"));

    function land() {
      if (swoopEl) swoopEl.classList.remove("on", "is-dive", "mid");
      if (glideEl) glideEl.classList.remove("on", "is-fly", "mid");
      hall.classList.remove("in");
      entrance.classList.add("is-gone");
      if (outer) outer.classList.add("in");
      setScene("outer");
      showNpc(currentOuterNpc, outer);
      renderCult();
      gliding = false;
      entering = false;
    }

    if (reduce || opts.instant) {
      resetEnterClasses();
      land();
      return;
    }

    if (fromHall) {
      wipe.classList.remove("out", "flash", "mid");
      wipe.classList.add("fog");
      later(function () { land(); }, 500);
      later(function () { wipe.classList.add("out"); }, 1100);
      return;
    }

    if (opts.freeze) {
      if (glideEl) {
        glideEl.classList.add("on", "mid");
      }
      hall.classList.remove("in");
      setScene("glide");
      gliding = false;
      return;
    }

    hall.classList.remove("in");
    entrance.classList.remove("is-gone", "is-zoom", "is-midzoom", "is-ascend");
    if (glideEl) {
      glideEl.classList.remove("is-fly", "mid");
      glideEl.classList.add("on");
    }
    setScene("glide");
    void glideEl.offsetWidth;
    glideEl.classList.add("is-fly");
    later(function () {
      land();
      if (glideEl) {
        glideEl.classList.remove("on", "is-fly");
      }
    }, 2100);
  }

  function leaveToEntrance(opts) {
    opts = opts || {};
    closeModal();
    closeAllOmens();
    clearTimers();
    hall.classList.remove("in");
    if (outer) outer.classList.remove("in");
    wipe.classList.remove("flash", "fog", "mid", "out"); wipe.style.opacity = "";
    entrance.classList.remove("is-zoom", "is-midzoom", "is-gone", "is-ascend");
    hideChoice();
    hideGate();
    if (swoopEl) swoopEl.classList.remove("on", "is-dive", "mid");
    if (glideEl) glideEl.classList.remove("on", "is-fly", "mid");
    setScene("entrance");
    entering = false;
    swooping = false;
    gliding = false;
  }

  function swoopDown(opts) {
    opts = opts || {};
    if (swooping && !opts.force && !opts.freeze) return;
    swooping = true;
    closeModal();
    closeAllOmens();
    clearTimers();
    startAudio();
    hideChoice();

    if (reduce && !opts.freeze) {
      location.href = officeUrl();
      return;
    }

    hall.classList.remove("in");
    if (outer) outer.classList.remove("in");
    entrance.classList.remove("is-gone", "is-zoom", "is-midzoom", "is-ascend");
    if (glideEl) glideEl.classList.remove("on", "is-fly", "mid");
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
  function freezeGlide() {
    enterOuter({ freeze: true, force: true });
  }

  function activeRoot() {
    var scene = document.body.getAttribute("data-scene");
    if (scene === "outer") return outer;
    return hall;
  }

  function showNpc(id, root) {
    root = root || activeRoot();
    if (!root) return;
    if (root === outer) currentOuterNpc = id;
    else currentNpc = id;
    root.querySelectorAll(".hall-stage .npc").forEach(function (el) {
      el.classList.toggle("is-on", el.getAttribute("data-id") === id);
    });
    var array = root.querySelector(".array-btn");
    if (array) {
      array.classList.toggle("is-lit", id === "master" || id === "envoy" || id === "referral");
    }
    root.querySelectorAll(".dock button[data-focus]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-focus") === id);
    });
  }

  function shiftNpc(dir) {
    var root = activeRoot();
    var order = root === outer ? outerOrder : hallOrder;
    var cur = root === outer ? currentOuterNpc : currentNpc;
    var i = order.indexOf(cur);
    if (i < 0) i = 0;
    i = (i + dir + order.length) % order.length;
    showNpc(order[i], root);
  }

  if (enterBtn) enterBtn.addEventListener("click", function () { showChoice(); });
  if (pathInner) pathInner.addEventListener("click", function () { requestInner(); });
  if (pathOuter) pathOuter.addEventListener("click", function () { enterOuter(); });
  if (pathMortal) pathMortal.addEventListener("click", function () { swoopDown(); });
  if (innerForm) innerForm.addEventListener("submit", submitGate);
  if (innerGateBack) innerGateBack.addEventListener("click", function () { showChoice(); });
  if (backBtn) backBtn.addEventListener("click", function () { leaveToEntrance(); });
  if (outerBackBtn) outerBackBtn.addEventListener("click", function () { leaveToEntrance(); });
  if (toOuterBtn) toOuterBtn.addEventListener("click", function () { enterOuter(); });
  if (toMortalBtn) toMortalBtn.addEventListener("click", function () { swoopDown(); });
  if (toInnerBtn) toInnerBtn.addEventListener("click", function () { requestInner(); });

  function bindSwipe(stage) {
    if (!stage) return;
    var sx = 0, sy = 0, tracking = false;
    stage.addEventListener("pointerdown", function (e) {
      var root = stage.closest("section");
      if (!mobile() || !root || !root.classList.contains("in")) return;
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
  bindSwipe(document.getElementById("hall-stage"));
  bindSwipe(document.getElementById("outer-stage"));

  var portraits = {
    master: "assets/img/npc-master.webp",
    elder: "assets/img/npc-elder.webp",
    star: "assets/img/npc-star.webp",
    canon: "assets/img/npc-library.webp",
    steward: "assets/img/npc-steward.webp",
    referral: "assets/img/npc-envoy.webp",
    coach: "assets/img/npc-coach.webp",
    guard: "assets/img/npc-guard.webp",
    alchemy: "assets/img/npc-alchemist.webp",
    oracle: "assets/img/npc-oracle.webp",
    heroes: "assets/img/hero-stele.webp",
    guide: "assets/img/npc-guide.webp"
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
    if (id === "canon") renderChapters();
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
      var root = el.closest("#outer") || el.closest("#hall") || activeRoot();
      if (focus) showNpc(focus, root);
      if (id) openPanel(id);
    });
  });

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.classList.contains("backdrop") || e.target.classList.contains("close-btn")) closeModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (document.querySelector(".omen.open")) closeAllOmens();
      else closeModal();
    }
    var scene = document.body.getAttribute("data-scene");
    if ((scene === "hall" || scene === "outer") && modal && !modal.classList.contains("open") && !document.querySelector(".omen.open")) {
      if (e.key === "ArrowRight") shiftNpc(1);
      if (e.key === "ArrowLeft") shiftNpc(-1);
    }
  });

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

  /* ---------- 修為 / 籤 / 閉關 ---------- */
  function defaultState() {
    return {
      qi: 0,
      realm: 0,
      chapters: {},
      checkin: { last: "", streak: 0, total: 0, milestones: [] },
      slips: { last: "", todayIndex: null, collected: [] },
      dutyShown: "",
      missTold: "",
      outer: { guard: false, alchemy: false, promoted: false, promoteShown: false }
    };
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      var s = JSON.parse(raw);
      var d = defaultState();
      s.qi = +s.qi || 0;
      s.realm = +s.realm || 0;
      s.chapters = s.chapters || {};
      s.checkin = Object.assign(d.checkin, s.checkin || {});
      s.slips = Object.assign(d.slips, s.slips || {});
      s.slips.collected = Array.isArray(s.slips.collected) ? s.slips.collected : [];
      s.outer = Object.assign(d.outer, s.outer || {});
      return Object.assign(d, s);
    } catch (e) {
      return defaultState();
    }
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  var state = loadState();

  function taipeiDate(d) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(d || new Date());
  }
  function prevIso(iso) {
    var p = iso.split("-").map(Number);
    var dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  }
  function todayDuties() {
    var t = taipeiDate();
    return {
      slip: state.slips.last === t,
      checkin: state.checkin.last === t,
      read: !!state.chapters._readOn && state.chapters._readOn === t
    };
  }
  function allDutyDone() {
    var d = todayDuties();
    return d.slip && d.checkin && d.read;
  }
  function realmFor(qi) {
    var i = 0;
    for (var n = 0; n < REALMS.length; n++) {
      if (qi >= REALMS[n].min) i = n;
    }
    return i;
  }
  function addQi(n) {
    var prev = realmFor(state.qi);
    state.qi += n;
    var next = realmFor(state.qi);
    if (next > state.realm) state.realm = next;
    saveState();
    renderCult();
    if (next > prev) playBreakthrough(next);
  }

  function renderCult() {
    var badge = document.getElementById("realm-badge");
    var fill = document.getElementById("qi-fill");
    var bar = document.getElementById("qi-bar");
    var i = realmFor(state.qi);
    state.realm = Math.max(state.realm, i);
    var r = REALMS[state.realm];
    if (badge) badge.textContent = r.name;
    if (fill && bar) {
      var span = (r.next == null) ? 1 : (state.qi - r.min) / (r.next - r.min);
      fill.style.width = Math.max(0, Math.min(1, span)) * 100 + "%";
      bar.setAttribute("aria-label", "靈氣 · " + r.name);
    }
    var ob = document.getElementById("outer-badge");
    if (ob) {
      ob.textContent = state.outer.promoted ? "外門弟子" : "遊山";
      ob.classList.toggle("is-outer", true);
    }
    renderChapters();
    renderDuty();
    renderSlips();
    renderRetreat();
  }

  function renderChapters() {
    document.querySelectorAll(".read-btn[data-chapter]").forEach(function (btn) {
      var id = btn.getAttribute("data-chapter");
      var done = !!state.chapters[id];
      btn.classList.toggle("is-read", done);
      btn.textContent = done ? "已閱" : "記為已閱";
    });
    document.querySelectorAll(".read-btn[data-outer-read]").forEach(function (btn) {
      var key = btn.getAttribute("data-outer-read");
      var done = !!state.outer[key];
      btn.classList.toggle("is-read", done);
      btn.textContent = done ? "已閱" : "掩卷，記為已閱";
    });
  }

  function markChapter(id) {
    if (state.chapters[id]) return;
    state.chapters[id] = true;
    state.chapters._readOn = taipeiDate();
    saveState();
    addQi(QI_GAIN.chapter);
    renderDuty();
  }

  function markOuterRead(key) {
    if (state.outer[key]) return;
    state.outer[key] = true;
    saveState();
    renderChapters();
    maybePromote();
  }

  function maybePromote() {
    if (state.outer.promoted) return;
    if (state.outer.guard && state.outer.alchemy) {
      state.outer.promoted = true;
      saveState();
      renderCult();
      if (!state.outer.promoteShown) {
        state.outer.promoteShown = true;
        saveState();
        closeModal();
        openOmen("promote-omen");
      }
    }
  }

  function tomorrowText() {
    if (!allDutyDone()) return "";
    var streak = state.checkin.last === taipeiDate() ? state.checkin.streak : 0;
    if (streak === 6) return "今日功課已了。明日再來：蓮燈將滿七日。";
    if (streak === 20) return "今日功課已了。明日再來：將滿三七日。";
    if (streak === 48) return "今日功課已了。明日再來：將滿七七之數。";
    if (state.slips.collected.length >= SLIPS.length) {
      return "今日功課已了。籤譜已滿，明日再求，溫故而知新；蓮燈亦可續燃。";
    }
    return "今日功課已了。明日再來：可再求一支新籤，並續燃蓮燈。";
  }

  function renderDuty() {
    var d = todayDuties();
    var map = { slip: d.slip, checkin: d.checkin, read: d.read };
    document.querySelectorAll("#duty-list li[data-duty]").forEach(function (li) {
      li.classList.toggle("is-done", !!map[li.getAttribute("data-duty")]);
    });
    var hint = document.getElementById("tomorrow-hint");
    if (hint) {
      var text = tomorrowText();
      hint.hidden = !text;
      if (text) hint.textContent = text;
    }
  }

  function maybeShowDuty() {
    if (document.body.getAttribute("data-scene") !== "hall") return;
    checkMissedStreak();
    var t = taipeiDate();
    if (state.dutyShown === t) return;
    state.dutyShown = t;
    saveState();
    openOmen("duty-omen");
  }

  function hashStr(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function pickSlip() {
    var collected = {};
    state.slips.collected.forEach(function (i) { collected[i] = true; });
    var start = hashStr(taipeiDate() + "-leo-slip") % SLIPS.length;
    var i, idx;
    for (i = 0; i < SLIPS.length; i++) {
      idx = (start + i) % SLIPS.length;
      if (!collected[idx]) return idx;
    }
    return start;
  }

  function paintSeal(el, meta, on) {
    if (!el) return;
    if (!on || !meta) {
      el.hidden = true;
      el.textContent = "";
      el.className = "seal";
      return;
    }
    el.hidden = false;
    el.className = "seal " + meta.cls;
    el.textContent = meta.name;
  }

  function renderSlips() {
    var t = taipeiDate();
    var res = document.getElementById("slip-result");
    var text = document.getElementById("slip-text");
    var tierEl = document.getElementById("tier-label");
    var note = document.getElementById("slip-note");
    var count = document.getElementById("album-count");
    var grid = document.getElementById("album-grid");
    var hint = document.getElementById("tube-hint");
    var drawn = state.slips.last === t && state.slips.todayIndex != null;
    var slip = drawn ? slipOf(state.slips.todayIndex) : null;
    var meta = slip ? TIER_META[slip.tier] : null;
    if (res) {
      res.hidden = !drawn;
      res.classList.remove("tier-ss", "tier-s", "tier-z", "tier-a");
      if (meta) res.classList.add(meta.cls);
    }
    if (drawn && text) text.textContent = slip.text;
    if (tierEl) tierEl.textContent = meta ? meta.name : "";
    if (note) {
      note.hidden = !drawn;
      note.textContent = drawn ? "今日之籤已定，明日再來。仍可輕搖籤筒，只是不再出籤。" : "";
    }
    if (hint) {
      hint.hidden = !!drawn;
    }
    var resSeal = document.getElementById("result-seal");
    paintSeal(resSeal, meta, drawn);
    var n = state.slips.collected.length;
    if (count) count.textContent = "已收集 " + n + "/" + SLIPS.length;
    if (grid && !grid.childElementCount) {
      var html = "", k;
      for (k = 0; k < SLIPS.length; k++) html += "<li data-i=\"" + k + "\"></li>";
      grid.innerHTML = html;
    }
    if (grid) {
      var have = {};
      state.slips.collected.forEach(function (i) { have[i] = true; });
      grid.querySelectorAll("li").forEach(function (li) {
        var i = +li.getAttribute("data-i");
        var owned = !!have[i];
        var s = slipOf(i);
        var tm = TIER_META[s.tier];
        li.classList.toggle("is-empty", !owned);
        li.classList.remove("tier-ss", "tier-s", "tier-z", "tier-a");
        if (owned && tm) li.classList.add(tm.cls);
        li.innerHTML = owned ? "<span class=\"no\">" + String(i + 1).padStart(2, "0") + "</span>" : "";
        li.title = owned ? (tm.name + " · " + s.text) : "未收錄";
      });
    }
  }

  function commitSlip(idx) {
    var t = taipeiDate();
    if (state.slips.last === t && state.slips.todayIndex != null) return state.slips.todayIndex;
    if (idx == null) idx = pickSlip();
    state.slips.last = t;
    state.slips.todayIndex = idx;
    if (state.slips.collected.indexOf(idx) < 0) state.slips.collected.push(idx);
    saveState();
    addQi(QI_GAIN.slip);
    renderDuty();
    return idx;
  }

  function drawSlip() {
    var t = taipeiDate();
    if (state.slips.last === t && state.slips.todayIndex != null) {
      renderSlips();
      return;
    }
    startSlipCinematic(commitSlip());
  }

  function checkMissedStreak() {
    var t = taipeiDate();
    var last = state.checkin.last;
    if (!last || last === t || last === prevIso(t)) return false;
    if (state.checkin.streak > 0) {
      state.checkin.streak = 0;
      saveState();
    }
    return state.missTold !== t;
  }

  function renderRetreat() {
    var t = taipeiDate();
    var missed = checkMissedStreak();
    var row = document.getElementById("lotus-row");
    if (row && !row.childElementCount) {
      var i, html = "";
      for (i = 0; i < 7; i++) html += LOTUS_SVG;
      row.innerHTML = html;
    }
    var streak = state.checkin.streak;
    var lit = 0;
    if (state.checkin.last === t || (streak > 0 && state.checkin.last === prevIso(t))) {
      lit = streak <= 0 ? 0 : ((streak - 1) % 7) + 1;
    }
    if (row) {
      row.querySelectorAll(".lotus").forEach(function (el, i) {
        el.classList.toggle("is-lit", i < lit);
      });
    }
    var lab = document.getElementById("retreat-streak");
    if (lab) lab.textContent = "連續閉關 " + streak + " 日";
    var msg = document.getElementById("retreat-msg");
    var go = document.getElementById("retreat-go");
    var done = state.checkin.last === t;
    if (go) {
      go.disabled = done;
      go.textContent = done ? "今日已閉關" : "今日閉關";
    }
    if (msg) {
      if (done) msg.textContent = "今日燈已點起。把這份定靜，帶到明日即可。";
      else if (missed && state.missTold !== t) {
        msg.textContent = "燈火已歇，並非功虧。今日重新點起便是。修行本就有停有續，不必苛責自己。";
      } else {
        msg.textContent = "點起今日的蓮燈，把盤後的心安住。";
      }
    }
  }

  function doCheckin() {
    var t = taipeiDate();
    if (state.checkin.last === t) return;
    var missed = state.checkin.last && state.checkin.last !== prevIso(t);
    if (missed) state.checkin.streak = 0;
    state.checkin.streak += 1;
    state.checkin.total += 1;
    state.checkin.last = t;
    if (missed) state.missTold = t;
    saveState();
    addQi(QI_GAIN.checkin);
    renderRetreat();
    renderDuty();
    var st = state.checkin.streak;
    if ((st === 7 || st === 21 || st === 49) && state.checkin.milestones.indexOf(st) < 0) {
      state.checkin.milestones.push(st);
      saveState();
      var text = st === 7
        ? "七日閉關圓滿，心燈長明。"
        : st === 21
          ? "三七日圓滿，火候漸穩。"
          : "七七既滿，閉關有成。且將這份定靜，帶回日常。";
      var rt = document.getElementById("reward-text");
      if (rt) rt.textContent = text;
      openOmen("reward-omen");
    }
  }

  function playBreakthrough(level) {
    var el = document.getElementById("break-omen");
    var name = document.getElementById("break-name");
    var title = document.getElementById("break-title");
    if (name) name.textContent = REALMS[level].name;
    if (title) title.textContent = "境界已破";
    openOmen("break-omen");
    later(function () { closeOmen("break-omen"); }, reduce ? 1400 : 3000);
  }

  function openOmen(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    if (id === "slip-omen") {
      renderSlips();
      syncAlbumDrawer();
      startTubeLoop();
      if (typeof window.DeviceMotionEvent !== "undefined" &&
          typeof DeviceMotionEvent.requestPermission !== "function") {
        enableMotion();
      }
    }
    if (id === "retreat-omen") {
      if (checkMissedStreak()) {
        state.missTold = taipeiDate();
        saveState();
      }
      renderRetreat();
    }
    if (id === "duty-omen") renderDuty();
  }
  function closeOmen(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    if (id === "slip-omen") stopTubeLoop();
  }
  function closeAllOmens() {
    document.querySelectorAll(".omen.open").forEach(function (el) {
      el.classList.remove("open");
      el.setAttribute("aria-hidden", "true");
    });
    stopTubeLoop();
  }

  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () { closeOmen(el.getAttribute("data-close")); });
  });
  var dutyBtn = document.getElementById("duty-btn");
  var slipBtn = document.getElementById("slip-btn");
  var retreatBtn = document.getElementById("retreat-btn");
  if (dutyBtn) dutyBtn.addEventListener("click", function () { openOmen("duty-omen"); });
  if (slipBtn) slipBtn.addEventListener("click", function () { openOmen("slip-omen"); });
  if (retreatBtn) retreatBtn.addEventListener("click", function () { openOmen("retreat-omen"); });

  document.querySelectorAll("[data-open]").forEach(function (el) {
    el.addEventListener("click", function () {
      var what = el.getAttribute("data-open");
      closeOmen("duty-omen");
      if (what === "slip") openOmen("slip-omen");
      else if (what === "retreat") openOmen("retreat-omen");
      else if (what === "canon") openPanel("canon");
    });
  });

  /* ---- 籤筒物理、聲效、開籤 ---- */
  var tubeRig = document.getElementById("tube-rig");
  var tubeStage = document.getElementById("tube-stage");
  var slipFx = document.getElementById("slip-fx");
  var drawnCard = document.getElementById("drawn-card");
  var motionBtn = document.getElementById("motion-btn");
  var shakeFallback = document.getElementById("shake-fallback");
  var jostleEls = tubeRig ? tubeRig.querySelectorAll(".jostle") : [];
  var tubePhys = { ang: 0, vel: 0, energy: 0, holding: false, drawing: false, lastX: 0, lastClack: 0, auto: false, raf: 0, charge: 0 };
  var stickPhys = [];
  var slipAc = null;
  var motionOn = false;
  var fxParts = [];
  var fxRaf = 0;

  function ensureSlipAudio() {
    if (slipAc) {
      if (slipAc.state === "suspended") slipAc.resume().catch(function () {});
      return slipAc;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    slipAc = new AC();
    return slipAc;
  }
  function playClack(amp) {
    var ac = ensureSlipAudio();
    if (!ac) return;
    amp = Math.max(0.12, Math.min(1, amp || 0.5));
    var t = ac.currentTime;
    var n = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.055), ac.sampleRate);
    var d = n.getChannelData(0);
    var i, len = d.length;
    for (i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / len * 9);
    var src = ac.createBufferSource();
    src.buffer = n;
    var bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1100 + Math.random() * 700;
    bp.Q.value = 3.8;
    var hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 400;
    var g = ac.createGain();
    g.gain.setValueAtTime(0.22 * amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ac.destination);
    var o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = 190 + Math.random() * 90;
    var g2 = ac.createGain();
    g2.gain.setValueAtTime(0.1 * amp, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g2); g2.connect(ac.destination);
    src.start(t); o.start(t); src.stop(t + 0.08); o.stop(t + 0.1);
  }
  function playChime() {
    var ac = ensureSlipAudio();
    if (!ac) return;
    var t = ac.currentTime;
    [660, 880, 1320].forEach(function (f, i) {
      var o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      var g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08 / (i + 1), t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      o.connect(g); g.connect(ac.destination);
      o.start(t + i * 0.05);
      o.stop(t + 1.5);
    });
  }
  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms || 10);
    } catch (e) {}
  }

  function alreadyDrawn() {
    return state.slips.last === taipeiDate() && state.slips.todayIndex != null;
  }

  function applyTubeTransform() {
    if (!tubeRig) return;
    var ang = tubePhys.ang;
    var bob = Math.sin(tubePhys.ang * 0.4) * Math.min(6, tubePhys.energy * 4);
    tubeRig.style.transform = "rotate(" + ang + "deg) translate3d(0," + (-bob) + "px,0)";
    var i, st, el;
    for (i = 0; i < jostleEls.length; i++) {
      st = stickPhys[i];
      if (!st) continue;
      el = jostleEls[i];
      el.style.transform = "rotate(" + st.ang + "deg) translate(" + st.x + "px," + st.y + "px)";
    }
  }

  function tickTube(now) {
    if (!tubeStage || !document.getElementById("slip-omen").classList.contains("open")) {
      tubePhys.raf = 0;
      return;
    }
    if (!tubePhys.drawing) {
      if (tubePhys.holding || tubePhys.auto) {
        tubePhys.vel += Math.sin(now / 55) * (tubePhys.auto ? 2.4 : 1.6);
        tubePhys.energy += tubePhys.auto ? 0.028 : 0.016;
        tubePhys.charge += tubePhys.auto ? 16 : 8;
      }
      tubePhys.vel += -tubePhys.ang * 0.12;
      tubePhys.vel *= 0.9;
      tubePhys.ang += tubePhys.vel;
      if (Math.abs(tubePhys.ang) > 26) {
        tubePhys.ang = 26 * Math.sign(tubePhys.ang);
        tubePhys.vel *= -0.45;
      }
      tubePhys.energy *= 0.985;
      var i, st, force;
      if (!stickPhys.length) {
        for (i = 0; i < jostleEls.length; i++) {
          stickPhys.push({ ang: 0, vel: 0, x: 0, y: 0, xv: 0, yv: 0 });
        }
      }
      for (i = 0; i < stickPhys.length; i++) {
        st = stickPhys[i];
        force = tubePhys.vel * (0.35 + (i % 5) * 0.08) + (Math.random() - 0.5) * tubePhys.energy * 1.4;
        st.vel += force * 0.35;
        st.vel += -st.ang * 0.22;
        st.vel *= 0.82;
        st.ang += st.vel;
        if (Math.abs(st.ang) > 14) { st.ang = 14 * Math.sign(st.ang); st.vel *= -0.5; }
        st.yv += (Math.random() - 0.45) * tubePhys.energy * 0.6;
        st.y += st.yv;
        st.yv *= 0.8;
        st.y *= 0.72;
        st.x *= 0.8;
      }
      if (tubePhys.energy > 0.55 && now - tubePhys.lastClack > 90) {
        tubePhys.lastClack = now;
        playClack(Math.min(1, tubePhys.energy));
        buzz(tubePhys.energy > 0.9 ? [8, 16, 6] : 7);
      }
      if (!alreadyDrawn() && !tubePhys.drawing && tubePhys.energy > 1.05 && tubePhys.charge > 280) {
        beginDraw();
      }
    }
    applyTubeTransform();
    tubePhys.raf = requestAnimationFrame(tickTube);
  }
  function startTubeLoop() {
    if (!tubePhys.raf) tubePhys.raf = requestAnimationFrame(tickTube);
  }
  function stopTubeLoop() {
    if (tubePhys.raf) cancelAnimationFrame(tubePhys.raf);
    tubePhys.raf = 0;
    tubePhys.holding = false;
    tubePhys.auto = false;
    tubePhys.energy = 0;
    tubePhys.vel = 0;
    tubePhys.ang = 0;
    tubePhys.charge = 0;
    if (tubeRig) tubeRig.style.transform = "";
    stickPhys.forEach(function (st) { st.ang = st.vel = st.x = st.y = 0; });
    applyTubeTransform();
  }

  function pointerDown(e) {
    if (tubePhys.drawing) return;
    ensureSlipAudio();
    tubePhys.holding = true;
    tubePhys.auto = false;
    tubePhys.lastX = e.clientX;
    tubePhys.charge = Math.max(tubePhys.charge, 0);
    if (tubeRig && tubeRig.setPointerCapture) {
      try { tubeRig.setPointerCapture(e.pointerId); } catch (err) {}
    }
    startTubeLoop();
    e.preventDefault();
  }
  function pointerMove(e) {
    if (!tubePhys.holding || tubePhys.drawing) return;
    var dx = e.clientX - tubePhys.lastX;
    tubePhys.lastX = e.clientX;
    tubePhys.vel += dx * 0.22;
    tubePhys.energy += Math.abs(dx) * 0.03;
    tubePhys.charge += Math.abs(dx) * 1.4;
    e.preventDefault();
  }
  function pointerUp() {
    if (!tubePhys.holding) return;
    tubePhys.holding = false;
    // short tap: auto-shake fallback
    if (!tubePhys.drawing && tubePhys.charge < 90 && !alreadyDrawn()) {
      startAutoShake();
    }
  }
  function startAutoShake() {
    if (tubePhys.drawing) return;
    ensureSlipAudio();
    if (alreadyDrawn()) { renderSlips(); startTubeLoop(); return; }
    if (reduce) { startSlipCinematic(commitSlip()); return; }
    tubePhys.auto = true;
    tubePhys.energy = Math.max(tubePhys.energy, 0.4);
    tubePhys.charge = 0;
    startTubeLoop();
  }
  function beginDraw() {
    if (tubePhys.drawing || alreadyDrawn()) return;
    tubePhys.drawing = true;
    tubePhys.auto = false;
    tubePhys.holding = false;
    var idx = commitSlip();
    startSlipCinematic(idx);
  }

  function burstParticles(x, y, count, gold) {
    var i;
    for (i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1.2 + Math.random() * (gold ? 4.2 : 2.6);
      fxParts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (gold ? 1.4 : 0.6),
        r: (gold ? 2.2 : 1.4) + Math.random() * 2,
        a: 0.9, life: gold ? 1 : 0.7,
        g: gold ? 0.04 : 0.07,
        c: gold ? "255,220,140" : "232,215,168"
      });
    }
    if (!fxRaf) fxRaf = requestAnimationFrame(tickFx);
  }
  function tickFx() {
    var c = slipFx;
    if (!c) { fxRaf = 0; return; }
    var ctx = c.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.floor(innerWidth * dpr) || c.height !== Math.floor(innerHeight * dpr)) {
      c.width = Math.floor(innerWidth * dpr);
      c.height = Math.floor(innerHeight * dpr);
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var next = [], i, p;
    for (i = 0; i < fxParts.length; i++) {
      p = fxParts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= p.g; p.a = Math.max(0, p.life);
      if (p.life <= 0) continue;
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + p.c + "," + p.a + ")";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    fxParts = next;
    if (fxParts.length) fxRaf = requestAnimationFrame(tickFx);
    else { ctx.clearRect(0, 0, innerWidth, innerHeight); fxRaf = 0; }
  }

  function startSlipCinematic(idx, opts) {
    opts = opts || {};
    var slip = slipOf(idx);
    var meta = TIER_META[slip.tier];
    var gold = slip.tier === "shangshang";
    if (tubeStage) {
      tubeStage.classList.remove("is-rising", "is-pop", "tier-ss", "tier-s", "tier-z", "tier-a");
      tubeStage.classList.add(meta.cls);
    }
    if (reduce) {
      renderSlips();
      tubePhys.drawing = false;
      return;
    }
    var rise = document.getElementById("rising-stick");
    if (rise) rise.hidden = false;
    if (tubeStage) tubeStage.classList.add("is-rising");
    later(function () {
      if (tubeStage) {
        tubeStage.classList.remove("is-rising");
        tubeStage.classList.add("is-pop");
      }
      playClack(1);
      if (gold) playChime();
      buzz(gold ? [16, 30, 16, 30, 40] : [12, 20, 18]);
      var rect = tubeRig ? tubeRig.getBoundingClientRect() : { left: innerWidth / 2, top: 200, width: 0, height: 0 };
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + 24;
      burstParticles(cx, cy, gold ? 70 : 36, gold);
    }, opts.riseAt || 1050);
    later(function () {
      showUnroll(idx, gold);
    }, opts.unrollAt || 1750);
  }

  function showUnroll(idx, gold) {
    var slip = slipOf(idx);
    var meta = TIER_META[slip.tier];
    if (!drawnCard) { renderSlips(); tubePhys.drawing = false; return; }
    var flyT = document.getElementById("fly-tier");
    var flyX = document.getElementById("fly-text");
    var flySeal = document.getElementById("fly-seal");
    if (flyT) flyT.textContent = meta.name;
    if (flyX) flyX.textContent = slip.text;
    paintSeal(flySeal, meta, true);
    drawnCard.className = "drawn-card is-unroll " + meta.cls;
    drawnCard.hidden = false;
    if (tubeStage) tubeStage.classList.add("is-unrolling");
    var stage = tubeStage ? tubeStage.getBoundingClientRect() : tubeRig.getBoundingClientRect();
    drawnCard.style.left = (stage.left + stage.width / 2) + "px";
    drawnCard.style.top = (stage.top + Math.min(110, stage.height * 0.38)) + "px";
    drawnCard.style.transform = "translate(-50%,-50%) scale(1)";
    drawnCard.style.opacity = "1";
    if (gold) {
      var r = drawnCard.getBoundingClientRect();
      burstParticles(r.left + r.width / 2, r.top + r.height / 2, 48, true);
    }
  }


  function albumDrawerEl() { return document.getElementById("slip-album"); }
  function setAlbumOpen(open) {
    var album = albumDrawerEl();
    var handle = document.getElementById("album-handle");
    if (!album) return;
    album.classList.toggle("is-open", !!open);
    if (handle) handle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function syncAlbumDrawer() {
    setAlbumOpen(window.innerWidth >= 800);
  }
  (function bindAlbumDrawer() {
    var album = albumDrawerEl();
    var handle = document.getElementById("album-handle");
    if (!album || !handle) return;
    handle.addEventListener("click", function () {
      setAlbumOpen(!album.classList.contains("is-open"));
    });
    var startY = 0, tracking = false;
    album.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      tracking = true;
      startY = e.clientY;
    });
    album.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dy = e.clientY - startY;
      if (dy < -36) setAlbumOpen(true);
      else if (dy > 36) setAlbumOpen(false);
    });
    album.addEventListener("pointercancel", function () { tracking = false; });
  })();

  function flyToAlbum(idx) {
    if (!drawnCard) return;
    setAlbumOpen(true);
    later(function () {
    var cell = document.querySelector("#album-grid li[data-i=\"" + idx + "\"]");
    if (!cell) {
      renderSlips();
      cell = document.querySelector("#album-grid li[data-i=\"" + idx + "\"]");
    }
    var res = document.getElementById("slip-result");
    if (res) res.hidden = true;
    if (!cell) {
      renderSlips();
      drawnCard.hidden = true;
      tubePhys.drawing = false;
      return;
    }
    var r = cell.getBoundingClientRect();
    drawnCard.classList.add("is-fly");
    drawnCard.style.left = (r.left + r.width / 2) + "px";
    drawnCard.style.top = (r.top + r.height / 2) + "px";
    drawnCard.style.transform = "translate(-50%,-50%) scale(0.18)";
    drawnCard.style.opacity = "0.35";
    later(function () {
      renderSlips();
      cell = document.querySelector("#album-grid li[data-i=\"" + idx + "\"]") || cell;
      cell.classList.add("is-arrive");
      drawnCard.hidden = true;
      drawnCard.classList.remove("is-fly", "is-unroll");
      drawnCard.style.transform = "";
      drawnCard.style.left = "";
      drawnCard.style.top = "";
      tubePhys.drawing = false;
      if (tubeStage) tubeStage.classList.remove("is-rising", "is-pop", "is-unrolling");
      var rise = document.getElementById("rising-stick");
      if (rise) rise.hidden = true;
    }, 900);
    }, 80);
  }

  function previewSlip(step, idx) {
    idx = (idx == null) ? 1 : idx; // default 上上籤（籤譜前列） for shots
    tubePhys.previewHold = (step !== "fly");
    tubePhys.drawing = true;
    tubePhys.auto = false;
    tubePhys.holding = false;
    openOmen("slip-omen");
    var slip = slipOf(idx);
    var meta = TIER_META[slip.tier];
    if (tubeStage) {
      tubeStage.classList.remove("is-rising", "is-pop", "tier-ss", "tier-s", "tier-z", "tier-a");
      tubeStage.classList.add(meta.cls);
    }
    if (tubeStage) tubeStage.classList.remove("is-unrolling");
    var rise = document.getElementById("rising-stick");
    if (rise) {
      rise.hidden = true;
      rise.style.animationDelay = "";
      rise.style.animationPlayState = "";
    }
    if (drawnCard) {
      drawnCard.hidden = true;
      drawnCard.className = "drawn-card";
      drawnCard.style.left = "";
      drawnCard.style.top = "";
      drawnCard.style.transform = "";
      drawnCard.style.opacity = "";
    }
    if (step === "shake") {
      tubePhys.ang = -18; tubePhys.energy = 1.4; tubePhys.vel = 0;
      stickPhys.length = 0;
      var i;
      for (i = 0; i < jostleEls.length; i++) {
        stickPhys.push({ ang: (i % 2 ? 11 : -13) + (i * 1.2), vel: 0, x: (i % 3 - 1) * 1.5, y: -3 - (i % 4), xv: 0, yv: 0 });
      }
      applyTubeTransform();
    } else if (step === "rise") {
      tubePhys.ang = -6;
      applyTubeTransform();
      if (rise) {
        rise.hidden = false;
        rise.style.animationDelay = "-0.72s";
        rise.style.animationPlayState = "paused";
      }
      tubeStage.classList.add("is-rising");
    } else if (step === "pop") {
      tubePhys.ang = 4;
      applyTubeTransform();
      if (rise) {
        rise.hidden = false;
        rise.style.animationDelay = "-0.32s";
        rise.style.animationPlayState = "paused";
      }
      tubeStage.classList.add("is-pop");
      var rect = tubeRig.getBoundingClientRect();
      burstParticles(rect.left + rect.width / 2, rect.top + 28, slip.tier === "shangshang" ? 80 : 40, slip.tier === "shangshang");
    } else if (step === "unroll") {
      showUnroll(idx, slip.tier === "shangshang");
    } else if (step === "fly") {
      if (state.slips.collected.indexOf(idx) < 0) state.slips.collected.push(idx);
      state.slips.todayIndex = idx;
      state.slips.last = taipeiDate();
      saveState();
      showUnroll(idx, slip.tier === "shangshang");
      later(function () { flyToAlbum(idx); }, 80);
    }
  }

  if (tubeRig) {
    tubeRig.addEventListener("pointerdown", pointerDown);
    tubeRig.addEventListener("pointermove", pointerMove);
    tubeRig.addEventListener("pointerup", pointerUp);
    tubeRig.addEventListener("pointercancel", pointerUp);
    tubeRig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startAutoShake(); }
    });
  }
  if (shakeFallback) shakeFallback.addEventListener("click", startAutoShake);

  function onMotion(ev) {
    if (tubePhys.drawing || !document.getElementById("slip-omen").classList.contains("open")) return;
    var a = ev.accelerationIncludingGravity || ev.acceleration;
    if (!a) return;
    var mag = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0));
    var g = ev.acceleration ? mag : Math.abs(mag - 9.6);
    if (g > 1.6) {
      tubePhys.vel += (a.x || 0) * 0.35;
      tubePhys.energy += Math.min(0.12, g * 0.04);
      tubePhys.charge += g * 6;
      startTubeLoop();
    }
  }
  function enableMotion() {
    if (motionOn) return;
    motionOn = true;
    window.addEventListener("devicemotion", onMotion, { passive: true });
    if (motionBtn) { motionBtn.hidden = true; }
    var hint = document.getElementById("tube-hint");
    if (hint && !alreadyDrawn()) hint.textContent = "搖動手機，或按住拖曳籤筒";
  }
  if (motionBtn) {
    var isiOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var needsPerm = isiOS && typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function";
    if (needsPerm) {
      motionBtn.hidden = false;
      motionBtn.addEventListener("click", function () {
        ensureSlipAudio();
        DeviceMotionEvent.requestPermission().then(function (state) {
          if (state === "granted") enableMotion();
          else motionBtn.textContent = "未能開啟搖動，請改用拖曳或輕點";
        }).catch(function () {
          motionBtn.textContent = "未能開啟搖動，請改用拖曳或輕點";
        });
      });
    } else if (typeof window.DeviceMotionEvent !== "undefined") {
      /* Android / 多數桌面： omen 開啟時再監聽 */
      motionBtn.hidden = true;
    }
  }

  /* hook fly after unroll hold */
  var _showUnroll = showUnroll;
  showUnroll = function (idx, gold) {
    _showUnroll(idx, gold);
    later(function () { if (!tubePhys.previewHold) flyToAlbum(idx); }, gold ? 2200 : 1500);
  };

  var retreatGo = document.getElementById("retreat-go");
  if (retreatGo) retreatGo.addEventListener("click", doCheckin);

  document.querySelectorAll(".read-btn[data-chapter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-chapter");
      if (state.chapters[id]) return;
      markChapter(id);
    });
  });
  document.querySelectorAll(".read-btn[data-outer-read]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-outer-read");
      if (state.outer[key]) return;
      markOuterRead(key);
    });
  });
  var promoteGo = document.getElementById("promote-go");
  if (promoteGo) {
    promoteGo.addEventListener("click", function () {
      closeOmen("promote-omen");
      if (outer) showNpc("guide", outer);
      openPanel("guide");
    });
  }

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
      if (scene === "entrance" || scene === "choice" || scene === "outer") {
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
    leave: leaveToEntrance,
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
    enterOuter: enterOuter,
    freezeGlide: freezeGlide,
    officeUrl: officeUrl,
    openOmen: openOmen,
    closeOmen: closeOmen,
    renderCult: renderCult,
    previewSlip: previewSlip
  };

  var hash = (location.hash || "").replace("#", "");
  if (hash === "hall" || hash.indexOf("panel-") === 0) {
    enterHall({ instant: true, silent: true });
    if (hash.indexOf("panel-") === 0) {
      later(function () { openPanel(hash.replace("panel-", "")); }, 80);
    }
  } else if (hash === "outer") {
    enterOuter({ instant: true });
  } else if (hash === "choice") {
    showChoice();
  } else if (hash === "gate" || hash === "pass") {
    showGate();
  } else if (hash === "swoop") {
    freezeSwoop();
  } else if (hash === "glide") {
    freezeGlide();
  }

  showNpc("master", hall);
  if (outer) showNpc("guard", outer);
  renderCult();
})();
