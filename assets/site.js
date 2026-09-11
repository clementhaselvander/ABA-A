/* ===========================================================
   Aba'a Mvoé Lodge — comportements partagés du site multipage
   (nav, menu mobile, reveal au scroll, réservation, formulaires)
   =========================================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '24166836354';
  var LANG = (document.documentElement.lang || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';

  /* TODO: remplacer G-XXXXXXXXXX par l'ID de mesure GA4 réel une fois le compte Analytics créé. */
  var GA_ID = 'G-XXXXXXXXXX';
  var GA_READY = GA_ID.indexOf('XXXX') === -1;

  function waUrl(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function track(name, meta) {
    window.dispatchEvent(new CustomEvent('abaa:track', { detail: { name: name, meta: meta } }));
  }
  window.abaaTrack = track;

  /* ---------- analytics (GA4, si configuré) ---------- */
  function initAnalytics() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    if (GA_READY) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(s);
    }
    window.addEventListener('abaa:track', function (e) {
      var detail = e.detail || {};
      var params = typeof detail.meta === 'string' ? { label: detail.meta } : (detail.meta || {});
      gtag('event', detail.name, params);
    });
  }

  /* ---------- nav : fond au scroll + page active ---------- */
  function setupNav() {
    var header = document.querySelector('.site-header');
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var page = document.body.getAttribute('data-page');
    if (page) {
      document.querySelectorAll('a[data-page]').forEach(function (a) {
        if (a.getAttribute('data-page') === page) {
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'page');
        }
      });
    }

    var mcta = document.querySelector('.mcta');
    if (mcta) {
      var onScroll2 = function () {
        var show = window.scrollY > window.innerHeight * 0.7;
        mcta.classList.toggle('is-on', show);
      };
      window.addEventListener('scroll', onScroll2, { passive: true });
      onScroll2();
    }
  }

  /* ---------- menu mobile ---------- */
  function setupMobileMenu() {
    var burger = document.querySelector('.nav-burger');
    var menu = document.querySelector('.mobile-menu');
    var closeBtn = menu ? menu.querySelector('.mobile-menu-close') : null;
    if (!burger || !menu) return;
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
      var first = menu.querySelector('a,button');
      if (first) first.focus();
    }
    function close() {
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    burger.addEventListener('click', function () {
      menu.classList.contains('is-open') ? close() : open();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
  }

  /* ---------- reveal au scroll ---------- */
  function setupReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 0.09 + 's'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- réservation (drawer) ---------- */
  var COPY_FR = {
    table: { kicker: 'Réservation', title: 'Votre table vous attend.', submit: 'Demander une réservation', placeholder: 'Occasion, préférences, allergies…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre réservation.' },
    event: { kicker: 'Aba’a Événements', title: 'Réserver ce moment.', submit: 'Demander une réservation', placeholder: 'Précisions sur votre venue…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre réservation.' },
    membership: { kicker: 'Séjour', title: 'Réserver votre séjour.', submit: 'Demander une réservation', placeholder: 'Dates souhaitées, type de suite, occasion…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre séjour.' },
    privatisation: { kicker: 'Privatisation', title: 'Privatiser Aba’a.', submit: 'Envoyer ma demande', placeholder: 'Occasion, espace souhaité, préférences…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous au sujet de votre événement privé.' }
  };
  var COPY_EN = {
    table: { kicker: 'Reservation', title: 'Your table awaits.', submit: 'Request a reservation', placeholder: 'Occasion, preferences, allergies…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your reservation.' },
    event: { kicker: 'Aba’a Events', title: 'Reserve this moment.', submit: 'Request a reservation', placeholder: 'Details about your visit…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your reservation.' },
    membership: { kicker: 'Stay', title: 'Reserve your stay.', submit: 'Request a reservation', placeholder: 'Preferred dates, suite type, occasion…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your stay.' },
    privatisation: { kicker: 'Private hire', title: 'Book Aba’a exclusively.', submit: 'Send my request', placeholder: 'Occasion, space wanted, preferences…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you about your private event.' }
  };
  var COPY = LANG === 'en' ? COPY_EN : COPY_FR;
  var RSV_LABELS = LANG === 'en'
    ? { greeting: { table: 'Hello Aba’a Mvoé Lodge, I would like to reserve a table.', membership: 'Hello Aba’a Mvoé Lodge, I would like to reserve a stay.', privatisation: 'Hello Aba’a Mvoé Lodge, I would like to book the lodge exclusively.', event: 'Hello Aba’a Mvoé Lodge, I would like to reserve for ' }, name: 'Name', guests: 'Guests', date: 'Date', time: 'Time', phone: 'Phone' }
    : { greeting: { table: 'Bonjour Aba’a Mvoé Lodge, je souhaite réserver une table.', membership: 'Bonjour Aba’a Mvoé Lodge, je souhaite réserver un séjour.', privatisation: 'Bonjour Aba’a Mvoé Lodge, je souhaite privatiser le lodge.', event: 'Bonjour Aba’a Mvoé Lodge, je souhaite réserver pour ' }, name: 'Nom', guests: 'Personnes', date: 'Date', time: 'Heure', phone: 'Tél' };

  function setupReserveDrawer() {
    var overlay = document.querySelector('.rsv-overlay');
    var drawer = document.querySelector('.rsv-drawer');
    if (!overlay || !drawer) return;

    var kickerEl = drawer.querySelector('.rsv-kicker');
    var titleEl = drawer.querySelector('.rsv-title');
    var contextEl = drawer.querySelector('.rsv-context');
    var contextEvent = drawer.querySelector('.rsv-context-event');
    var contextDate = drawer.querySelector('.rsv-context-date');
    var formEl = drawer.querySelector('.rsv-form');
    var sentEl = drawer.querySelector('.rsv-sent');
    var sentText = drawer.querySelector('.rsv-sent-text');
    var placeholderEl = formEl ? formEl.querySelector('textarea[name="message"]') : null;
    var submitBtn = formEl ? formEl.querySelector('.rsv-submit') : null;
    var waLink = formEl ? formEl.querySelector('.rsv-wa') : null;
    var paxVal = drawer.querySelector('.rsv-pax-val');
    var pax = 2;
    var reserveType = 'table';
    var reserveEventName = '';
    var reserveEventDate = '';
    var lastFocus = null;

    function refreshWa() {
      var f = {};
      formEl.querySelectorAll('input,textarea').forEach(function (el) { if (el.name) f[el.name] = el.value; });
      var head = RSV_LABELS.greeting.table;
      if (reserveType === 'membership') head = RSV_LABELS.greeting.membership;
      else if (reserveType === 'privatisation') head = RSV_LABELS.greeting.privatisation;
      else if (reserveEventName) head = RSV_LABELS.greeting.event + reserveEventName + (reserveEventDate ? ' (' + reserveEventDate + ')' : '') + '.';
      var details = [f.nom && RSV_LABELS.name + ': ' + f.nom, RSV_LABELS.guests + ': ' + pax, f.date && RSV_LABELS.date + ': ' + f.date, f.heure && RSV_LABELS.time + ': ' + f.heure, f.tel && RSV_LABELS.phone + ': ' + f.tel, f.message && f.message].filter(Boolean).join(' · ');
      if (waLink) waLink.href = waUrl(details ? head + ' ' + details : head);
    }

    function open(type, evName, evDate, trackName) {
      lastFocus = document.activeElement;
      reserveType = type || 'table';
      reserveEventName = evName || '';
      reserveEventDate = evDate || '';
      var copy = COPY[reserveType] || COPY.table;
      if (kickerEl) kickerEl.textContent = copy.kicker;
      if (titleEl) titleEl.textContent = copy.title;
      if (placeholderEl) placeholderEl.placeholder = copy.placeholder;
      if (submitBtn) submitBtn.textContent = copy.submit;
      if (sentText) sentText.textContent = copy.confirm;
      if (contextEl) {
        if (reserveEventName) {
          contextEl.style.display = '';
          if (contextEvent) contextEvent.textContent = reserveEventName;
          if (contextDate) contextDate.textContent = reserveEventDate;
        } else {
          contextEl.style.display = 'none';
        }
      }
      pax = 2;
      if (paxVal) paxVal.textContent = pax;
      if (formEl) { formEl.reset(); formEl.style.display = ''; }
      if (sentEl) sentEl.style.display = 'none';
      if (trackName) track(trackName, evName || reserveType);
      refreshWa();
      overlay.classList.add('is-on');
      drawer.classList.add('is-on');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        var first = drawer.querySelector('input,textarea');
        if (first) first.focus();
      });
    }

    function close() {
      overlay.classList.remove('is-on');
      drawer.classList.remove('is-on');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-reserve]');
      if (!t) return;
      e.preventDefault();
      open(t.getAttribute('data-reserve'), t.getAttribute('data-reserve-event'), t.getAttribute('data-reserve-date'), t.getAttribute('data-track'));
    });
    overlay.addEventListener('click', close);
    drawer.querySelectorAll('.rsv-back').forEach(function (b) { b.addEventListener('click', close); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-on')) close();
    });

    drawer.querySelectorAll('.rsv-pax-dec, .rsv-pax-inc').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pax = btn.classList.contains('rsv-pax-inc') ? Math.min(20, pax + 1) : Math.max(1, pax - 1);
        if (paxVal) paxVal.textContent = pax;
        refreshWa();
      });
    });
    if (formEl) {
      formEl.addEventListener('input', refreshWa);
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        refreshWa();
        formEl.style.display = 'none';
        if (sentEl) sentEl.style.display = '';
        window.open(waLink ? waLink.href : waUrl(LANG === 'en' ? 'Hello Aba’a Mvoé Lodge.' : 'Bonjour Aba’a Mvoé Lodge.'), '_blank', 'noopener');
      });
    }
  }

  /* ---------- boutique du foyer (panier cigares + livraison) ---------- */
  var CART_LABELS = LANG === 'en'
    ? { less: 'Less', more: 'More', remove: 'Remove', free: 'Free', delivery: 'Delivery', pickup: 'Pickup at The Hearth', greeting: 'Hello Aba’a Mvoé Lodge, I would like to order from The Hearth:', mode: 'Method', zone: 'Zone', address: 'Address', subtotal: 'Subtotal', total: 'Total', name: 'Name', phone: 'Phone' }
    : { less: 'Moins', more: 'Plus', remove: 'Retirer', free: 'Offerte', delivery: 'Livraison', pickup: 'Retrait au Foyer', greeting: 'Bonjour Aba’a Mvoé Lodge, je souhaite commander au Foyer :', mode: 'Mode', zone: 'Zone', address: 'Adresse', subtotal: 'Sous-total', total: 'Total', name: 'Nom', phone: 'Tél' };

  function setupCigarCart() {
    var rows = document.querySelectorAll('.price-row[data-cigar]');
    var fab = document.querySelector('.cart-fab');
    var overlay = document.querySelector('.cart-overlay');
    var drawer = document.querySelector('.cart-drawer');
    if (!rows.length || !fab || !overlay || !drawer) return;

    var CART_KEY = 'abaa_cigar_cart';
    var ZONE_FEES = { akanda: 5000, libreville: 8000, owendo: 8000 };
    var FREE_THRESHOLD = 150000;

    var listEl = drawer.querySelector('.cart-list');
    var emptyEl = drawer.querySelector('.cart-empty');
    var subtotalEl = drawer.querySelector('.cart-subtotal-val');
    var feeEl = drawer.querySelector('.cart-fee-val');
    var totalEl = drawer.querySelector('.cart-total-val');
    var feeRow = drawer.querySelector('.cart-fee-row');
    var zoneSel = drawer.querySelector('select[name="zone"]');
    var addressField = drawer.querySelector('.cart-address-field');
    var formEl = drawer.querySelector('.cart-form');
    var sentEl = drawer.querySelector('.cart-sent');
    var waLink = drawer.querySelector('.cart-wa');
    var countEl = fab.querySelector('.cart-fab-count');
    var lastFocus = null;

    function loadCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
    }
    function saveCart() {
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }
    var cart = loadCart();

    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

    function findItem(name) {
      for (var i = 0; i < cart.length; i++) { if (cart[i].name === name) return cart[i]; }
      return null;
    }

    function addItem(name, price) {
      var item = findItem(name);
      if (item) item.qty += 1;
      else cart.push({ name: name, price: price, qty: 1 });
      saveCart();
      track('cigar_add', name);
      render();
    }

    function setQty(name, qty) {
      if (qty <= 0) { cart = cart.filter(function (c) { return c.name !== name; }); }
      else { var item = findItem(name); if (item) item.qty = qty; }
      saveCart();
      render();
    }

    function subtotal() {
      return cart.reduce(function (sum, c) { return sum + c.price * c.qty; }, 0);
    }
    function totalQty() {
      return cart.reduce(function (sum, c) { return sum + c.qty; }, 0);
    }
    function currentMode() {
      var checked = drawer.querySelector('input[name="cart-mode"]:checked');
      return checked ? checked.value : 'retrait';
    }
    function deliveryFee() {
      if (currentMode() !== 'livraison') return 0;
      if (subtotal() >= FREE_THRESHOLD) return 0;
      var zone = zoneSel ? zoneSel.value : 'akanda';
      return ZONE_FEES[zone] || ZONE_FEES.akanda;
    }

    function render() {
      var q = totalQty();
      fab.classList.toggle('is-on', q > 0);
      if (countEl) countEl.textContent = q;

      if (listEl) {
        listEl.innerHTML = '';
        cart.forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'cart-item';
          var nameSpan = document.createElement('span');
          nameSpan.className = 'cart-item-name';
          nameSpan.textContent = item.name;
          var ctrl = document.createElement('div');
          ctrl.className = 'cart-item-ctrl';
          var dec = document.createElement('button');
          dec.type = 'button'; dec.textContent = '−'; dec.setAttribute('aria-label', CART_LABELS.less);
          var qtySpan = document.createElement('span');
          qtySpan.className = 'cart-item-qty'; qtySpan.textContent = item.qty;
          var inc = document.createElement('button');
          inc.type = 'button'; inc.textContent = '+'; inc.setAttribute('aria-label', CART_LABELS.more);
          ctrl.appendChild(dec); ctrl.appendChild(qtySpan); ctrl.appendChild(inc);
          var priceSpan = document.createElement('span');
          priceSpan.className = 'cart-item-price'; priceSpan.textContent = fmt(item.price * item.qty);
          var rm = document.createElement('button');
          rm.type = 'button'; rm.className = 'cart-item-rm'; rm.textContent = '×'; rm.setAttribute('aria-label', CART_LABELS.remove);
          dec.addEventListener('click', function () { setQty(item.name, item.qty - 1); });
          inc.addEventListener('click', function () { setQty(item.name, item.qty + 1); });
          rm.addEventListener('click', function () { setQty(item.name, 0); });
          row.appendChild(nameSpan); row.appendChild(ctrl); row.appendChild(priceSpan); row.appendChild(rm);
          listEl.appendChild(row);
        });
      }
      if (emptyEl) emptyEl.style.display = cart.length ? 'none' : '';
      if (formEl) formEl.style.display = cart.length ? '' : 'none';

      var sub = subtotal();
      var fee = deliveryFee();
      var mode = currentMode();
      if (subtotalEl) subtotalEl.textContent = fmt(sub) + ' FCFA';
      if (feeRow) feeRow.style.display = mode === 'livraison' ? '' : 'none';
      if (feeEl) feeEl.textContent = (mode === 'livraison' && fee === 0) ? CART_LABELS.free : fmt(fee) + ' FCFA';
      if (totalEl) totalEl.textContent = fmt(sub + fee) + ' FCFA';
      if (addressField) addressField.style.display = mode === 'livraison' ? '' : 'none';

      refreshWa();
    }

    function refreshWa() {
      if (!waLink || !formEl) return;
      var f = {};
      formEl.querySelectorAll('input,textarea,select').forEach(function (el) { if (el.name) f[el.name] = el.value; });
      var mode = currentMode();
      var sub = subtotal();
      var fee = deliveryFee();
      var lines = [CART_LABELS.greeting];
      cart.forEach(function (item) { lines.push('- ' + item.qty + 'x ' + item.name + ' (' + fmt(item.price * item.qty) + ' FCFA)'); });
      lines.push(CART_LABELS.mode + ': ' + (mode === 'livraison' ? CART_LABELS.delivery : CART_LABELS.pickup));
      if (mode === 'livraison') {
        if (zoneSel) lines.push(CART_LABELS.zone + ': ' + zoneSel.options[zoneSel.selectedIndex].text);
        if (f.adresse) lines.push(CART_LABELS.address + ': ' + f.adresse);
      }
      lines.push(CART_LABELS.subtotal + ': ' + fmt(sub) + ' FCFA');
      if (mode === 'livraison') lines.push(CART_LABELS.delivery + ': ' + (fee === 0 ? CART_LABELS.free : fmt(fee) + ' FCFA'));
      lines.push(CART_LABELS.total + ': ' + fmt(sub + fee) + ' FCFA');
      if (f.nom) lines.push(CART_LABELS.name + ': ' + f.nom);
      if (f.tel) lines.push(CART_LABELS.phone + ': ' + f.tel);
      waLink.href = waUrl(lines.join('\n'));
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      overlay.classList.add('is-on');
      drawer.classList.add('is-on');
      document.body.style.overflow = 'hidden';
      if (sentEl) sentEl.style.display = 'none';
      if (formEl) formEl.style.display = cart.length ? '' : 'none';
      render();
    }
    function closeDrawer() {
      overlay.classList.remove('is-on');
      drawer.classList.remove('is-on');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    rows.forEach(function (row) {
      var btn = row.querySelector('.cigar-add');
      if (!btn) return;
      btn.addEventListener('click', function () {
        addItem(row.getAttribute('data-name'), parseInt(row.getAttribute('data-price'), 10));
        openDrawer();
      });
    });

    fab.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('.cart-back').forEach(function (b) { b.addEventListener('click', closeDrawer); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-on')) closeDrawer(); });
    drawer.querySelectorAll('input[name="cart-mode"]').forEach(function (input) { input.addEventListener('change', render); });
    if (zoneSel) zoneSel.addEventListener('change', render);
    if (formEl) {
      formEl.addEventListener('input', refreshWa);
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        refreshWa();
        track('cigar_order', totalQty());
        window.open(waLink.href, '_blank', 'noopener');
        formEl.style.display = 'none';
        if (sentEl) sentEl.style.display = '';
        cart = [];
        saveCart();
        render();
      });
    }

    render();
  }

  /* ---------- formulaires génériques → WhatsApp (privatisation, contact) ---------- */
  function setupWaForms() {
    document.querySelectorAll('form[data-wa-form]').forEach(function (form) {
      var confirmEl = form.querySelector('.form-sent') || (form.parentElement && form.parentElement.querySelector('.form-sent'));
      var submitBtn = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var prefix = form.getAttribute('data-wa-prefix') || 'Bonjour Aba’a Mvoé Lodge.';
        var f = {};
        form.querySelectorAll('input,textarea,select').forEach(function (el) {
          if (!el.name) return;
          if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
          f[el.name] = el.value;
        });
        var details = Object.keys(f).map(function (k) { return f[k] ? k.charAt(0).toUpperCase() + k.slice(1) + ': ' + f[k] : ''; }).filter(Boolean).join(' · ');
        window.open(waUrl(details ? prefix + ' ' + details : prefix), '_blank', 'noopener');
        if (submitBtn) submitBtn.disabled = true;
        if (confirmEl) confirmEl.classList.add('is-on');
      });
    });
  }

  /* ---------- comparateur jour / nuit ---------- */
  function setupCompare() {
    document.querySelectorAll('.cmp-wrap').forEach(function (wrap) {
      var after = wrap.querySelector('.cmp-after');
      var handle = wrap.querySelector('.cmp-handle');
      var range = wrap.querySelector('.cmp-range');
      if (!range) return;
      range.addEventListener('input', function () {
        var v = range.value;
        if (after) after.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        if (handle) handle.style.left = v + '%';
      });
    });
  }

  /* ---------- vidéos autoplay en sourdine (léger : chargement différé, désactivé sur mobile/données limitées) ---------- */
  function setupVideos() {
    var videos = document.querySelectorAll('video[autoplay]');
    if (!videos.length) return;
    var isMobile = window.matchMedia('(max-width: 760px)').matches;
    var saveData = !!(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
    videos.forEach(function (v) {
      v.muted = true; v.loop = true;
      v.removeAttribute('autoplay');
      if (isMobile || saveData) return; /* reste sur l'image poster, pas de téléchargement auto */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) v.play().catch(function () {});
            else v.pause();
          });
        }, { threshold: 0.25 });
        io.observe(v);
      } else {
        v.play().catch(function () {});
      }
    });
  }

  /* ---------- lien WhatsApp générique (data-wa-link) ---------- */
  function setupWaLinks() {
    document.querySelectorAll('[data-wa-link]').forEach(function (a) {
      a.href = waUrl(a.getAttribute('data-wa-link'));
      a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function () { track('whatsapp_click'); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAnalytics();
    setupNav();
    setupMobileMenu();
    setupReveal();
    setupReserveDrawer();
    setupCigarCart();
    setupWaForms();
    setupCompare();
    setupVideos();
    setupWaLinks();
  });
})();
