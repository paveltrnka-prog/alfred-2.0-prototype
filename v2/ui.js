/**
 * Alfred 2.0 — HTML UI helpers (Figma DS tokens / PCard pattern)
 */
window.ALFRED_UI = (() => {
  const A = "assets";
  const I = `${A}/icons`;

  /** Single source for reservation window — stay strip + key PIN validity must match. */
  const STAY_WINDOW = {
    arrivalLabel: "Sa 16. 5.",
    arrivalDate: "16. 5.",
    arrivalTime: "15:00",
    departureLabel: "Mo 18. 5.",
    departureDate: "18. 5.",
    departureTime: "11:00",
    nightsLabel: "2 nights"
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function icon(name, cls = "") {
    return `<span class="ico ${cls}" style="-webkit-mask-image:url('${I}/${name}.svg');mask-image:url('${I}/${name}.svg')" aria-hidden="true"></span>`;
  }

  function iconImg(name, cls = "") {
    return `<img class="ico-img ${cls}" src="${I}/${name}.svg" alt="" width="16" height="16" draggable="false" />`;
  }

  /** Home header: 32px logo + hotel name + same profile affordance */
  function homeNav({ name = "Pytloun Hotel Liberec" } = {}) {
    return `
      <header class="top-nav top-nav--home">
        <div class="top-nav-brand">
          <img class="top-nav-logo top-nav-logo--sm" src="${A}/logo.png" alt="" draggable="false" />
          <span class="top-nav-hotel">${esc(name)}</span>
        </div>
        <button type="button" class="top-nav-avatar" aria-label="Profile">${icon("user")}</button>
      </header>`;
  }

  /** Hotel contact — single source for tel / mailto / maps (chips + other screens). */
  const HOTEL_CONTACT = {
    phone: "+420774484001",
    email: "hotel.liberec@pytloun-hotels.cz",
    maps:
      "https://maps.google.com/?q=Pytloun+Self+Check-in+Hotel+Liberec,+Hodkovicka+206,+460+06+Liberec"
  };

  /** Ordered hotel photos — [0] is the lead (home + Hotel tab first slide). */
  const HOTEL_PHOTOS = [
    { src: "assets/hotel-1170.jpg", alt: "Hotel exterior" },
    { src: "assets/hero.png", alt: "Guest room" }
  ];

  /** Fixed demo countdown — do not derive from dates (no "today" in the prototype). */
  const STAY_COUNTDOWN = "In 2 weeks";

  /**
   * Shared 180px hotel photo band (cover, 8px radius, no shadow).
   * Used by primaryStep(image) and the pre-arrival dashboard header.
   * @param {{src?:string, alt?:string, countdown?:boolean, flush?:boolean}} [opts]
   */
  function photoBand({ src, alt, countdown = false, flush = false } = {}) {
    const photo = HOTEL_PHOTOS[0];
    const imgSrc = src || photo.src;
    const imgAlt = alt != null ? alt : photo.alt;
    const overlay = countdown
      ? `<div class="photo-band-overlay">
          <p class="photo-band-countdown">${esc(STAY_COUNTDOWN)}</p>
          <p class="photo-band-arrival">${esc(STAY_WINDOW.arrivalLabel)} · ${esc(STAY_WINDOW.arrivalTime)}</p>
        </div>`
      : "";
    return `
      <div class="photo-band${flush ? " photo-band--flush" : ""}${countdown ? " photo-band--countdown" : ""}">
        <img src="${esc(imgSrc)}" alt="${esc(imgAlt)}" draggable="false" />
        ${overlay}
      </div>`;
  }

  /** DS: PBtnTag — Call / E-mail / Directions */
  function contactChips() {
    return `
      <a class="hotel-chip" href="tel:${HOTEL_CONTACT.phone}">${iconImg("phone")} Call</a>
      <a class="hotel-chip" href="mailto:${HOTEL_CONTACT.email}">${iconImg("envelope")} E-mail</a>
      <a class="hotel-chip" href="${HOTEL_CONTACT.maps}" target="_blank" rel="noopener">${iconImg("location-pin")} Directions</a>`;
  }

  /** Hotel tab — slideshow hero (DS: PPhotoGallery) + name / contacts */
  function hotelCard({ badge = STAY_COUNTDOWN, showBadge = true } = {}) {
    const multi = HOTEL_PHOTOS.length > 1;
    const slidesHtml = HOTEL_PHOTOS.map(
      (p, i) => `
        <button type="button" class="hotel-slide" data-hotel-slide="${i}" aria-label="${esc(p.alt)}">
          <img class="hotel-hero-img" src="${esc(p.src)}" alt="${esc(p.alt)}" draggable="false"${i === 0 ? "" : ' loading="lazy"'} />
        </button>`
    ).join("");

    const heroInner = multi
      ? `<div class="hotel-slideshow" data-hotel-slideshow>
          <div class="hotel-slideshow-track">${slidesHtml}</div>
        </div>`
      : slidesHtml;

    const dotsHtml = multi
      ? `<div class="hotel-slideshow-dots" role="tablist" aria-label="Hotel photos">
        ${HOTEL_PHOTOS.map(
          (_, i) =>
            `<button type="button" class="hotel-dot${i === 0 ? " is-active" : ""}" data-hotel-dot="${i}" role="tab" aria-selected="${i === 0 ? "true" : "false"}" aria-label="Photo ${i + 1}"></button>`
        ).join("")}
      </div>`
      : "";

    return `
      <section class="hotel-card">
        <div class="hotel-hero${multi ? " hotel-hero--slideshow" : ""}">
          ${heroInner}
          ${showBadge ? `<span class="hotel-badge">${esc(badge)}</span>` : ""}
          <div class="hotel-actions">
            ${contactChips()}
          </div>
        </div>
        ${dotsHtml}
        <div class="hotel-meta">
          <h1 class="hotel-title">Pytloun Self Check-in Hotel Liberec</h1>
          <div class="hotel-loc">
            ${iconImg("location")}
            <span>Hodkovická 206, Liberec</span>
          </div>
        </div>
      </section>`;
  }

  /** Flat reservation meta — no card / border */
  function resMeta({ dates, guests, room }) {
    return `
      <p class="res-meta">
        <span>${esc(dates)}</span>
        <span class="res-meta-dot" aria-hidden="true">·</span>
        <span>${esc(guests)}</span>
        <span class="res-meta-dot" aria-hidden="true">·</span>
        <span>${esc(room)}</span>
      </p>`;
  }

  /**
   * Home focus card.
   * DS: PTitleCard (device=mobile, color=white) + PProgress showText + PBtn type=primary
   * Optional image = PPhotoGallery Device=Mobile (flush top band).
   * @param {{title:string, subtitle?:string, cta:string, image?:string, step?:number, stepTotal?:number, key?:string, go?:string, action?:string, amount?:string, merchant?:string, returnTo?:string, doneHint?:string, confirm?:boolean}} opts
   */
  function primaryStep(opts) {
    const attrs = [
      opts.key ? `data-key="${esc(opts.key)}"` : "",
      opts.go ? `data-go="${esc(opts.go)}"` : "",
      opts.action ? `data-action="${esc(opts.action)}"` : "",
      opts.amount ? `data-amount="${esc(opts.amount)}"` : "",
      opts.merchant ? `data-merchant="${esc(opts.merchant)}"` : "",
      opts.returnTo ? `data-return-to="${esc(opts.returnTo)}"` : "",
      opts.doneHint ? `data-done-hint="${esc(opts.doneHint)}"` : ""
    ]
      .filter(Boolean)
      .join(" ");

    const ctaAttrs = attrs || `data-key="${esc(opts.key || "primary-cta")}"`;
    const confirmCls = opts.confirm ? " primary-step--confirm" : "";
    const photoCls = opts.image ? " primary-step--has-photo" : "";

    /* PProgress: driven by COMPLETED steps, not the current step index, so the
       bar can never disagree with the green checks in the checklist below.
       0 done→0%, 1 done→25%, 2 done→50%, 3 done→100% (no 75% for 3 steps) */
    const stepTotal = opts.stepTotal || 3;
    const step = opts.step;
    const stepDone = opts.stepDone;
    const pctMap = { 0: 0, 1: 25, 2: 50, 3: 100 };
    const pct = step != null ? pctMap[stepDone] ?? 0 : null;
    const progressHtml =
      pct != null
        ? `<div class="p-progress p-progress--${pct}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Step ${step} of ${stepTotal}">
        <span class="p-progress-text">Step ${step} of ${stepTotal}</span>
        <div class="p-progress-track" aria-hidden="true"><div class="p-progress-fill"></div></div>
      </div>`
        : "";

    const subHtml = opts.subtitle
      ? `<p class="primary-step-sub">${esc(opts.subtitle)}</p>`
      : "";

    const photoHtml = opts.image
      ? photoBand({
          src: opts.image,
          alt: opts.imageAlt != null ? opts.imageAlt : "",
          flush: true
        })
      : "";

    return `
      <section class="primary-step${confirmCls}${photoCls}">
        ${photoHtml}
        <h2 class="primary-step-title">${esc(opts.title)}</h2>
        ${progressHtml}
        ${subHtml}
        ${
          opts.cta
            ? `<button type="button" class="btn btn-primary primary-step-cta" ${ctaAttrs}>${esc(opts.cta)}</button>`
            : ""
        }
      </section>`;
  }

  /** DS: PSelectCard device=mobile color=white — done/current=active; upcoming=locked (GAP) */
  function checkRow({ done = false, current = false, title }) {
    const state = done ? "done" : current ? "current" : "upcoming";
    return `
      <div class="home-row check-row check-row--${state}">
        <span class="home-rail" aria-hidden="true">
          <span class="check-row-mark">${done ? "✓" : ""}</span>
        </span>
        <span class="check-row-title">${esc(title)}</span>
      </div>`;
  }

  /** DS: PSelectCard state=locked (GAP — not in DS) */
  function lockedStayRow({
    title = "Room, PIN & check-out",
    subtitle = "Available after check-in"
  } = {}) {
    return `
      <div class="home-row locked-stay-row" aria-disabled="true">
        <span class="home-rail" aria-hidden="true">
          <span class="locked-stay-ico">${icon("lock")}</span>
        </span>
        <span class="locked-stay-text">
          <strong class="locked-stay-title">${esc(title)}</strong>
          <small class="locked-stay-sub">${esc(subtitle)}</small>
        </span>
      </div>`;
  }

  /** DS: PLink — action=primary, quiet=gray600 */
  function dashTextLink({ label, key, go, action, tone = "default" }) {
    const attrs = [
      key ? `data-key="${esc(key)}"` : "",
      go ? `data-go="${esc(go)}"` : "",
      action ? `data-action="${esc(action)}"` : ""
    ]
      .filter(Boolean)
      .join(" ");
    const toneCls =
      tone === "quiet"
        ? " dash-text-link--quiet"
        : tone === "action"
          ? " dash-text-link--action"
          : tone === "muted"
            ? " dash-text-link--muted"
            : "";
    if (go || action) {
      return `<button type="button" class="dash-text-link${toneCls}" ${attrs}>${esc(label)}</button>`;
    }
    return `<span class="dash-text-link dash-text-link--static${toneCls}" ${attrs}>${esc(label)}</span>`;
  }

  function stayCard({ guests = 4, guestsLabel, room = "Double room" } = {}) {
    const guestText =
      guestsLabel || `${guests} ${guests === 1 ? "guest" : "guests"}`;
    const S = STAY_WINDOW;
    return `
      <section class="stay-card stay-card--home">
        <div class="stay-dates">
          <div class="stay-col">
            <span class="stay-label">Arrival</span>
            <div class="stay-when">
              <strong class="stay-date">${esc(S.arrivalLabel)}</strong>
              <span class="stay-time">${esc(S.arrivalTime)}</span>
            </div>
          </div>
          <div class="stay-mid">
            <span class="stay-nights">${esc(S.nightsLabel)}</span>
          </div>
          <div class="stay-col stay-col-end">
            <span class="stay-label">Departure</span>
            <div class="stay-when">
              <strong class="stay-date">${esc(S.departureLabel)}</strong>
              <span class="stay-time">${esc(S.departureTime)}</span>
            </div>
          </div>
        </div>
        <div class="stay-res">
          <span>Reservation 1291809101</span>
          <span class="stay-guests">${esc(guestText)} · ${esc(room)}</span>
        </div>
      </section>`;
  }

  /**
   * @param {object} opts
   * @param {'locked'|'active'|'primary'|'done'|'danger'} opts.state
   * @param {string} opts.icon
   * @param {string} opts.title
   * @param {string} [opts.sub]
   * @param {string} [opts.badge]
   * @param {boolean} [opts.chevron]
   * @param {string} [opts.key]
   * @param {string} [opts.go]
   * @param {string} [opts.action]
   * @param {string} [opts.amount]
   * @param {string} [opts.merchant]
   * @param {string} [opts.returnTo]
   * @param {string} [opts.doneHint]
   */
  function pcard(opts) {
    const state = opts.state || "active";
    const tag = opts.key || opts.action || opts.go ? "button" : "div";
    const attrs = [
      `type="button"`,
      `class="pcard pcard--${state}"`,
      opts.key ? `data-key="${esc(opts.key)}"` : "",
      opts.go ? `data-go="${esc(opts.go)}"` : "",
      opts.action ? `data-action="${esc(opts.action)}"` : "",
      opts.amount ? `data-amount="${esc(opts.amount)}"` : "",
      opts.merchant ? `data-merchant="${esc(opts.merchant)}"` : "",
      opts.returnTo ? `data-return-to="${esc(opts.returnTo)}"` : "",
      opts.doneHint ? `data-done-hint="${esc(opts.doneHint)}"` : "",
      state === "locked" ? `disabled aria-disabled="true"` : "",
      `aria-label="${esc(opts.title)}"`
    ]
      .filter(Boolean)
      .join(" ");

    const right = opts.badge
      ? `<span class="pcard-badge">${esc(opts.badge)}</span>`
      : opts.chevron
        ? `<span class="pcard-chevron">${icon("chevron")}</span>`
        : "";

    /* img + CSS filter = solid circle stays purple; glyph forced white (mask was washing out) */
    const ico = opts.icon
      ? `<span class="pcard-ico" aria-hidden="true"><img class="pcard-ico-img" src="${I}/${esc(opts.icon)}.svg" alt="" width="16" height="16" draggable="false" /></span>`
      : "";

    const inner = `
      ${ico}
      <span class="pcard-text">
        <span class="pcard-title">${esc(opts.title)}</span>
        ${opts.sub ? `<span class="pcard-sub">${esc(opts.sub)}</span>` : ""}
      </span>
      ${right}`;

    if (tag === "button") {
      return `<button ${attrs}>${inner}</button>`;
    }
    return `<div class="pcard pcard--${state}">${inner}</div>`;
  }

  function section(title, cardsHtml) {
    return `
      <section class="title-card">
        <h2 class="title-card-h">${esc(title)}</h2>
        <div class="title-card-body">${cardsHtml}</div>
      </section>`;
  }

  function pageShell(bodyHtml, { flushTop = false } = {}) {
    return `<div class="page${flushTop ? " page--dash" : ""}">${bodyHtml}</div>`;
  }

  /** Subpage nav: Back + title + hotel logo + profile (Figma Navigace with logo) */
  function wizardChrome({ title, back = true }) {
    return `
      <header class="wiz-nav">
        ${back ? `<button type="button" class="wiz-back" data-back="1" aria-label="Back">${icon("chevron", "ico--back")}</button>` : `<span class="wiz-back-spacer"></span>`}
        <h1 class="wiz-title">${esc(title)}</h1>
        <img class="wiz-logo" src="${A}/logo.png" alt="Pytloun" draggable="false" />
        <button type="button" class="wiz-avatar" aria-label="Profile">${icon("user")}</button>
      </header>`;
  }

  /** Progress: label + n/4 + 4 segments (Figma Check-in wizard) */
  function progressBar(label, step, total = 4) {
    let segs = "";
    for (let i = 1; i <= total; i++) {
      segs += `<span class="progress-seg${i <= step ? " is-on" : ""}"></span>`;
    }
    return `
      <div class="progress">
        <div class="progress-meta">
          <span class="progress-label">${esc(label)}</span>
          <span class="progress-count">${step}/${total}</span>
        </div>
        <div class="progress-bar" aria-hidden="true">${segs}</div>
      </div>`;
  }

  function field({ label, name, value = "", placeholder = "", type = "text", hint = "", trailing = "" }) {
    return `
      <label class="field">
        <span class="field-label">${esc(label)}</span>
        <span class="field-control">
          <input class="field-input" type="${esc(type)}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" />
          ${trailing}
        </span>
        ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ""}
      </label>`;
  }

  function selectField({ label, value = "", placeholder = "Select" }) {
    return `
      <label class="field">
        <span class="field-label">${esc(label)}</span>
        <span class="field-control field-control--select">
          <span class="field-select-value${value ? "" : " is-placeholder"}">${esc(value || placeholder)}</span>
          ${icon("chevron", "ico--muted ico--sm")}
        </span>
      </label>`;
  }

  function primaryBtn(label, attrs = "") {
    return `<button type="button" class="btn btn-primary" ${attrs}>${esc(label)}</button>`;
  }

  function dangerBtn(label, attrs = "") {
    return `<button type="button" class="btn btn-danger" ${attrs}>${esc(label)}</button>`;
  }

  function outlineBtn(label, attrs = "") {
    return `<button type="button" class="btn btn-outline" ${attrs}>${esc(label)}</button>`;
  }

  function ghostBtn(label, attrs = "") {
    return `<button type="button" class="btn btn-ghost" ${attrs}>${esc(label)}</button>`;
  }

  return {
    esc,
    icon,
    iconImg,
    homeNav,
    contactChips,
    hotelCard,
    photoBand,
    HOTEL_CONTACT,
    HOTEL_PHOTOS,
    STAY_COUNTDOWN,
    stayCard,
    resMeta,
    primaryStep,
    checkRow,
    mutedStayRow: lockedStayRow,
    lockedStayRow,
    dashTextLink,
    pcard,
    section,
    pageShell,
    wizardChrome,
    progressBar,
    field,
    selectField,
    primaryBtn,
    dangerBtn,
    outlineBtn,
    ghostBtn,
    STAY_WINDOW,
    A,
    I
  };
})();
