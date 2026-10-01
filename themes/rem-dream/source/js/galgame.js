(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fx = document.getElementById("gal-fx");
  const fxVideo = document.getElementById("gal-fx-video");
  const trans = document.getElementById("gal-trans");
  const preview = document.getElementById("gal-preview");
  const body = document.body;
  let wipeLock = false;
  let previewTimer = 0;
  let welcomeBound = false;
  let welcomeReady = false;

  function prefersReduced() {
    return reduceMotion.matches;
  }

  function isHome() {
    return body.classList.contains("layout-index");
  }

  function isFxView(name) {
    const view = name || body.dataset.view;
    return view === "boot" || view === "welcome";
  }

  function playFxVideo() {
    if (!fxVideo) return;
    const play = fxVideo.play();
    if (play && typeof play.catch === "function") {
      play.catch(function () {});
    }
  }

  function playWipe(done) {
    if (prefersReduced()) {
      if (typeof done === "function") done();
      return;
    }
    if (wipeLock) {
      if (typeof done === "function") done();
      return;
    }
    wipeLock = true;
    if (fx) fx.classList.add("is-transitioning");
    body.classList.add("is-switching");
    if (trans) {
      trans.hidden = false;
      trans.classList.remove("is-playing");
      void trans.offsetWidth;
      trans.classList.add("is-playing");
    }
    playFxVideo();
    window.setTimeout(function () {
      if (typeof done === "function") done();
    }, 400);
    window.setTimeout(function () {
      body.classList.remove("is-switching");
      if (fx) fx.classList.remove("is-transitioning");
      if (trans) {
        trans.classList.remove("is-playing");
        trans.hidden = true;
      }
      wipeLock = false;
    }, 1050);
  }

  function showScreen(name, skipWipe) {
    const next = name || "title";
    const apply = function () {
      body.dataset.view = next;
      document.querySelectorAll("[data-screen]").forEach(function (screen) {
        screen.hidden = screen.dataset.screen !== next;
      });
      playFxVideo();
      if (next === "title") {
        if (location.hash && location.hash !== "#") {
          history.replaceState(null, "", location.pathname + location.search);
        }
      } else if (isHome() && next !== "boot" && next !== "welcome") {
        const target = "#" + next;
        if (location.hash !== target) {
          history.replaceState(null, "", target);
        }
      }
    };

    if (skipWipe || body.dataset.view === next) {
      apply();
      return;
    }
    playWipe(apply);
  }

  function navigate(href) {
    if (!href) return;
    if (typeof window.__galSaveMusic === "function") {
      window.__galSaveMusic();
    }
    playWipe(function () {
      window.location.assign(href);
    });
  }

  function enterTitle() {
    if (body.dataset.view !== "welcome" || !welcomeReady) return;
    sessionStorage.setItem("gal-entered", "1");
    if (typeof window.__galStartMusic === "function") {
      window.__galStartMusic();
    }
    showScreen("title");
  }

  function typeWelcome() {
    const line = document.querySelector("[data-welcome-text]");
    const hint = document.querySelector(".welcome-hint");
    if (!line) {
      welcomeReady = true;
      if (hint) hint.hidden = false;
      return;
    }
    const text = line.getAttribute("data-welcome-text") || "";
    let index = 0;
    welcomeReady = false;
    line.textContent = "";
    line.classList.add("is-typing");
    if (hint) hint.hidden = true;

    if (prefersReduced()) {
      line.textContent = text;
      line.classList.remove("is-typing");
      welcomeReady = true;
      if (hint) hint.hidden = false;
      return;
    }

    const timer = window.setInterval(function () {
      index += 1;
      line.textContent = text.slice(0, index);
      if (index >= text.length) {
        window.clearInterval(timer);
        line.classList.remove("is-typing");
        welcomeReady = true;
        if (hint) hint.hidden = false;
      }
    }, 110);
  }

  function bindWelcome() {
    if (welcomeBound) return;
    welcomeBound = true;

    document.addEventListener("dblclick", function (event) {
      event.preventDefault();
      enterTitle();
    });

    function lockGateScroll(event) {
      if (isFxView()) {
        event.preventDefault();
      }
    }

    document.addEventListener("wheel", lockGateScroll, { passive: false });
    document.addEventListener("touchmove", lockGateScroll, { passive: false });
  }

  document.addEventListener("click", function (event) {
    const screenBtn = event.target.closest("[data-screen-target]");
    if (screenBtn) {
      event.preventDefault();
      showScreen(screenBtn.getAttribute("data-screen-target"));
      return;
    }

    const wipeLink = event.target.closest("[data-wipe]");
    if (wipeLink && wipeLink.href && !event.metaKey && !event.ctrlKey && event.button === 0) {
      const dest = new URL(wipeLink.href, window.location.href);
      if (dest.origin === window.location.origin) {
        event.preventDefault();
        navigate(dest.href);
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isHome() && body.dataset.view !== "title" && !isFxView()) {
      showScreen("title");
    }
  });

  function placePreview(anchor) {
    if (!preview || !anchor) return;
    const key = anchor.getAttribute("data-preview");
    const source = document.querySelector('[data-preview-source="' + key + '"]');
    if (!source) {
      preview.hidden = true;
      return;
    }
    preview.innerHTML = source.innerHTML;
    preview.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const top = Math.max(88, Math.min(window.innerHeight - preview.offsetHeight - 24, rect.top - 8));
    preview.style.left = Math.min(window.innerWidth - 320, rect.right + 18) + "px";
    preview.style.top = top + "px";
  }

  document.querySelectorAll("[data-preview]").forEach(function (item) {
    item.addEventListener("mouseenter", function () {
      window.clearTimeout(previewTimer);
      placePreview(item);
    });
    item.addEventListener("mouseleave", function () {
      previewTimer = window.setTimeout(function () {
        if (preview) preview.hidden = true;
      }, 80);
    });
    item.addEventListener("focus", function () {
      placePreview(item);
    });
    item.addEventListener("blur", function () {
      if (preview) preview.hidden = true;
    });
  });

  function applyConfig() {
    const trailOn = window.localStorage.getItem("gal-trail") !== "0";
    const charmOn = window.localStorage.getItem("gal-charm") !== "0";
    body.classList.toggle("trail-off", !trailOn);
    body.classList.toggle("charm-off", !charmOn);
    const trailInput = document.querySelector('[name="gal-trail"]');
    const charmInput = document.querySelector('[name="gal-charm"]');
    if (trailInput) trailInput.checked = trailOn;
    if (charmInput) charmInput.checked = charmOn;
  }

  document.querySelectorAll("[data-config-toggle]").forEach(function (input) {
    input.addEventListener("change", function () {
      window.localStorage.setItem(input.name, input.checked ? "1" : "0");
      applyConfig();
    });
  });

  applyConfig();
  bindWelcome();

  if (isHome()) {
    const initial = location.hash.replace("#", "");
    const entered = sessionStorage.getItem("gal-entered") === "1";

    if (initial === "library" || initial === "about" || initial === "config") {
      showScreen(initial, true);
      body.classList.add("is-ready");
    } else if (entered) {
      showScreen("title", true);
      body.classList.add("is-ready");
    } else {
      showScreen("boot", true);
      window.setTimeout(function () {
        showScreen("welcome", true);
        body.classList.add("is-ready");
        typeWelcome();
      }, prefersReduced() ? 0 : 2400);
    }
  } else {
    body.classList.add("is-ready");
  }

  playFxVideo();

  (function initMusic() {
    const dock = document.querySelector("[data-music-dock]");
    const audio = document.getElementById("gal-audio");
    const tracksEl = document.getElementById("music-tracks");
    const playBtn = document.querySelector("[data-music-play]");
    const toggle = document.querySelector("[data-music-toggle]");
    if (!dock || !audio || !tracksEl || !playBtn || !toggle) return;

    let tracks = [];
    try {
      tracks = JSON.parse(tracksEl.textContent);
    } catch (error) {
      return;
    }
    if (!tracks.length) return;

    let index = 0;
    const MUSIC_KEY = "gal-music";

    function markCurrent() {
      dock.querySelectorAll("[data-track]").forEach(function (btn) {
        btn.classList.toggle("is-current", Number(btn.getAttribute("data-track")) === index);
      });
    }

    function saveMusic() {
      sessionStorage.setItem(MUSIC_KEY, JSON.stringify({
        index: index,
        time: audio.currentTime || 0,
        playing: !audio.paused
      }));
    }

    function load(nextIndex, autoplay, atTime) {
      index = (nextIndex + tracks.length) % tracks.length;
      const nextSrc = tracks[index].src;
      const already = audio.getAttribute("src") === nextSrc || audio.src.indexOf(encodeURI(nextSrc)) !== -1;
      if (!already) {
        audio.src = nextSrc;
      }
      markCurrent();
      function seekAndPlay() {
        if (typeof atTime === "number" && !Number.isNaN(atTime) && atTime > 0) {
          try {
            audio.currentTime = atTime;
          } catch (error) {}
        }
        if (autoplay) {
          audio.play().catch(function () {});
        }
        syncPlay();
      }
      if (already && audio.readyState >= 2) {
        seekAndPlay();
        return;
      }
      audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    }

    function syncPlay() {
      const playing = !audio.paused;
      dock.classList.toggle("is-playing", playing);
      playBtn.textContent = playing ? "⏸" : "▶";
      playBtn.setAttribute("aria-label", playing ? "暂停" : "播放");
    }

    toggle.addEventListener("click", function () {
      const open = !dock.classList.contains("is-open");
      dock.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    dock.querySelectorAll("[data-track]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        load(Number(btn.getAttribute("data-track")), true);
      });
    });

    const prev = document.querySelector("[data-music-prev]");
    const next = document.querySelector("[data-music-next]");
    if (prev) {
      prev.addEventListener("click", function () {
        load(index - 1, true);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        load(index + 1, true);
      });
    }

    playBtn.addEventListener("click", function () {
      if (!audio.getAttribute("src")) {
        load(index, true);
        return;
      }
      if (audio.paused) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () {
      syncPlay();
      saveMusic();
    });
    audio.addEventListener("pause", function () {
      syncPlay();
      saveMusic();
    });
    audio.addEventListener("timeupdate", function () {
      if (Math.floor(audio.currentTime) % 2 === 0) {
        saveMusic();
      }
    });
    audio.addEventListener("ended", function () {
      load(index + 1, true);
    });

    window.addEventListener("pagehide", saveMusic);
    window.__galSaveMusic = saveMusic;
    window.__galStartMusic = function () {
      load(index, true, audio.currentTime || 0);
    };

    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(MUSIC_KEY) || "null");
    } catch (error) {
      saved = null;
    }

    if (saved && typeof saved.index === "number") {
      load(saved.index, saved.playing !== false, saved.time || 0);
    } else {
      load(0, true);
    }
  })();
})();
