/**
 * Screen map — HTML dashboards + check-in / checkout wizards.
 * Dashboard variants driven by phase state in app.js.
 */
window.ALFRED_FLOWS = (() => {
  const ui = () => window.ALFRED_UI;

  function guestLabel(n) {
    return `${n} ${n === 1 ? "guest" : "guests"}`;
  }

  function guestBadge(guestsDone, guestTotal) {
    return `${guestsDone}/${guestTotal} ${guestTotal === 1 ? "guest" : "guests"}`;
  }

  /**
   * Home / reservation — progressive disclosure.
   * Hotel photo + contacts live on Hotel tab (`hotel` screen).
   * @param {{phase:string, guestsDone:number, guestTotal:number, guestMode:string}} ctx
   */
  function renderDashboard(ctx) {
    const U = ui();
    const { phase, guestsDone, guestTotal } = ctx;
    const checkedIn = ["stay", "departure"].includes(phase);
    const departed = phase === "departure";
    const stepTotal = 3;

    const payDone = phase !== "prearrival";
    const preauthDone = phase === "checkin-ready" || checkedIn;
    const checkinDone = checkedIn;
    /* Same three flags drive the checklist checks and PProgress, so they agree. */
    const stepDone = payDone + preauthDone + checkinDone;

    let primary = "";
    if (phase === "prearrival") {
      primary = U.primaryStep({
        key: "pay-stay",
        title: "Pay for your stay",
        step: 1,
        stepDone,
        stepTotal,
        subtitle: "Complete payment to unlock check-in and your room key.",
        cta: "Pay 11 670 Kč",
        go: "payment"
      });
    } else if (phase === "preauth") {
      primary = U.primaryStep({
        key: "preauth",
        title: "Pre-authorization",
        step: 2,
        stepDone,
        stepTotal,
        subtitle: "Refundable deposit required before check-in.",
        cta: "Pay 2 000 Kč",
        action: "open-bank",
        amount: "2 000 Kč",
        merchant: "Pytloun Self Check-in Hotel Liberec — pre-authorization",
        returnTo: "dash-checkin-ready",
        doneHint: "Pre-authorization done — next: Check-in"
      });
    } else if (phase === "checkin-ready") {
      const guestHint =
        guestsDone > 0 ? `${guestBadge(guestsDone, guestTotal)} completed` : "";
      primary = U.primaryStep({
        key: "checkin",
        title: "Complete check-in",
        step: 3,
        stepDone,
        stepTotal,
        subtitle: guestHint || undefined,
        cta: guestsDone > 0 ? "Continue check-in" : "Start check-in",
        action: "open-checkin"
      });
    } else {
      primary = U.primaryStep({
        key: "room",
        title: "You're checked in",
        subtitle: departed
          ? "Check-out is available until 05/18 · 11:00."
          : "Your room key and stay details are ready.",
        cta: departed ? "Start check-out" : "Open room & PIN",
        go: departed ? "co-intro" : "key",
        confirm: true,
        image: "assets/hotel-1170.jpg"
      });
    }

    // All Step 1–3 rows — short status ledger (nouns); primary card keeps action titles
    const steps = [
      { title: "Payment", done: payDone, current: phase === "prearrival" },
      { title: "Deposit", done: preauthDone, current: phase === "preauth" },
      { title: "Check-in", done: checkinDone, current: phase === "checkin-ready" }
    ];
    const checkRows = steps
      .map((s) => U.checkRow({ done: s.done, current: s.current && !s.done, title: s.title }))
      .join("");

    const beforeSection = !checkedIn
      ? U.section("BEFORE ARRIVAL", `<div class="check-list">${checkRows}</div>`)
      : "";

    const yourStayFull =
      U.pcard({
        key: "room",
        state: "active",
        icon: "hotel",
        title: "Room & PIN",
        sub: "Instructions, room, map",
        chevron: true,
        go: "key"
      }) +
      U.pcard({
        state: "active",
        icon: "wifi",
        title: "Pre-arrival information",
        sub: "WiFi password: pytloun 26",
        chevron: true
      }) +
      U.pcard({
        state: "active",
        icon: "receipt",
        title: "My account",
        sub: "All my payments",
        chevron: true
      });

    const yourStayInner = checkedIn
      ? yourStayFull
      : U.lockedStayRow();

    const yourStayBlock = U.section("YOUR STAY", yourStayInner);

    let bottomLinks = "";
    const cancelLink = U.dashTextLink({
      label: "Cancel reservation",
      tone: "quiet",
      go: "cancel"
    });
    if (!checkedIn) {
      bottomLinks = `
        <div class="dash-bottom-links">
          ${U.dashTextLink({ label: "Change dates", tone: "action" })}
          ${cancelLink}
        </div>`;
    } else {
      const departure = U.pcard({
        key: "checkout",
        state: departed ? "done" : "active",
        icon: "calendar",
        title: "Check-out",
        sub: "Until 05/18 - 11:00",
        chevron: true,
        go: !departed ? "co-intro" : undefined
      });
      const management = U.pcard({
        state: "active",
        icon: "calendar-plus",
        title: "Change dates",
        sub: "Sa 16.5 – Mo 18.5",
        chevron: true
      });
      bottomLinks =
        U.section("DEPARTURE", departure) +
        U.section("RESERVATION MANAGEMENT", management) +
        `<div class="dash-bottom-links">${cancelLink}</div>`;
    }

    return U.pageShell(
      `
      ${U.homeNav()}
      <div class="page-body page-body--home">
        ${U.stayCard({ guests: guestTotal, guestsLabel: guestLabel(guestTotal), room: "Double room" })}
        ${primary}
        ${beforeSection}
        ${yourStayBlock}
        ${bottomLinks}
        <div class="page-end-spacer"></div>
      </div>
    `,
      { flushTop: true }
    );
  }

  function hotelPage() {
    const U = ui();
    return U.pageShell(
      `
      ${U.homeNav()}
      <div class="page-body page-body--hotel">
        ${U.hotelCard({ showBadge: false })}
        <div class="page-end-spacer"></div>
      </div>
    `,
      { flushTop: true }
    );
  }

  function paymentPage() {
    const U = ui();
    const items = [
      {
        title: "Accommodation",
        sub: "(1x Double Room, room: Double 03, dates: Jun 24, 2026 - Jun 27, 2026, guests: 2)",
        price: "13 140 Kč"
      },
      {
        title: "Discount - promotional price",
        sub: "(1x Double Room, room: Double 03, dates: Jun 24, 2026 - Jun 27, 2026, guests: 2)",
        price: "-1 626 Kč"
      },
      {
        title: "Resort fee",
        sub: "(guests: 2)",
        price: "156 Kč"
      }
    ];
    const rows = items
      .map(
        (it) => `
      <div class="pay-item">
        <div class="pay-item-text">
          <strong>${U.esc(it.title)}</strong>
          <small>${U.esc(it.sub)}</small>
        </div>
        <span class="pay-item-price">${U.esc(it.price)}</span>
      </div>`
      )
      .join("");

    return U.pageShell(`
      ${U.wizardChrome({ title: "Payment" })}
      <div class="wiz-body">
        <div class="pay-pending">
          <span class="pay-pending-ico">${U.icon("credit-card")}</span>
          <span class="pay-pending-label">Pending to pay</span>
          <span class="pay-pending-amount">CZK 11 670</span>
        </div>
        <p class="pay-section-label">Items to pay</p>
        <div class="pay-items">${rows}</div>
      </div>
      <div class="wiz-footer">
        ${U.primaryBtn(
          "Pay 11 670 Kč",
          'data-action="open-bank" data-amount="11 670 Kč" data-merchant="Pytloun Self Check-in Hotel Liberec — stay" data-return-to="dash-preauth" data-done-hint="Stay payment done — next: Pre-authorization"'
        )}
      </div>
    `);
  }

  function guestListPage(ctx) {
    const U = ui();
    const { guestsDone, guestTotal, guestMode } = ctx;
    const names = ["Jan Novák", "Marie Nováková", "Tomáš Svoboda", "Eva Svobodová"];
    const canRemove = guestMode === "multi" && guestTotal > 1;
    let rows = "";
    for (let i = 0; i < guestTotal; i++) {
      const done = i < guestsDone;
      const next = i === guestsDone;
      if (done) {
        rows += `
          <div class="guest-row guest-row--done">
            <span class="guest-avatar guest-avatar--done" aria-hidden="true">${U.icon("user-check")}</span>
            <span class="guest-row-text">
              <strong>${U.esc(names[i])}</strong>
              <small>adult</small>
            </span>
            <button type="button" class="guest-fill-btn guest-fill-btn--edit" disabled>Edit</button>
          </div>`;
      } else {
        rows += `
          <div class="guest-row${next ? " guest-row--next" : ""}">
            <span class="guest-avatar">${U.icon("user")}</span>
            <span class="guest-row-text">
              <strong class="is-placeholder">Guest name</strong>
              <small>adult</small>
            </span>
            <button type="button" class="guest-fill-btn" data-key="fill-${i}"
              ${next ? 'data-go="ci-document"' : "disabled"}>
              Fill in ${U.icon("chevron", "ico--fill-chevron")}
            </button>
          </div>`;
      }
    }

    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      <div class="wiz-body">
        <section class="apt-card">
          <header class="apt-head">
            <h2 class="apt-title">Red Apartment</h2>
            <p class="apt-dates">Sat May 16 — Mon May 18, 2026</p>
          </header>
          <div class="guest-list">${rows}</div>
          <div class="apt-actions">
            <button type="button" class="apt-link apt-link--share" data-key="share" data-go="ci-share">
              Share guest ${U.icon("share", "ico--share")}
            </button>
            <button type="button" class="apt-link apt-link--remove"
              ${canRemove ? 'data-action="remove-guest"' : "disabled"}
              ${canRemove ? "" : 'aria-disabled="true"'}>
              Remove guest ${U.icon("xmark", "ico--remove")}
            </button>
          </div>
        </section>
      </div>
    `);
  }

  function documentPage(filled, guest) {
    const U = ui();
    const g = guest || {};
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      ${U.progressBar("Detail", 1, 4)}
      <div class="wiz-body">
        <button type="button" class="why-banner" data-action="noop">
          <span class="why-ico">${U.icon("question-circle")}</span>
          <span class="why-text">Why do we need so much information?</span>
          ${U.icon("chevron", "ico--muted")}
        </button>
        <div class="form-card">
          ${U.selectField({ label: "Document type", value: filled ? "Passport" : "Passport" })}
          ${U.field({
            label: "Document number",
            name: "passport",
            value: filled ? g.passport || "" : "",
            placeholder: "Fill in the ID number",
            trailing: `<button type="button" class="field-trailing field-trailing--btn" data-key="scan" data-go="ci-scan" aria-label="Scan document">${U.icon("camera-viewfinder")}</button>`
          })}
          ${U.field({ label: "First name", name: "first", value: filled ? (g.name || "").split(" ")[0] : "", placeholder: "" })}
          ${U.field({ label: "Last name", name: "last", value: filled ? (g.name || "").split(" ").slice(1).join(" ") : "", placeholder: "" })}
          <div class="field">
            <span class="field-label">Date of birth</span>
            <div class="field-dob">
              <input class="field-input" placeholder="Day" value="${filled ? "12" : ""}" />
              <input class="field-input" placeholder="Month" value="${filled ? "5" : ""}" />
              <input class="field-input" placeholder="Year" value="${filled ? "1988" : ""}" />
            </div>
          </div>
          ${U.selectField({ label: "Citizenship", value: "Czechia" })}
          ${U.field({ label: "Visa", name: "visa", value: "", placeholder: "" })}
          ${U.field({ label: "License plate", name: "plate", value: "", placeholder: "" })}
          <div class="form-divider"><span>Permanent residence</span></div>
          <div class="toggle-row">
            <span>Same as first guest</span>
            <span class="toggle" aria-hidden="true"></span>
          </div>
          ${U.selectField({ label: "Select country", value: "Czechia" })}
          ${U.field({ label: "Street", name: "street", value: filled ? "Pařížská" : "", placeholder: "" })}
          ${U.field({ label: "House number", name: "house", value: filled ? "12" : "", placeholder: "" })}
          ${U.field({ label: "ZIP code", name: "zip", value: filled ? "110 00" : "", placeholder: "110 00" })}
          ${U.field({ label: "City", name: "city", value: filled ? "Praha" : "", placeholder: "" })}
        </div>
      </div>
      <div class="wiz-footer">
        ${
          filled
            ? U.primaryBtn("Continue", 'data-key="continue" data-go="ci-contact-filled"')
            : U.primaryBtn("Continue", 'data-key="continue" data-action="need-scan"')
        }
      </div>
    `);
  }

  function contactPage(filled, guest) {
    const U = ui();
    const g = guest || {};
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      ${U.progressBar("Contact info", 2, 4)}
      <div class="wiz-body">
        <div class="form-card">
          ${U.field({ label: "Mobile phone", name: "phone", value: filled ? g.phone || "" : "", placeholder: "", type: "tel" })}
          ${U.field({ label: "Your email", name: "email", value: filled ? g.email || "" : "", placeholder: "name@email.com", type: "email" })}
          <label class="check-row"><input type="checkbox" ${filled ? "checked" : ""} /> <span>I'd like to receive the newsletter with discounts and special offers</span></label>
          <label class="check-row"><input type="checkbox" ${filled ? "checked" : ""} /> <span><span class="req">*</span> I've read and accept the <a href="#" class="link-purple">Terms &amp; Conditions</a></span></label>
        </div>
      </div>
      <div class="wiz-footer">
        ${U.primaryBtn("Continue", 'data-key="continue" data-go="ci-signature"')}
      </div>
    `);
  }

  function scanPage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      <div class="wiz-body">
        <div class="form-card scan-card">
          <h2 class="scan-title">Take a photo of the document using your phone</h2>
          <div class="info-banner">
            <span class="why-ico">${U.icon("question-circle")}</span>
            <span>Focus on the document</span>
          </div>
          <div class="scan-illust">
            <img src="${U.A}/illust-scan.png" alt="" draggable="false" />
          </div>
          <div class="toggle-row toggle-row--start">
            <span class="toggle" aria-hidden="true"></span>
            <span>Scanning passport</span>
          </div>
          <button type="button" class="btn btn-primary btn-with-ico" data-key="capture" data-action="demo-scan">
            <span>Back side</span>
            <span class="btn-ico" aria-hidden="true">${U.icon("camera-viewfinder")}</span>
          </button>
          <div class="or-divider"><span>or</span></div>
          <button type="button" class="btn btn-outline btn-with-ico" data-key="file" data-action="demo-scan">
            <span>Select file</span>
            <span class="btn-ico" aria-hidden="true">${U.icon("file-import")}</span>
          </button>
        </div>
      </div>
    `);
  }

  function signaturePage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      ${U.progressBar("Signature", 3, 4)}
      <div class="wiz-body">
        <div class="sign-card">
          <button type="button" class="sign-clear" data-action="noop">Clear</button>
          <div class="sign-pad" aria-label="Signature pad">
            <span class="sign-demo">PAVEL</span>
          </div>
          <p class="sign-here">Sign here</p>
          <div class="sign-line" aria-hidden="true"></div>
        </div>
      </div>
      <div class="wiz-footer wiz-footer-stack">
        ${U.ghostBtn("Skip", 'data-key="skip" data-go="ci-arrival"')}
        ${U.primaryBtn("Continue", 'data-key="continue" data-go="ci-arrival"')}
      </div>
    `);
  }

  function arrivalPage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      ${U.progressBar("Arrival", 4, 4)}
      <div class="wiz-body">
        <div class="form-card form-card--center">
          <h2 class="arrival-title">What is your estimated arrival time?</h2>
          <p class="arrival-lead">Please provide your estimated arrival and departure time so we can prepare for your stay.</p>
          ${U.selectField({ label: "Estimated arrival time", placeholder: "Select expected arrival time" })}
          <p class="field-hint">Check-in is possible from 15:00 to 23:00.</p>
          ${U.selectField({ label: "Estimated departure time", placeholder: "Select expected depart time" })}
          <p class="field-hint">Check-out is possible from 07:00 to 11:30.</p>
        </div>
      </div>
      <div class="wiz-footer wiz-footer-stack">
        ${U.ghostBtn("Skip", 'data-key="skip" data-action="finish-guest"')}
        ${U.primaryBtn("Continue", 'data-key="continue" data-action="finish-guest"')}
      </div>
    `);
  }

  function sharePage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-in" })}
      <div class="wiz-body">
        <div class="form-card">
          <h2 class="arrival-title">Share guest check-in</h2>
          <p class="arrival-lead">Send this link to other guests so they can fill their details.</p>
          <div class="share-link">https://alfred.previo.app/checkin/demo</div>
        </div>
      </div>
      <div class="wiz-footer wiz-footer-row">
        ${U.outlineBtn("Copy link", 'data-key="copy" data-action="noop"')}
        ${U.primaryBtn("Done", 'data-key="done" data-action="back-to-guest-list"')}
      </div>
    `);
  }

  function completePage(ctx) {
    const U = ui();
    const guest = (ctx && ctx.guest) || {};
    const name = guest.name || "Guest";
    return U.pageShell(`
      <div class="modal-screen" data-complete-flow="1" data-guest-name="${U.esc(name)}">
        <div class="modal-card modal-card--rating" id="rating-modal">
          <div class="modal-card-top">
            <h2>Check-in complete!</h2>
            <button type="button" class="modal-x-box" data-action="rating-dismiss" aria-label="Close">×</button>
          </div>
          <div class="modal-check-green" aria-hidden="true">✓</div>
          <p class="modal-rate-q">How did you like the check-in<br/>with Alfred?</p>
          <div class="stars" role="radiogroup" aria-label="Rating">
            <button type="button" class="star-btn" role="radio" aria-checked="false" data-action="rate-star" data-stars="1" aria-label="1 star"></button>
            <button type="button" class="star-btn" role="radio" aria-checked="false" data-action="rate-star" data-stars="2" aria-label="2 stars"></button>
            <button type="button" class="star-btn" role="radio" aria-checked="false" data-action="rate-star" data-stars="3" aria-label="3 stars"></button>
            <button type="button" class="star-btn" role="radio" aria-checked="false" data-action="rate-star" data-stars="4" aria-label="4 stars"></button>
            <button type="button" class="star-btn" role="radio" aria-checked="false" data-action="rate-star" data-stars="5" aria-label="5 stars"></button>
          </div>
          <div class="rating-feedback hidden" id="rating-feedback">
            <label class="rating-feedback-label" for="rating-feedback-text">What could we improve?</label>
            <textarea
              id="rating-feedback-text"
              class="rating-feedback-input"
              rows="5"
              placeholder="Tell us how to improve..."
            ></textarea>
          </div>
          <button type="button" class="btn btn-primary" id="rating-cta" data-action="rating-close">Close</button>
        </div>
      </div>
    `);
  }

  function keyPage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Key", back: true })}
      <div class="wiz-body">
        <div class="info-banner info-banner--key">
          <span class="why-ico">${U.icon("question-circle")}</span>
          <span>Pro odemknutí klikněte na # vyplňte PIN a znovu klikněte na #</span>
        </div>
        <div class="key-room-card">
          <div class="key-room-head">
            <span class="key-bed-ico">${U.icon("hotel")}</span>
            <strong>Jednolůžkový pokoj Single 101</strong>
          </div>
          <div class="key-room-body">
            <p class="key-validity">PIN je platný od 22. 7. 8:00 do 27. 7. 7:00</p>
            <div class="key-pin-block">
              <p class="key-pin-code">7085#</p>
              <p class="key-pin-caption">PIN</p>
            </div>
          </div>
          <div class="key-room-foot">
            <button type="button" class="btn btn-primary btn-open" data-key="open" data-action="noop">
              Otevřít
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function coIntro() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-out" })}
      <div class="wiz-body">
        <div class="form-card co-intro-card">
          <h2 class="co-title">Ready to leave?</h2>
          <img class="co-illust" src="${U.A}/illust-bellhop.png" alt="" draggable="false" />
          <p class="co-copy">Thanks to check-out, you let us know you're leaving your room so we can start cleaning. Please leave your room key with reception.</p>
        </div>
      </div>
      <div class="wiz-footer">
        ${U.primaryBtn("Check-out", 'data-key="start" data-go="co-minibar"')}
      </div>
    `);
  }

  /** Cancellation — identical in every phase (no checkedIn branching). */
  function cancelPage() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Cancel reservation" })}
      <div class="wiz-body">
        <div class="form-card co-intro-card">
          <p class="co-copy">Before your stay begins, cancellation follows the rate conditions of your booking. Once your stay has started, ending early is handled as a paid early departure under the same booking terms.</p>
        </div>
      </div>
      <div class="wiz-footer wiz-footer-stack">
        ${U.dangerBtn("Yes, cancel", 'data-key="confirm-cancel" data-action="cancel-confirm"')}
        <a class="btn btn-outline" href="tel:+420774484001">Call reception</a>
        ${U.ghostBtn("Keep my reservation", 'data-key="keep" data-back="1"')}
      </div>
    `);
  }

  function coMinibar() {
    const U = ui();
    return U.pageShell(`
      <div class="modal-screen">
        <div class="modal-card modal-card--minibar">
          <div class="modal-card-top">
            <h2>Minibar</h2>
            <button type="button" class="modal-x-box" data-key="close-x" data-go="dash-stay" aria-label="Close">×</button>
          </div>
          <div class="minibar-ico" aria-hidden="true">
            <img class="minibar-avatar" src="${U.A}/illust-bellhop.png" alt="" width="68" height="68" />
          </div>
          <p class="minibar-q">Did you have anything else from the minibar?</p>
          <div class="minibar-actions">
            <button type="button" class="btn btn-outline" data-key="no" data-go="co-success">No</button>
            <button type="button" class="btn btn-primary" data-key="yes" data-go="co-consumption">Yes</button>
          </div>
        </div>
      </div>
    `);
  }

  function coConsumption() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-out" })}
      <div class="wiz-body">
        <div class="consume-card">
          <h3 class="consume-title">Cake</h3>
          <div class="consume-row">
            <div class="stepper" aria-label="Quantity">
              <button type="button" class="stepper-btn" data-action="noop" aria-label="Decrease">−</button>
              <span class="stepper-val">1</span>
              <button type="button" class="stepper-btn stepper-btn--plus" data-action="noop" aria-label="Increase">+</button>
            </div>
            <span class="consume-price">150 CZK /pc</span>
          </div>
        </div>
      </div>
      <div class="wiz-footer">
        ${U.primaryBtn("Continue", 'data-key="continue" data-go="co-success"')}
      </div>
    `);
  }

  function coSuccess() {
    const U = ui();
    return U.pageShell(`
      ${U.wizardChrome({ title: "Check-out", back: true })}
      <div class="wiz-body">
        <div class="form-card co-intro-card">
          <h2 class="co-title">Check-out completed</h2>
          <img class="co-illust" src="${U.A}/illust-bellhop.png" alt="" draggable="false" />
          <p class="co-copy co-copy--center">Your check-out was successful.<br/>Thank you.</p>
        </div>
      </div>
      <div class="wiz-footer">
        ${U.ghostBtn("Finish", 'data-key="done" data-go="dash-departure"')}
      </div>
    `);
  }

  const DASH_PHASE = {
    "dash-prearrival": "prearrival",
    "dash-preauth": "preauth",
    "dash-checkin-ready": "checkin-ready",
    "dash-checkin": "checkin-ready",
    "dash-stay": "stay",
    "dash-departure": "departure"
  };

  const screens = {
    "dash-prearrival": { footer: "reservation", kind: "dash" },
    "dash-preauth": { footer: "reservation", kind: "dash" },
    "dash-checkin-ready": { footer: "reservation", kind: "dash" },
    "dash-checkin": { footer: "reservation", kind: "dash" },
    "dash-stay": { footer: "reservation", kind: "dash" },
    "dash-departure": { footer: "reservation", kind: "dash" },
    hotel: { footer: "hotel", kind: "html", render: () => hotelPage() },
    payment: { kind: "html", render: () => paymentPage() },
    "ci-guest-list": { kind: "html", render: (ctx) => guestListPage(ctx) },
    "ci-document": { kind: "html", render: (ctx) => documentPage(false, ctx.guest) },
    "ci-document-filled": { kind: "html", render: (ctx) => documentPage(true, ctx.guest) },
    "ci-contact": { kind: "html", render: (ctx) => contactPage(false, ctx.guest) },
    "ci-contact-filled": { kind: "html", render: (ctx) => contactPage(true, ctx.guest) },
    "ci-scan": { kind: "html", render: () => scanPage() },
    "ci-signature": { kind: "html", render: () => signaturePage() },
    "ci-arrival": { kind: "html", render: () => arrivalPage() },
    "ci-share": { kind: "html", render: () => sharePage() },
    "ci-complete": { kind: "html", render: (ctx) => completePage(ctx) },
    key: { footer: "key", kind: "html", render: () => keyPage() },
    cancel: { kind: "html", render: () => cancelPage() },
    "co-intro": { kind: "html", render: () => coIntro() },
    "co-minibar": { kind: "html", render: () => coMinibar() },
    "co-consumption": { kind: "html", render: () => coConsumption() },
    "co-success": { kind: "html", render: () => coSuccess() }
  };

  return {
    screens,
    DASH_PHASE,
    renderDashboard,
    guestBadge
  };
})();
