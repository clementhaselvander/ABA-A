/*!
 * Olebe Club — static site behaviour.
 * Vanilla-JS reimplementation of the interactions originally authored
 * against the Claude Design canvas runtime (dc-runtime / support.js):
 * mobile menu, custom cursor, scroll reveal, hero + After Dark cinematic
 * scroll, universe/privatisation switchers, gallery lightbox with swipe
 * and thumbnails, spirits carousel, reservation drawer, and the three
 * contact forms (all of which just open a prefilled WhatsApp chat, since
 * there is no backend on this static export).
 */
(function () {
  'use strict';

  var props = { whatsapp: '24100000000', showMembership: true, customCursor: true };

  var state = {
    menuOpen: false,
    lightbox: null,
    lightboxIndex: null,
    sent: false,
    sentPriv: false,
    reserveOpen: false,
    reserveType: 'table',
    reserveEvent: null,
    reserveEventName: '',
    reserveEventDate: '',
    reserveSent: false,
    pax: 2
  };

  var f = {}, pf = {}, rf = {};

  var io, go, navEl, cursorEl, cursorLabelEl, mctaEl, railEl, thumbsEl, drawerEl;
  var onScroll, onMouse, applyResponsive;
  var _rsvFocus = null, _lbx = null;

  function setState(patch) {
    if (typeof patch === 'function') patch = patch(state);
    Object.assign(state, patch);
  }

  /* ===== the following block (waLink .. syncThumbs) is lifted near-verbatim
     from the original dc-runtime component script, with `this.` stripped
     and class-method syntax converted to plain functions. ===== */

function waLink() {
    const num = (props.whatsapp || '24100000000').replace(/[^0-9]/g, '');
    let msg = 'Bonjour Olébé Club, je souhaite réserver une table.';
    if (f.nom || f.date) {
      msg = 'Bonjour Olébé Club, réservation — ' + [f.nom && 'Nom: ' + f.nom, f.pax && 'Personnes: ' + f.pax, f.date && 'Date: ' + f.date, f.heure && 'Heure: ' + f.heure, f.tel && 'Tél: ' + f.tel, f.message && f.message].filter(Boolean).join(' · ');
    }
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

function waLinkPriv() {
    const num = (props.whatsapp || '24100000000').replace(/[^0-9]/g, '');
    const f = pf;
    let msg = 'Bonjour Olébé Club, je souhaite privatiser une soirée.';
    if (f.nom || f.type || f.date) {
      msg = 'Bonjour Olébé Club, demande de privatisation — ' + [f.nom && 'Nom: ' + f.nom, f.type && 'Type: ' + f.type, f.pax && 'Personnes: ' + f.pax, f.date && 'Date: ' + f.date, f.tel && 'Tél: ' + f.tel, f.message && f.message].filter(Boolean).join(' · ');
    }
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

function reserveCopy() {
    const map = {
      table: { kicker: '09 — Réservation', title: 'Votre table.', submit: 'Demander une réservation', placeholder: 'Occasion, salon souhaité, préférences…', confirm: 'L’équipe Olébé reviendra vers vous pour confirmer votre réservation.' },
      event: { kicker: '05 — Olébé Nights', title: 'Réserver cette soirée.', submit: 'Demander une réservation', placeholder: 'Précisions sur votre venue…', confirm: 'L’équipe Olébé reviendra vers vous pour confirmer votre réservation.' },
      membership: { kicker: '08 — Cercle Olébé', title: 'Rejoindre le Cercle.', submit: 'Demander une adhésion', placeholder: 'Parlez-nous de vous…', confirm: 'L’équipe Olébé reviendra vers vous au sujet de votre demande d’adhésion.' }
    };
    return map[state.reserveType] || map.table;
  }

function reserveWaLink() {
    const num = (props.whatsapp || '24100000000').replace(/[^0-9]/g, '');
    const type = state.reserveType;
    const ev = state.reserveEvent;
    let head = 'Bonjour Olébé Club, je souhaite réserver une table.';
    if (type === 'membership') head = 'Bonjour Olébé Club, je souhaite rejoindre le Cercle Olébé.';
    else if (ev) head = 'Bonjour Olébé Club, je souhaite réserver pour ' + ev.name + (ev.date ? ' (' + ev.date + ')' : '') + '.';
    const details = [rf.nom && 'Nom: ' + rf.nom, state.pax && 'Personnes: ' + state.pax, rf.date && 'Date: ' + rf.date, rf.heure && 'Heure: ' + rf.heure, rf.tel && 'Tél: ' + rf.tel, rf.message && rf.message].filter(Boolean).join(' · ');
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(details ? head + ' ' + details : head);
  }

function track(name, meta) {
    window.dispatchEvent(new CustomEvent('olebe:track', { detail: { name: name, meta: meta } }));
  }

function setupReveal() {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) return;
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity 1.1s cubic-bezier(.16,1,.3,1), transform 1.1s cubic-bezier(.16,1,.3,1)';
      el.style.transitionDelay = ((parseInt(el.getAttribute('data-reveal'), 10) || 1) - 1) * 0.11 + 's';
    });
    io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

function setupScroll() {
    const nav = navEl;
    const px = Array.from(document.querySelectorAll('[data-parallax]'));
    const hero = document.getElementById('hero');
    const heroInner = hero ? hero.querySelector('.h-inner') : null;
    const heroFoot = hero ? hero.querySelector('.h-foot') : null;
    const heroVeil = hero ? hero.querySelector('.h-veil') : null;
    const ad = document.getElementById('afterdark');
    const adMedia = ad ? ad.querySelector('.ad-media') : null;
    const adScrim = ad ? ad.querySelector('.ad-scrim') : null;
    const adGrain = ad ? ad.querySelector('.ad-grain') : null;
    const adFadeOut = ad ? ad.querySelector('.ad-fade') : null;
    const adMicroL = ad ? ad.querySelector('.ad-micro-l') : null;
    const adMicroR = ad ? ad.querySelector('.ad-micro-r') : null;
    const adL1 = ad ? ad.querySelector('.ad-l1 span') : null;
    const adL2 = ad ? ad.querySelector('.ad-l2 span') : null;
    const ease3 = t => 1 - Math.pow(1 - t, 3);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = null;
    onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || 0;
        if (nav) {
          const on = y > 60;
          nav.style.background = on ? 'rgba(9,8,7,.9)' : 'transparent';
          nav.style.backdropFilter = on ? 'blur(14px) saturate(1.1)' : 'none';
          nav.style.borderBottomColor = on ? 'rgba(198,161,107,.22)' : 'rgba(239,231,218,0)';
          nav.style.padding = on ? '16px clamp(20px,5vw,72px)' : '34px clamp(20px,5vw,72px)';
        }
        if (mctaEl) {
          const showBar = y > (window.innerHeight || 800) * 0.9 && !state.menuOpen && !state.reserveOpen;
          mctaEl.classList.toggle('is-on', showBar);
        }
        px.forEach(el => {
          if (still && hero && hero.contains(el)) return;
          const r = el.parentElement.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
          const off = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
          el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
        });
        // Hero — fondu progressif du contenu et montée de l'overlay vers la section suivante
        if (hero && !still) {
          const vh = window.innerHeight || 1;
          const p = Math.min(1, Math.max(0, y / (vh * 0.8)));
          if (heroInner) heroInner.style.opacity = String(Math.max(0, 1 - p * 1.35).toFixed(3));
          if (heroFoot) heroFoot.style.opacity = String(Math.max(0, 1 - y / 180).toFixed(3));
          if (heroVeil) heroVeil.style.opacity = String((p * 0.55).toFixed(3));
        }
        // After Dark — signature scroll moment : photo éditoriale → fullscreen → message → sortie cinématographique
        if (ad && adMedia && !still) {
          const rect = ad.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          const total = ad.offsetHeight - vh;
          const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
          const mobile = window.innerWidth <= 760;
          const startScale = mobile ? 0.86 : 0.72;
          const eP = Math.min(1, p / 0.34);
          const scale = startScale + (1 - startScale) * ease3(eP);
          const off = 1 - ease3(eP);
          const tx = off * (mobile ? 2.4 : 4.2);
          const ty = off * (mobile ? 1.8 : 3.2);
          adMedia.style.transform = 'scale(' + scale.toFixed(4) + ') translate3d(' + tx.toFixed(2) + '%,' + ty.toFixed(2) + '%,0)';
          if (adScrim) adScrim.style.opacity = String((0.22 + Math.min(1, p / 0.6) * 0.36).toFixed(3));
          if (adGrain) adGrain.style.opacity = String((Math.min(1, p / 0.4) * 0.055).toFixed(3));
          if (adFadeOut) adFadeOut.style.opacity = String(Math.min(1, Math.max(0, (p - 0.9) / 0.1)).toFixed(3));
          const microFade = 1 - Math.min(1, Math.max(0, (p - 0.1) / 0.18));
          if (adMicroL) { adMicroL.style.opacity = microFade.toFixed(3); adMicroL.style.transform = 'translateY(' + (p * -10).toFixed(1) + 'px)'; }
          if (adMicroR) { adMicroR.style.opacity = microFade.toFixed(3); adMicroR.style.transform = 'translateY(' + (p * 10).toFixed(1) + 'px)'; }
          const in1 = Math.min(1, Math.max(0, (p - 0.40) / 0.14));
          const in2 = Math.min(1, Math.max(0, (p - 0.46) / 0.14));
          const out = Math.min(1, Math.max(0, (p - 0.82) / 0.16));
          if (adL1) { adL1.style.opacity = (in1 * (1 - out)).toFixed(3); adL1.style.transform = 'translateY(' + ((1 - ease3(in1)) * 112 - out * 22).toFixed(1) + '%)'; }
          if (adL2) { adL2.style.opacity = (in2 * (1 - out)).toFixed(3); adL2.style.transform = 'translateY(' + ((1 - ease3(in2)) * 112 - out * 22).toFixed(1) + '%)'; }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

function setupCursor() {
    const c = cursorEl;
    if (!c || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (props.customCursor === false) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      c.style.transform = 'translate3d(' + (cx - 17) + 'px,' + (cy - 17) + 'px,0)';
      raf = requestAnimationFrame(loop);
    };
    const label = cursorLabelEl;
    onMouse = e => {
      x = e.clientX; y = e.clientY;
      c.style.opacity = '1';
      const t = e.target;
      const uv = t && t.closest && t.closest('#experience .uv-visual-frame');
      const gal = t && t.closest && t.closest('#galerie .gal-ph');
      const big = uv || gal;
      const inter = big || (t && t.closest && t.closest('a,button,[data-src],article'));
      c.style.width = big ? '86px' : (inter ? '54px' : '34px');
      c.style.height = big ? '86px' : (inter ? '54px' : '34px');
      if (label) label.style.opacity = big ? '1' : '0';
      if (label && uv) label.textContent = 'Explore';
      if (label && gal) label.textContent = 'View';
      if (!raf) loop();
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
  }

function setupUniverses() {
    const list = document.querySelector('#experience .uv-list');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('.uv-item'));
    const imgs = Array.from(document.querySelectorAll('#experience .uv-img'));
    const bignum = document.querySelector('#experience .uv-bignum');
    const caption = document.querySelector('#experience .uv-caption');
    const tagEl = caption ? caption.querySelector('.uv-caption-tag') : null;
    const lineEl = caption ? caption.querySelector('.uv-caption-line') : null;
    const data = [
      { num: '01', tag: 'The Ritual', line: 'Le temps ralentit.' },
      { num: '02', tag: 'The Taste', line: 'Le verre comme rencontre.' },
      { num: '03', tag: 'The Table', line: 'Le plaisir se partage.' },
      { num: '04', tag: 'The Escape', line: 'Quand la nuit rencontre l’eau.' },
      { num: '05', tag: 'The Rhythm', line: 'Quand la lumière baisse, le tempo change.' },
      { num: '06', tag: 'The Experience', line: 'Libreville after dark.' }
    ];
    let active = 0;
    let capTimer = null;
    const select = i => {
      if (i === active) return;
      active = i;
      items.forEach(it => {
        const on = Number(it.getAttribute('data-uv')) === i;
        it.classList.toggle('is-active', on);
        it.setAttribute('aria-current', on ? 'true' : 'false');
      });
      imgs.forEach(im => im.classList.toggle('is-active', Number(im.getAttribute('data-uv-img')) === i));
      if (bignum) bignum.textContent = data[i].num;
      if (caption) {
        caption.style.opacity = '0';
        clearTimeout(capTimer);
        capTimer = setTimeout(() => {
          if (tagEl) tagEl.textContent = data[i].tag;
          if (lineEl) lineEl.textContent = data[i].line;
          caption.style.opacity = '1';
        }, 180);
      }
    };
    items.forEach(it => {
      const i = Number(it.getAttribute('data-uv'));
      it.addEventListener('mouseenter', () => select(i));
      it.addEventListener('focus', () => select(i));
      it.addEventListener('click', () => select(i));
    });
  }

function setupGalleryReveal() {
    const els = Array.from(document.querySelectorAll('#galerie .gal-reveal'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    go = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); go.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => go.observe(el));
  }

function setupPrivatisation() {
    const col = document.querySelector('#privatisation .pv-list-col');
    if (col) {
      const items = Array.from(col.querySelectorAll('.pv-list-item'));
      const imgs = Array.from(document.querySelectorAll('#privatisation .pv-list-img'));
      let active = 0;
      const select = i => {
        if (i === active) return;
        active = i;
        items.forEach(it => {
          const on = Number(it.getAttribute('data-pv')) === i;
          it.classList.toggle('is-active', on);
          it.setAttribute('aria-current', on ? 'true' : 'false');
        });
        imgs.forEach(im => im.classList.toggle('is-active', Number(im.getAttribute('data-pv-img')) === i));
      };
      items.forEach(it => {
        const i = Number(it.getAttribute('data-pv'));
        it.addEventListener('mouseenter', () => select(i));
        it.addEventListener('focus', () => select(i));
        it.addEventListener('click', () => select(i));
      });
    }
    document.querySelectorAll('#privatisation .pv-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('is-on'));
    });
  }

function stepLB(dir) {
    const list = Array.from(document.querySelectorAll('#galerie [data-src]'));
    if (!list.length || state.lightboxIndex === null) return;
    const idx = (state.lightboxIndex + dir + list.length) % list.length;
    const img = document.querySelector('.lb-img');
    if (img) img.style.opacity = '0';
    setState({ lightbox: list[idx].getAttribute('data-src'), lightboxIndex: idx });
    syncLightboxDom();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const im = document.querySelector('.lb-img');
      if (im) im.style.opacity = '1';
      syncThumbs();
    }));
  }

