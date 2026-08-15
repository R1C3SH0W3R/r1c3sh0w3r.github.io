window.addEventListener("load", async function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const backgroundVideo = document.getElementById("anime-bg");
  const compactLayout = window.matchMedia("(max-width: 820px)").matches;

  if (backgroundVideo && (reduceMotion || compactLayout)) {
    backgroundVideo.pause();
    backgroundVideo.removeAttribute("autoplay");
  } else if (backgroundVideo) {
    backgroundVideo.play().catch(function () {
      document.body.classList.add("video-paused");
    });
  }

  if (!reduceMotion && window.tsParticles && typeof window.loadFull === "function") {
    try {
      await window.loadFull(window.tsParticles);
      await window.tsParticles.load({
        id: "tsparticles",
        options: {
          fullScreen: { enable: false },
          fpsLimit: 60,
          detectRetina: true,
          pauseOnBlur: true,
          pauseOnOutsideViewport: true,
          background: { color: { value: "transparent" } },
          particles: {
            color: { value: ["#ef94b8", "#72bfd2", "#f2c75c", "#a99be8"] },
            links: {
              enable: true,
              color: "#d99bb4",
              distance: 135,
              opacity: 0.18,
              width: 1
            },
            move: {
              enable: true,
              direction: "none",
              speed: { min: 0.25, max: 0.75 },
              outModes: { default: "bounce" }
            },
            number: {
              value: 34,
              density: { enable: true, width: 1000, height: 1000 }
            },
            opacity: {
              value: { min: 0.18, max: 0.48 },
              animation: { enable: true, speed: 0.4, sync: false }
            },
            shape: { type: ["circle", "star"] },
            size: {
              value: { min: 2, max: 5 },
              animation: { enable: true, speed: 1.2, sync: false }
            }
          },
          interactivity: {
            detectsOn: "window",
            events: {
              onHover: { enable: true, mode: ["grab", "trail"] },
              onClick: { enable: true, mode: "push" },
              resize: { enable: true }
            },
            modes: {
              grab: {
                distance: 145,
                links: { opacity: 0.28 }
              },
              push: { quantity: 3 },
              trail: {
                delay: 0.06,
                pauseOnStop: true,
                quantity: 2,
                particles: {
                  color: { value: ["#ff78aa", "#67cee4", "#ffd56a"] },
                  collisions: { enable: false },
                  links: { enable: false },
                  move: {
                    enable: true,
                    speed: { min: 0.2, max: 0.8 },
                    outModes: { default: "destroy" }
                  },
                  opacity: {
                    value: { min: 0.25, max: 0.8 },
                    animation: {
                      enable: true,
                      speed: 1.6,
                      startValue: "max",
                      destroy: "min",
                      sync: false
                    }
                  },
                  shape: { type: "star" },
                  size: {
                    value: { min: 2, max: 5 },
                    animation: { enable: true, speed: 2, sync: false }
                  },
                  life: {
                    count: 1,
                    duration: { value: 0.9, sync: false }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error("动态粒子加载失败：", error);
    }
  }
});

(function () {
  const calendars = document.querySelectorAll("[data-calendar]");

  calendars.forEach(function (calendar) {
    const title = calendar.querySelector("[data-calendar-title]");
    const days = calendar.querySelector("[data-calendar-days]");
    const currentDateLabel = calendar.querySelector("[data-calendar-date]");
    const previousButton = calendar.querySelector("[data-calendar-prev]");
    const nextButton = calendar.querySelector("[data-calendar-next]");
    const todayButton = calendar.querySelector("[data-calendar-today]");
    const today = new Date();
    const postDates = new Set((calendar.dataset.postDates || "").split(",").filter(Boolean));
    let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function dateKey(value) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    }

    function renderCalendar() {
      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

      title.textContent = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(visibleMonth);
      days.setAttribute("aria-label", title.textContent);
      days.replaceChildren();

      for (let index = 0; index < 42; index += 1) {
        const value = new Date(year, month, index - firstWeekday + 1);
        const cell = document.createElement("span");
        const isToday = dateKey(value) === dateKey(today);
        const hasPost = postDates.has(dateKey(value));
        const weekday = value.getDay();

        cell.className = "calendar-day";
        cell.textContent = value.getDate();
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }).format(value) + (hasPost ? "，有文章" : ""));
        cell.classList.toggle("is-other-month", value.getMonth() !== month);
        cell.classList.toggle("is-weekend", weekday === 0 || weekday === 6);
        cell.classList.toggle("has-post", hasPost);
        cell.classList.toggle("is-today", isToday);

        if (isToday) { cell.setAttribute("aria-current", "date"); }
        days.appendChild(cell);
      }
    }

    previousButton.addEventListener("click", function () {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    nextButton.addEventListener("click", function () {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    todayButton.addEventListener("click", function () {
      visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      renderCalendar();
    });

    currentDateLabel.dateTime = dateKey(today);
    currentDateLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(today);
    renderCalendar();
  });
})();

(function () {
  const paginations = document.querySelectorAll("[data-pagination]");

  paginations.forEach(function (pagination) {
    const form = pagination.querySelector("[data-pagination-jump]");
    const input = form && form.querySelector('input[name="page"]');
    const totalPages = Number.parseInt(pagination.dataset.totalPages || "1", 10);

    if (!form || !input) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }

      const requestedPage = Number.parseInt(input.value, 10);
      if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > totalPages) {
        input.setCustomValidity("请输入有效页码");
        input.reportValidity();
        return;
      }

      const root = pagination.dataset.paginationRoot || "/";
      const directory = (pagination.dataset.paginationDir || "page").replace(/^\/+|\/+$/g, "");
      const normalizedRoot = root.endsWith("/") ? root : root + "/";
      const target = requestedPage === 1
        ? normalizedRoot
        : normalizedRoot + directory + "/" + requestedPage + "/";

      window.location.assign(target + "#posts");
    });

    input.addEventListener("input", function () {
      input.setCustomValidity("");
    });
  });
})();

(function () {
  const visitorCounter = document.querySelector("[data-visitor-counter]");
  const visitorValue = visitorCounter && visitorCounter.querySelector("[data-visitor-value]");

  if (!visitorCounter || !visitorValue) {
    return;
  }

  window.setTimeout(function () {
    if (visitorValue.textContent.trim() === "加载中") {
      visitorValue.textContent = "暂不可用";
      visitorCounter.classList.add("is-unavailable");
    }
  }, 12000);
})();

(function () {
  const symbols = ["♡", "✦", "❀", "☆"];
  const colors = ["#ef78a8", "#66bfd4", "#f2bd45", "#a28de2"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("pointerdown", function (event) {
    if (reduceMotion.matches || event.button > 0) {
      return;
    }

    for (let index = 0; index < 7; index += 1) {
      const charm = document.createElement("span");
      const angle = (Math.PI * 2 * index) / 7 + Math.random() * 0.35;
      const distance = 38 + Math.random() * 40;

      charm.className = "click-charm";
      charm.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      charm.style.left = event.clientX + "px";
      charm.style.top = event.clientY + "px";
      charm.style.setProperty("--move-x", Math.cos(angle) * distance + "px");
      charm.style.setProperty("--move-y", Math.sin(angle) * distance - 24 + "px");
      charm.style.setProperty("--charm-color", colors[index % colors.length]);
      charm.style.setProperty("--charm-size", 14 + Math.random() * 9 + "px");
      charm.style.animationDelay = index * 18 + "ms";

      document.body.appendChild(charm);
      charm.addEventListener("animationend", function () {
        charm.remove();
      }, { once: true });
    }
  }, { passive: true });
})();
