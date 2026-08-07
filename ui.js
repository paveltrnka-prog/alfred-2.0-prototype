/**
 * Alfred 2.0 — HTML UI helpers (Figma DS tokens / PCard pattern)
 */
window.ALFRED_UI = (() => {
  const A = "assets";
  const I = `${A}/icons`;

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

  function topNav() {
    return `
      <header class="top-nav">
        <img class="top-nav-logo" src="${A}/logo.png" alt="Pytloun" draggable="false" />
        <button type="button" class="top-nav-avatar" aria-label="Profile">${icon("user")}</button>
      </header>`;
  }

  function hotelCard({ badge = "Za 2 týdny" } = {}) {
    return `
      <section class="hotel-card">
        <div class="hotel-hero">
          <img class="hotel-hero-img" src="${A}/hero.png" alt="" draggable="false" />
          <span class="hotel-badge">${esc(badge)}</span>
          <div class="hotel-actions">
            <span class="hotel-chip">${iconImg("phone")} Call</span>
            <span class="hotel-chip">${iconImg("envelope")} E-mail</span>
            <span class="hotel-chip">${iconImg("location-pin")} Directions</span>
          </div>
        </div>
        <div class="hotel-meta">
          <h1 class="hotel-title">Pytloun Self Hotel</h1>
          <div class="hotel-loc">
            ${iconImg("location")}
            <span>Prague, Czech Republic</span>
          </div>
        </div>
      </section>`;
  }

  function stayCard({ guests = 4 } = {}) {
    return `
      <section class="stay-card">
        <div class="stay-dates">
          <div class="stay-col">
            <span class="stay-label">Arrival</span>
            <strong class="stay-date">Sa 16. 5.</strong>
            <span class="stay-time">15:00</span>
          </div>
          <div class="stay-mid">
            <span class="stay-arrow">${icon("arrow-right")}</span>
            <span class="stay-nights">2 nights</span>
          </div>
          <div class="stay-col stay-col-end">
            <span class="stay-label">Departure</span>
            <strong class="stay-date">Mo 18. 5.</strong>
            <span class="stay-time">11:00</span>
          </div>
        </div>
        <div class="stay-res">
          <span>Reservation: 1291809101</span>
          <span class="stay-guests">${iconImg("user-group")} ${guests} guests</span>
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

  function snackbar(title, body) {
    return `
      <div class="snackbar" role="status">
        ${icon("info", "ico--info")}
        <div class="snackbar-text">
          <strong>${esc(title)}</strong>
          <span>${esc(body)}</span>
        </div>
      </div>`;
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
    topNav,
    hotelCard,
    stayCard,
    pcard,
    section,
    snackbar,
    pageShell,
    wizardChrome,
    progressBar,
    field,
    selectField,
    primaryBtn,
    outlineBtn,
    ghostBtn,
    A,
    I
  };
})();
