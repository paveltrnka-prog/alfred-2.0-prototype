(() => {
  const params = new URLSearchParams(location.search);
  const guestsParam = params.get("guests");
  const debug = params.get("debug") === "1";
  if (debug) document.body.classList.add("debug");

  const setupEl = document.getElementById("setup");
  const appEl = document.getElementById("app");
  const viewportScroll = document.getElementById("viewport-scroll");
  const bottomNav = document.getElementById("bottom-nav");
  const hint = document.getElementById("proto-hint");
  const bankEl = document.getElementById("bank");
  const bankMerchant = document.getElementById("bank-merchant");
  const bankAmount = document.getElementById("bank-amount");
  const bankRef = document.getElementById("bank-ref");
  const bankConfirm = document.getElementById("bank-confirm");
  const bankCancel = document.getElementById("bank-cancel");
  const bankSuccess = document.getElementById("bank-success");
  const scanOverlay = document.getElementById("scan-overlay");
  const scanProcessing = document.getElementById("scan-processing");
  const scanResult = document.getElementById("scan-result");
  const scanApply = document.getElementById("scan-apply");
  const viewport = document.getElementById("viewport");
  const nextStepEl = document.getElementById("next-step");
  const nextStepKicker = document.getElementById("next-step-kicker");
  const nextStepTitle = document.getElementById("next-step-title");
  const nextStepBody = document.getElementById("next-step-body");
  const nextStepCta = document.getElementById("next-step-cta");
  const nextStepSecondary = document.getElementById("next-step-secondary");
  const nextStepBackdrop = document.getElementById("next-step-backdrop");
  const exitBar = document.getElementById("exit-bar");
  const exitBarBtn = document.getElementById("exit-bar-btn");

  if (!guestsParam || !["1", "4"].includes(guestsParam)) {
    setupEl.classList.remove("hidden");
    return;
  }

  const guestMode = guestsParam === "1" ? "single" : "multi";
  appEl.classList.remove("hidden");
  hint.textContent = guestMode === "single" ? "Scenario: single guest" : "Scenario: multi-guest (4)";

  const screens = window.ALFRED_FLOWS.screens;
  const DASH_PHASE = window.ALFRED_FLOWS.DASH_PHASE;
  const history = [];
  let current = "dash-prearrival";
  let lastDash = "dash-prearrival";
  let bankReturnTo = "dash-checkin";
  let bankDoneHint = "";
  let nextHighlightKey = "";
  let nextPrimaryAction = "dismiss";
  let nextSecondaryAction = "";
  let transitioning = false;
  let bankBusy = false;
  let demoAutofilled = false;
  let guestsDone = 0;
  let ratingValue = 0;
  let pendingStayStatus = null;
  const guestTotal = guestMode === "single" ? 1 : 4;
  const DEMO_GUESTS = [
    { name: "Jan Novák", phone: "777 123 456", email: "jan.novak@email.cz", dob: "12. 5. 1988", passport: "123456789" },
    { name: "Marie Nováková", phone: "777 234 567", email: "marie.novakova@email.cz", dob: "3. 8. 1990", passport: "987654321" },
    { name: "Tomáš Svoboda", phone: "777 345 678", email: "tomas.svoboda@email.cz", dob: "21. 1. 1985", passport: "456789123" },
    { name: "Eva Svobodová", phone: "777 456 789", email: "eva.svobodova@email.cz", dob: "9. 11. 1992", passport: "321654987" }
  ];

  function currentGuest() {
    return DEMO_GUESTS[Math.min(guestsDone, DEMO_GUESTS.length - 1)];
  }

  function guestListScreen() {
    return "ci-guest-list";
  }

  function afterGuestDoneScreen() {
    if (guestMode === "single") return "ci-complete";
    return guestsDone >= guestTotal ? "ci-complete" : "ci-guest-list";
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PRESS_MS = reduceMotion ? 0 : 70;
  const BANK_MS = reduceMotion ? 0 : 240;
  const SUCCESS_MS = reduceMotion ? 200 : 700;
  const SCAN_MS = reduceMotion ? 280 : 1100;
  const STAGGER_MS = reduceMotion ? 0 : 420;

  const NEXT_STEP = {
    "dash-preauth": {
      kicker: "Payment successful",
      title: "Stay is paid",
      body: "Next: Pre-authorization — a refundable deposit. Complete it to unlock check-in.",
      cta: "Show next step",
      highlight: "preauth"
    },
    "dash-checkin-ready": {
      kicker: "Pre-authorization done",
      title: "You’re ready to check in",
      body: "Next: Check-in — fill guest details to get your room key.",
      cta: "Show check-in",
      highlight: "checkin"
    }
  };

  function startCheckinScreen() {
    return "ci-guest-list";
  }

  function ctx() {
    return {
      guestMode,
      guestTotal,
      guestsDone,
      guest: currentGuest(),
      phase: DASH_PHASE[current] || "prearrival"
    };
  }

  function screenEl(id) {
    return viewportScroll.querySelector(`.screen[data-screen="${id}"]`);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function withPress(btn, fn) {
    if (!btn) return fn();
    btn.classList.add("is-pressed");
    await wait(PRESS_MS);
    btn.classList.remove("is-pressed");
    return fn();
  }

  function playStagger(section) {
    if (!section || reduceMotion) return;
    section.classList.remove("is-staggering");
    void section.offsetWidth;
    section.classList.add("is-staggering");
    clearTimeout(playStagger._t);
    playStagger._t = setTimeout(() => section.classList.remove("is-staggering"), STAGGER_MS + 80);
  }

  function bindActions(root) {
    root.querySelectorAll("[data-go],[data-back],[data-action]").forEach((el) => {
      if (el.__alfredBound) return;
      el.__alfredBound = true;
      el.addEventListener("click", onHotspot);
    });
  }

  function renderScreen(id) {
    const conf = screens[id];
    if (!conf) return "";
    if (conf.kind === "dash") {
      const phase = DASH_PHASE[id] || "prearrival";
      return window.ALFRED_FLOWS.renderDashboard({
        phase,
        guestsDone,
        guestTotal,
        guestMode
      });
    }
    return conf.render(ctx());
  }

  // Build DOM once
  for (const id of Object.keys(screens)) {
    const section = document.createElement("section");
    section.className = "screen screen-html";
    section.dataset.screen = id;
    section.innerHTML = renderScreen(id);
    bindActions(section);
    viewportScroll.appendChild(section);
  }

  function refreshScreen(id) {
    const section = screenEl(id);
    if (!section) return;
    const wasActive = section.classList.contains("is-active");
    section.innerHTML = renderScreen(id);
    bindActions(section);
    if (wasActive) section.classList.add("is-active");
  }

  function refreshDashboards() {
    Object.keys(DASH_PHASE).forEach((id) => refreshScreen(id));
    refreshScreen("ci-guest-list");
  }

  function syncExitBar(id) {
    if (!exitBar) return;
    exitBar.classList.toggle("is-visible", id === "ci-guest-list");
  }

  function syncDemoBanner(id) {
    let banner = document.getElementById("demo-fill-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "demo-fill-banner";
      banner.className = "demo-fill-banner";
      viewport.appendChild(banner);
    }
    const guest = currentGuest();
    banner.innerHTML =
      "<strong>Filled from passport</strong><br>" +
      guest.name +
      " · +420 " +
      guest.phone +
      " · " +
      guest.email;
    const show = demoAutofilled && (id === "ci-document-filled" || id === "ci-contact-filled");
    banner.classList.toggle("is-visible", show);
  }

  function syncScanGuest() {
    const guest = currentGuest();
    const nameEl = document.getElementById("scan-name");
    const dobEl = document.getElementById("scan-dob");
    const passEl = document.getElementById("scan-passport");
    if (nameEl) nameEl.textContent = guest.name;
    if (dobEl) dobEl.textContent = guest.dob;
    if (passEl) passEl.textContent = guest.passport;
  }

  async function runDemoScan() {
    if (!scanOverlay) return;
    syncScanGuest();
    scanProcessing.classList.remove("hidden");
    scanResult.classList.add("hidden");
    scanOverlay.classList.remove("hidden");
    requestAnimationFrame(() => scanOverlay.classList.add("is-open"));
    await wait(SCAN_MS);
    scanProcessing.classList.add("hidden");
    scanResult.classList.remove("hidden");
  }

  async function applyDemoScan() {
    demoAutofilled = true;
    scanOverlay.classList.remove("is-open");
    await wait(BANK_MS);
    scanOverlay.classList.add("hidden");
    scanResult.classList.add("hidden");
    scanProcessing.classList.remove("hidden");
    refreshScreen("ci-document-filled");
    refreshScreen("ci-contact-filled");
    await show("ci-document-filled", { push: false, dir: "fade", unlock: true });
    showToast("Passport details applied — review and continue");
  }

  if (scanApply) {
    scanApply.addEventListener("click", () => {
      if (bankBusy || transitioning) return;
      applyDemoScan();
    });
  }

  function syncFooter(id, { animate = false } = {}) {
    const conf = screens[id];
    const mode = conf && conf.footer;
    if (!mode) {
      bottomNav.classList.add("hidden");
      return;
    }
    const wasHidden = bottomNav.classList.contains("hidden");
    bottomNav.classList.remove("hidden");
    bottomNav.dataset.active = mode;
    bottomNav.querySelectorAll(".footer-tab").forEach((btn) => {
      const on = btn.dataset.tab === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-current", on ? "page" : "false");
    });
    if (animate && !wasHidden && !reduceMotion) {
      bottomNav.classList.remove("is-swapping");
      void bottomNav.offsetWidth;
      bottomNav.classList.add("is-swapping");
      clearTimeout(syncFooter._t);
      syncFooter._t = setTimeout(() => bottomNav.classList.remove("is-swapping"), 220);
    }
  }

  function clearMotionClasses(el) {
    if (!el) return;
    el.classList.remove(
      "is-leaving",
      "is-entering",
      "enter-forward",
      "leave-forward",
      "enter-back",
      "leave-back",
      "enter-fade",
      "leave-fade",
      "is-staggering",
      "is-unlocking"
    );
  }

  async function show(id, { push = true, dir = "forward", unlock = false } = {}) {
    if (!screens[id]) return;

    // Keep dynamic screens fresh
    if (id === "ci-guest-list" || DASH_PHASE[id]) {
      refreshScreen(id);
    }

    const fromId = current;
    const toEl = screenEl(id);
    if (!toEl) return;

    if (id === fromId) {
      toEl.classList.add("is-active");
      syncFooter(id);
      syncDemoBanner(id);
      syncExitBar(id);
      if (!reduceMotion) playStagger(toEl);
      return;
    }
    if (transitioning) return;

    if (push) history.push(fromId);
    current = id;
    if (String(id).startsWith("dash-")) lastDash = id;

    transitioning = true;

    // Instant swap — no overlapping leave/enter fade (that caused the flicker)
    document.querySelectorAll(".screen").forEach((el) => {
      const on = el.dataset.screen === id;
      el.classList.toggle("is-active", on);
      clearMotionClasses(el);
    });
    syncFooter(id, { animate: false });
    syncDemoBanner(id);
    syncExitBar(id);
    viewportScroll.scrollTop = 0;

    // Stagger content blocks (unlock:true / any dir except reduced-motion)
    if (!reduceMotion) playStagger(toEl);

    transitioning = false;
  }

  function back() {
    // Cancel is only opened from dashboards. Those screens often sit on an empty
    // (or stale) history stack because bank/check-in clears it on purpose. Use
    // lastDash so Keep / chrome back restore the phase the guest left — without
    // changing the empty-stack → dash-prearrival fallback other flows rely on.
    if (current === "cancel") {
      if (history.length) history.pop();
      show(lastDash || "dash-prearrival", { push: false, dir: "back" });
      return;
    }
    const prev = history.pop();
    if (prev) show(prev, { push: false, dir: "back" });
    else show("dash-prearrival", { push: false, dir: "back" });
  }

  function showToast(message) {
    let toast = document.getElementById("proto-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "proto-toast";
      toast.className = "proto-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function pulseHotspot(key) {
    if (!key) return;
    const btn = screenEl(current)?.querySelector(`[data-key="${key}"]`);
    if (!btn) return;
    btn.classList.remove("is-pulse");
    void btn.offsetWidth;
    btn.classList.add("is-pulse");
    const top = btn.offsetTop - 120;
    viewportScroll.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    clearTimeout(pulseHotspot._t);
    pulseHotspot._t = setTimeout(() => btn.classList.remove("is-pulse"), 4000);
  }

  async function openNextStep(conf) {
    if (!conf || !nextStepEl) return;
    nextHighlightKey = conf.highlight || "";
    nextPrimaryAction = conf.primaryAction || "dismiss";
    nextSecondaryAction = conf.secondaryAction || "";
    nextStepKicker.textContent = conf.kicker;
    nextStepTitle.textContent = conf.title;
    nextStepBody.textContent = conf.body;
    nextStepCta.textContent = conf.cta;
    if (nextStepSecondary) {
      if (conf.secondaryCta) {
        nextStepSecondary.textContent = conf.secondaryCta;
        nextStepSecondary.classList.remove("hidden");
      } else {
        nextStepSecondary.classList.add("hidden");
      }
    }
    nextStepEl.classList.remove("hidden");
    requestAnimationFrame(() => nextStepEl.classList.add("is-open"));
  }

  function stayStatusConf(doneGuest) {
    return {
      kicker: "Check-in complete",
      title: guestMode === "single" ? doneGuest.name + " is checked in" : "All guests are ready",
      body:
        guestMode === "single"
          ? "Your room key is unlocked. Continue to your stay."
          : guestTotal + " of " + guestTotal + " guests completed. Continue to your stay and room key.",
      cta: "Go to your stay",
      primaryAction: "dash-stay",
      secondaryCta: "Close",
      secondaryAction: "dash-stay"
    };
  }

  function applyRating(stars) {
    ratingValue = stars;
    const root = screenEl(current);
    if (!root) return;
    root.querySelectorAll(".star-btn").forEach((btn) => {
      const n = Number(btn.dataset.stars || 0);
      btn.classList.toggle("is-on", n <= stars);
      btn.setAttribute("aria-checked", n === stars ? "true" : "false");
    });
    const feedback = root.querySelector("#rating-feedback");
    const cta = root.querySelector("#rating-cta");
    const low = stars > 0 && stars <= 2;
    if (feedback) feedback.classList.toggle("hidden", !low);
    if (cta) {
      if (low) {
        cta.textContent = "Send";
        cta.dataset.action = "rating-send";
      } else {
        cta.textContent = "Close";
        cta.dataset.action = "rating-close";
      }
    }
  }

  async function dismissRating({ sent = false } = {}) {
    if (sent) showToast("Thanks for your feedback");
    ratingValue = 0;
    const conf = pendingStayStatus;
    pendingStayStatus = null;
    history.length = 0;
    await show("dash-stay", { push: false, dir: "fade", unlock: true });
    if (conf) {
      await wait(reduceMotion ? 40 : 120);
      await openNextStep(conf);
    }
  }

  async function closeNextStep(via = "primary") {
    if (!nextStepEl) return;
    const primary = nextPrimaryAction;
    const secondary = nextSecondaryAction;
    const highlight = nextHighlightKey;
    nextStepEl.classList.remove("is-open");
    await wait(BANK_MS);
    nextStepEl.classList.add("hidden");
    nextHighlightKey = "";
    nextPrimaryAction = "dismiss";
    nextSecondaryAction = "";

    if (
      (via === "secondary" && secondary === "dash-checkin-ready") ||
      (via === "primary" && primary === "dash-checkin-ready")
    ) {
      history.length = 0;
      await show("dash-checkin-ready", { push: false, dir: "back" });
      return;
    }
    if (
      (via === "secondary" && secondary === "dash-stay") ||
      (via === "primary" && primary === "dash-stay")
    ) {
      history.length = 0;
      await show("dash-stay", { push: false, dir: "fade", unlock: true });
      return;
    }
    if (highlight) pulseHotspot(highlight);
  }

  if (nextStepCta) nextStepCta.addEventListener("click", () => closeNextStep("primary"));
  if (nextStepSecondary) nextStepSecondary.addEventListener("click", () => closeNextStep("secondary"));
  if (nextStepBackdrop) nextStepBackdrop.addEventListener("click", () => closeNextStep("primary"));

  if (exitBarBtn) {
    exitBarBtn.addEventListener("click", async () => {
      if (transitioning || bankBusy) return;
      history.length = 0;
      await show("dash-checkin-ready", { push: false, dir: "back" });
    });
  }

  async function openBank({ amount, merchant, returnTo, doneHint }) {
    bankReturnTo = returnTo || "dash-checkin";
    bankDoneHint = doneHint || "";
    bankMerchant.textContent = merchant || "Pytloun Self Check-in Hotel Liberec";
    bankAmount.textContent = amount || "0 Kč";
    bankRef.textContent = "ALF-" + Date.now().toString().slice(-6);
    if (bankSuccess) bankSuccess.classList.remove("is-visible");
    bankEl.classList.remove("hidden");
    requestAnimationFrame(() => bankEl.classList.add("is-open"));
  }

  async function closeBank({ paid }) {
    if (bankBusy) return;
    bankBusy = true;

    if (paid) {
      if (bankSuccess) bankSuccess.classList.add("is-visible");
      await wait(SUCCESS_MS);
    }

    bankEl.classList.remove("is-open");
    await wait(BANK_MS);
    bankEl.classList.add("hidden");
    if (bankSuccess) bankSuccess.classList.remove("is-visible");
    bankBusy = false;

    if (paid) {
      history.length = 0;
      refreshDashboards();
      await show(bankReturnTo, { push: false, dir: "fade", unlock: true });
      await wait(reduceMotion ? 80 : 280);
      const conf = NEXT_STEP[bankReturnTo];
      if (conf) await openNextStep(conf);
      else if (bankDoneHint) showToast(bankDoneHint);
    }
  }

  bankConfirm.addEventListener("click", () => closeBank({ paid: true }));
  bankCancel.addEventListener("click", () => closeBank({ paid: false }));

  async function onHotspot(e) {
    const btn = e.currentTarget;
    if (transitioning || bankBusy) return;
    if (btn.disabled || btn.getAttribute("aria-disabled") === "true") return;

    await withPress(btn, async () => {
      if (btn.dataset.back === "1") {
        back();
        return;
      }
      const action = btn.dataset.action;
      if (action === "open-bank") {
        await openBank({
          amount: btn.getAttribute("data-amount"),
          merchant: btn.getAttribute("data-merchant"),
          returnTo: btn.getAttribute("data-return-to"),
          doneHint: btn.getAttribute("data-done-hint")
        });
        return;
      }
      if (action === "open-checkin") {
        await show(startCheckinScreen(), { dir: "forward" });
        return;
      }
      if (action === "remove-guest") {
        if (guestMode !== "multi" || guestTotal <= 1) return;
        if (guestsDone > 0) {
          guestsDone = Math.max(0, guestsDone - 1);
          demoAutofilled = false;
          refreshDashboards();
          refreshScreen("ci-guest-list");
          showToast("Guest removed");
        } else {
          showToast("No filled guest to remove");
        }
        return;
      }
      if (action === "finish-guest") {
        const doneGuest = currentGuest();
        guestsDone = Math.min(guestTotal, guestsDone + 1);
        demoAutofilled = false;
        history.length = 0;
        refreshDashboards();
        const next = afterGuestDoneScreen();
        refreshScreen(next);
        await show(next, { push: false, dir: "fade", unlock: true });
        await wait(reduceMotion ? 80 : 180);
        if (guestsDone >= guestTotal) {
          ratingValue = 0;
          pendingStayStatus = stayStatusConf(doneGuest);
          // Rating modal first (Figma 10.0/10.1); status sheet after dismiss
        } else {
          await openNextStep({
            kicker: "Guest saved",
            title: doneGuest.name + " is done",
            body:
              guestsDone +
              " of " +
              guestTotal +
              " guests completed. Fill the next guest, or return to your reservation anytime.",
            cta: "Fill next guest",
            secondaryCta: "Back to reservation",
            secondaryAction: "dash-checkin-ready",
            highlight: "fill-" + guestsDone
          });
        }
        return;
      }
      if (action === "rate-star") {
        applyRating(Number(btn.dataset.stars || 0));
        return;
      }
      if (action === "rating-send") {
        await dismissRating({ sent: true });
        return;
      }
      if (action === "rating-close" || action === "rating-dismiss") {
        await dismissRating({ sent: false });
        return;
      }
      if (action === "back-to-guest-list") {
        await show(guestListScreen(), { push: false, dir: "back" });
        return;
      }
      if (action === "need-scan") {
        showToast("Scan the passport to fill guest details");
        await show("ci-scan", { dir: "forward" });
        return;
      }
      if (action === "demo-scan") {
        await runDemoScan();
        return;
      }
      if (action === "cancel-confirm") {
        showToast("Reservation cancelled");
        history.length = 0;
        await show("dash-prearrival", { push: false, dir: "back", unlock: true });
        return;
      }
      if (action === "noop") return;

      const go = btn.dataset.go;
      if (go) {
        const exitCheckin = go.startsWith("dash-") && String(current).startsWith("ci-");
        if (exitCheckin) history.length = 0;
        if (go.startsWith("dash-") || go === "ci-guest-list") refreshScreen(go);
        const wizardStep = String(current).startsWith("ci-") && String(go).startsWith("ci-");
        await show(go, {
          push: !exitCheckin,
          dir: exitCheckin ? "back" : wizardStep ? "fade" : "forward"
        });
      }
    });
  }

  bottomNav.querySelectorAll(".footer-tab").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (transitioning || bankBusy) return;
      const tab = btn.dataset.tab;
      await withPress(btn, async () => {
        if (tab === "reservation") await show(lastDash || "dash-prearrival", { push: false, dir: "fade" });
        else if (tab === "hotel") await show("hotel", { push: false, dir: "fade" });
        else if (tab === "key") await show("key", { push: false, dir: "fade" });
      });
    });
  });

  show("dash-prearrival", { push: false, dir: "none", unlock: true });
})();
