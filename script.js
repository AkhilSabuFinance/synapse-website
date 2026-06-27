const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector("[data-theme-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const localSectionPaths = new Set(["/", "/problem", "/solution", "/interface", "/token", "/waitlist"]);

const savedTheme = window.localStorage.getItem("synapse-theme");

if (savedTheme === "light" || savedTheme === "dark") {
  root.dataset.theme = savedTheme;
}

function syncThemeButton() {
  const isDark = root.dataset.theme !== "light";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function closeMenu() {
  body.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}

syncThemeButton();

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  window.localStorage.setItem("synapse-theme", nextTheme);
  syncThemeButton();
});

menuToggle.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

// Clean-path navigation: section anchors use real paths (e.g. /solution)
// and update the URL via the History API instead of leaving a #hash.
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function scrollToPath(pathname, behavior) {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  const mode = prefersReducedMotion() ? "instant" : behavior;

  if (!slug) {
    window.scrollTo({ top: 0, behavior: mode });
    return;
  }

  const target = document.getElementById(slug);
  if (target) {
    target.scrollIntoView({ behavior: mode, block: "start" });
  }
}

document.addEventListener("click", (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const anchor = event.target.closest && event.target.closest("a");
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href || href[0] !== "/" || anchor.target === "_blank" || !localSectionPaths.has(href)) return;

  event.preventDefault();
  if (location.pathname !== href) {
    history.pushState({}, "", href);
  }
  scrollToPath(href, "smooth");
  closeMenu();
});

window.addEventListener("popstate", () => {
  scrollToPath(location.pathname, "smooth");
});

// Land on the right section for deep links / refreshes.
scrollToPath(location.pathname, "instant");
window.addEventListener("load", () => scrollToPath(location.pathname, "instant"));

// ── Hero: cursor parallax on the data-sphere visual ───────────────────────────
const heroVisual = document.querySelector("[data-hero-visual]");

if (heroVisual && !prefersReducedMotion()) {
  let targetX = 0, targetY = 0, curX = 0, curY = 0, parallaxRaf = null;

  function parallaxTick() {
    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;
    heroVisual.style.setProperty("--px", curX.toFixed(2) + "px");
    heroVisual.style.setProperty("--py", curY.toFixed(2) + "px");
    if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
      parallaxRaf = requestAnimationFrame(parallaxTick);
    } else {
      parallaxRaf = null;
    }
  }

  window.addEventListener("pointermove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 36;
    targetY = (e.clientY / window.innerHeight - 0.5) * 36;
    if (parallaxRaf === null) parallaxRaf = requestAnimationFrame(parallaxTick);
  });
}

// Waitlist form
const SUPABASE_URL = "https://pczphbjmcbsgrnesqypq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjenBoYmptY2JzZ3JuZXNxeXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzQyODIsImV4cCI6MjA5ODA1MDI4Mn0.zLer9c5cUdWJ-pOC7eZstWDAlFvfHzwEUK1GYTOlfuk";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const waitlistForm = document.getElementById("waitlist-form");
const waitlistEmail = document.getElementById("waitlist-email");
const waitlistMsg = document.getElementById("waitlist-msg");

if (waitlistForm) {
  waitlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = waitlistForm.querySelector(".waitlist-btn");
    btn.disabled = true;
    waitlistMsg.textContent = "";

    const { error } = await db.from("waitlist").insert({ email: waitlistEmail.value.trim() });

    if (error) {
      waitlistMsg.textContent = error.code === "23505"
        ? "You’re already on the list."
        : "Something went wrong. Please try again.";
      btn.disabled = false;
    } else {
      waitlistMsg.textContent = "You’re on the list. We’ll be in touch.";
      waitlistForm.reset();
      btn.disabled = false;
    }
  });
}