function jumpLB(idx) {
    const list = Array.from(document.querySelectorAll('#galerie [data-src]'));
    if (!list.length || idx === state.lightboxIndex) return;
    const img = document.querySelector('.lb-img');
    if (img) img.style.opacity = '0';
    setState({ lightbox: list[idx].getAttribute('data-src'), lightboxIndex: idx });
    syncLightboxDom();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const im = document.querySelector('.lb-img');
      if (im) im.style.opacity = '1';
      syncThumbs();
    }));
  }

function buildThumbs() {
    if (!thumbsEl || thumbsEl.childElementCount) return;
    const list = Array.from(document.querySelectorAll('#galerie [data-src]'));
    list.forEach((el, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lb-thumb';
      btn.setAttribute('aria-label', 'Voir la photo ' + String(i + 1).padStart(2, '0'));
      btn.style.backgroundImage = "url('" + el.getAttribute('data-src') + "')";
      btn.addEventListener('click', e => { e.stopPropagation(); jumpLB(i); });
      thumbsEl.appendChild(btn);
    });
  }

function syncThumbs() {
    if (!thumbsEl) return;
    const idx = state.lightboxIndex;
    Array.from(thumbsEl.children).forEach((btn, i) => {
      const on = i === idx;
      btn.classList.toggle('is-active', on);
      if (on) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

/* ===== end of lifted block ===== */

  function setupResponsive() {
    applyResponsive = function () {
      var w = window.innerWidth;
      var nav = navEl;
      if (nav) {
        var links = nav.querySelector('nav');
        var burger = nav.querySelector('button');
        if (links) links.style.display = w < 1260 ? 'none' : 'flex';
        if (burger) burger.style.display = w < 1260 ? 'flex' : 'none';
        var cta = nav.querySelector('a[href="#reservation"]');
        var tight = w < 560;
        nav.style.gap = tight ? '10px' : '32px';
        if (cta) {
          cta.style.padding = tight ? '11px 15px' : '13px 22px';
          cta.style.letterSpacing = tight ? '.14em' : '.22em';
          cta.style.fontSize = tight ? '10px' : '11px';
        }
      }
      /* #club / #reservation / #contact grid collapse below 900px is handled
         natively by the CSS "responsive safety net" rules, so it is not
         duplicated here in JS. */
    };
    applyResponsive();
    window.addEventListener('resize', applyResponsive, { passive: true });
  }

  /* ---------- DOM sync helpers: replace the original React-style re-render
     for the pieces of UI whose visibility/content depends on `state` ---------- */

  function syncLightboxDom() {
    var wrap = document.getElementById('olebe-lightbox');
    var img = document.getElementById('olebe-lb-img');
    var count = document.getElementById('olebe-lb-count');
    var open = !!state.lightbox;
    if (wrap) wrap.hidden = !open;
    if (img) img.src = state.lightbox || '';
    if (count) count.textContent = state.lightboxIndex !== null ? String(state.lightboxIndex + 1).padStart(2, '0') + ' / 12' : '';
  }

  function syncMenuDom() {
    var wrap = document.getElementById('olebe-menu');
    if (wrap) wrap.hidden = !state.menuOpen;
  }

  function syncFormSentDom() {
    var el = document.getElementById('olebe-form-sent');
    if (el) el.hidden = !state.sent;
  }

  function syncPrivFormSentDom() {
    var el = document.getElementById('olebe-privform-sent');
    if (el) el.hidden = !state.sentPriv;
  }

  function syncReserveDom() {
    var overlayWrap = document.getElementById('olebe-reserve');
    if (overlayWrap) overlayWrap.hidden = !state.reserveOpen;

    var copy = reserveCopy();
    var kicker = document.getElementById('olebe-rsv-kicker');
    var title = document.getElementById('rsv-title');
    var submitBtn = document.getElementById('olebe-rsv-submit');
    var message = document.getElementById('olebe-rsv-message');
    var pax = document.getElementById('olebe-rsv-pax');
    var wa = document.getElementById('olebe-rsv-wa');
    if (kicker) kicker.textContent = copy.kicker;
    if (title) title.textContent = copy.title;
    if (submitBtn) submitBtn.textContent = copy.submit;
    if (message) message.placeholder = copy.placeholder;
    if (pax) pax.textContent = state.pax;
    if (wa) wa.setAttribute('href', reserveWaLink());

    var ctxWrap = document.getElementById('olebe-rsv-context');
    if (ctxWrap) {
      ctxWrap.hidden = !state.reserveEvent;
      var evName = document.getElementById('olebe-rsv-evname');
      var evDate = document.getElementById('olebe-rsv-evdate');
      if (evName) evName.textContent = state.reserveEventName;
      if (evDate) evDate.textContent = state.reserveEventDate;
    }

    var formWrap = document.getElementById('olebe-rsv-form-wrap');
    if (formWrap) formWrap.hidden = state.reserveSent;
    var sentWrap = document.getElementById('olebe-rsv-sent');
    if (sentWrap) {
      sentWrap.hidden = !state.reserveSent;
      var confirmEl = document.getElementById('olebe-rsv-confirm');
      if (confirmEl) confirmEl.textContent = copy.confirm;
    }
  }

  /* ---------- action handlers: replace the renderVals() binding map ---------- */

  function openReserve(e, el) {
    var t = el || (e && e.target && e.target.closest && e.target.closest('[data-reserve]'));
    if (!t) return;
    if (e) e.preventDefault();
    var type = t.getAttribute('data-reserve') || 'table';
    var evName = t.getAttribute('data-reserve-event') || '';
    var evDate = t.getAttribute('data-reserve-date') || '';
    var trackName = t.getAttribute('data-track');
    if (trackName) track(trackName, evName || type);
    rf = {};
    _rsvFocus = document.activeElement;
    setState({
      reserveOpen: true,
      reserveSent: false,
      reserveType: type,
      reserveEvent: type === 'event' ? { name: evName, date: evDate } : null,
      reserveEventName: evName,
      reserveEventDate: evDate,
      pax: 2,
      menuOpen: false
    });
    syncReserveDom();
    syncMenuDom();
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      if (drawerEl) {
        var first = drawerEl.querySelector('.rsv-field input, .rsv-field textarea');
        if (first) first.focus();
      }
    });
  }

  function closeReserve() {
    setState({ reserveOpen: false });
    syncReserveDom();
    document.body.style.overflow = '';
    if (_rsvFocus && _rsvFocus.focus) _rsvFocus.focus();
    if (onScroll) onScroll();
  }

  function toggleMenu() {
    setState(function (s) {
      var next = !s.menuOpen;
      document.body.style.overflow = next ? 'hidden' : '';
      return { menuOpen: next };
    });
    syncMenuDom();
    if (onScroll) onScroll();
  }

  function closeMenu() {
    document.body.style.overflow = '';
    setState({ menuOpen: false });
    syncMenuDom();
    if (onScroll) onScroll();
  }

  function openLightbox(e) {
    var t = e.target.closest('[data-src]');
    if (!t) return;
    var list = Array.from(document.querySelectorAll('#galerie [data-src]'));
    document.body.style.overflow = 'hidden';
    setState({ lightbox: t.getAttribute('data-src'), lightboxIndex: list.indexOf(t) });
    syncLightboxDom();
    requestAnimationFrame(function () { requestAnimationFrame(function () { buildThumbs(); syncThumbs(); }); });
  }

  function closeLightbox() {
    document.body.style.overflow = '';
    setState({ lightbox: null, lightboxIndex: null });
    syncLightboxDom();
  }

  function decPax() {
    setState(function (s) { return { pax: Math.max(1, (s.pax || 2) - 1) }; });
    syncReserveDom();
  }
  function incPax() {
    setState(function (s) { return { pax: Math.min(20, (s.pax || 2) + 1) }; });
    syncReserveDom();
  }

  function onRField(e) { rf[e.target.name] = e.target.value; }
  function onField(e) { f[e.target.name] = e.target.value; }
  function onFieldPriv(e) { pf[e.target.name] = e.target.value; }

  function submitReserve(e) {
    e.preventDefault();
    setState({ reserveSent: true });
    syncReserveDom();
    window.open(reserveWaLink(), '_blank', 'noopener');
  }
  function submitForm(e) {
    e.preventDefault();
    setState({ sent: true });
    syncFormSentDom();
    window.open(waLink(), '_blank', 'noopener');
  }
  function submitPrivForm(e) {
    e.preventDefault();
    setState({ sentPriv: true });
    syncPrivFormSentDom();
    window.open(waLinkPriv(), '_blank', 'noopener');
  }

  function prevSpirit() { if (railEl) railEl.scrollBy({ left: -railEl.clientWidth * 0.55, behavior: 'smooth' }); }
  function nextSpirit() { if (railEl) railEl.scrollBy({ left: railEl.clientWidth * 0.55, behavior: 'smooth' }); }

  /* ---------- generic wiring for the attributes the body markup was
     rewritten to use in place of the dc-runtime template syntax:
     data-onclick / data-oninput / data-onchange / data-onsubmit /
     data-ontouchstart / data-ontouchend / data-hover / data-wa ---------- */

  var clickActions = {
    openReserve: openReserve,
    closeReserve: closeReserve,
    toggleMenu: toggleMenu,
    closeMenu: closeMenu,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    prevLightbox: function () { stepLB(-1); },
    nextLightbox: function () { stepLB(1); },
    stopLbClick: function (e) { e.stopPropagation(); },
    decPax: decPax,
    incPax: incPax,
    prevSpirit: prevSpirit,
    nextSpirit: nextSpirit
  };

  function bindHover(el) {
    var raw = el.getAttribute('data-hover');
    if (!raw) return;
    var decls = raw.split(';').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var i = s.indexOf(':');
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    });
    var orig = {};
    decls.forEach(function (d) { orig[d[0]] = el.style.getPropertyValue(d[0]); });
    el.addEventListener('mouseenter', function () {
      decls.forEach(function (d) { el.style.setProperty(d[0], d[1]); });
    });
    el.addEventListener('mouseleave', function () {
      decls.forEach(function (d) {
        if (orig[d[0]]) el.style.setProperty(d[0], orig[d[0]]); else el.style.removeProperty(d[0]);
      });
    });
  }

  function init() {
    cursorEl = document.getElementById('olebe-cursor');
    cursorLabelEl = document.getElementById('olebe-cursor-label');
    navEl = document.getElementById('olebe-nav');
    drawerEl = document.getElementById('olebe-drawer');
    mctaEl = document.getElementById('olebe-mcta');
    railEl = document.getElementById('olebe-rail');
    thumbsEl = document.getElementById('olebe-thumbs');

    Array.prototype.forEach.call(document.querySelectorAll('[data-hover]'), bindHover);

    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-onclick]');
      if (el) {
        var name = el.getAttribute('data-onclick');
        var fn = clickActions[name];
        if (fn) fn(e, el);
      }
      var waEl = e.target.closest('[data-wa]');
      if (waEl) {
        e.preventDefault();
        track('whatsapp_click');
        window.open(waEl.getAttribute('data-wa') === 'priv' ? waLinkPriv() : waLink(), '_blank', 'noopener');
      }
      if (e.target.closest('#olebe-rsv-wa')) {
        e.preventDefault();
        track('whatsapp_click');
        window.open(reserveWaLink(), '_blank', 'noopener');
      }
    });

    document.addEventListener('input', function (e) {
      var el = e.target.closest('[data-oninput]');
      if (!el) return;
      var name = el.getAttribute('data-oninput');
      if (name === 'onField') onField(e);
      else if (name === 'onFieldPriv') onFieldPriv(e);
      else if (name === 'onRField') onRField(e);
    });

    document.addEventListener('change', function (e) {
      var el = e.target.closest('[data-onchange]');
      if (!el) return;
      var name = el.getAttribute('data-onchange');
      if (name === 'onFieldPriv') onFieldPriv(e);
      else if (name === 'onField') onField(e);
      else if (name === 'onRField') onRField(e);
    });

    document.addEventListener('submit', function (e) {
      var el = e.target.closest('[data-onsubmit]');
      if (!el) return;
      var name = el.getAttribute('data-onsubmit');
      if (name === 'submitForm') submitForm(e);
      else if (name === 'submitPrivForm') submitPrivForm(e);
      else if (name === 'submitReserve') submitReserve(e);
    });

    document.addEventListener('touchstart', function (e) {
      var el = e.target.closest('[data-ontouchstart]');
      if (!el) return;
      if (el.getAttribute('data-ontouchstart') === 'lbTouchStart') _lbx = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      var el = e.target.closest('[data-ontouchend]');
      if (!el) return;
      if (el.getAttribute('data-ontouchend') === 'lbTouchEnd') {
        if (_lbx == null) return;
        var dx = e.changedTouches[0].clientX - _lbx;
        _lbx = null;
        if (Math.abs(dx) > 40) stepLB(dx < 0 ? 1 : -1);
      }
    });

    setupReveal();
    setupScroll();
    setupCursor();
    setupResponsive();
    setupUniverses();
    setupGalleryReveal();
    setupPrivatisation();

    syncReserveDom();
    syncMenuDom();
    syncLightboxDom();
    syncFormSentDom();
    syncPrivFormSentDom();

    window.addEventListener('keydown', function (e) {
      if (state.reserveOpen) {
        if (e.key === 'Escape') { closeReserve(); return; }
        if (e.key === 'Tab' && drawerEl) {
          var items = Array.prototype.filter.call(
            drawerEl.querySelectorAll('a,button,input,textarea,select'),
            function (el) { return !el.disabled && el.offsetParent !== null; }
          );
          if (!items.length) return;
          var first = items[0], last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        return;
      }
      if (!state.lightbox) return;
      if (e.key === 'Escape') { document.body.style.overflow = ''; setState({ lightbox: null, lightboxIndex: null }); syncLightboxDom(); }
      else if (e.key === 'ArrowRight') stepLB(1);
      else if (e.key === 'ArrowLeft') stepLB(-1);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
