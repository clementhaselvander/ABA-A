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

  /* ---------- reveal au scroll ----------
     Langage de mouvement commun à toutes les sections courantes. Quand un bloc
     [data-reveal] atteint ~20 % de visibilité, ses éléments apparaissent l'un après
     l'autre dans l'ordre de lecture — surtitre doré, titre, ligne dorée, paragraphe,
     bouton — avec un décalage de 120 ms (90 ms sur smartphone). Les grands titres
     montent depuis l'intérieur de leur emplacement (masque overflow: hidden posé le
     temps de l'apparition seulement). Les blocs sans en-tête de section (médias,
     grilles de vignettes, cartes, rails) conservent la révélation d'ensemble d'origine.
     Joué une seule fois ; à la fin, toutes les classes et le masque sont retirés, donc
     rien ne subsiste qui pourrait retarder les effets hover existants.
     Styles : bloc « .rv » de site.css. */

  /* éléments animables d'un bloc : on traverse les simples div de regroupement */
  function revealItems(root, depth, out) {
    var kids = root.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.tagName === 'BR' || el.hidden) continue;
      if (depth < 2 && el.tagName === 'DIV' && !el.className && !el.getAttribute('style')) {
        revealItems(el, depth + 1, out);
      } else {
        out.push(el);
      }
    }
    return out;
  }

  /* un bloc n'entre en cascade que s'il porte un en-tête de section */
  function revealCascade(block) {
    var items = revealItems(block, 0, []);
    if (items.length < 2 || items.length > 8) return null;
    var hasHead = items.some(function (el) {
      return el.tagName === 'H1' || el.tagName === 'H2' ||
        el.classList.contains('eyebrow') || el.classList.contains('lede');
    });
    return hasHead ? items : null;
  }

  /* grand titre : son contenu est glissé dans un conteneur masqué, le temps de monter */
  function revealMask(h) {
    var inner = document.createElement('span');
    inner.className = 'rv-mask-inner';
    while (h.firstChild) inner.appendChild(h.firstChild);
    h.appendChild(inner);
    h.classList.add('rv-mask');
    return inner;
  }

  function revealUnmask(h) {
    var inner = h.firstElementChild;
    h.classList.remove('rv-mask');
    if (!inner || !inner.classList.contains('rv-mask-inner')) return;
    while (inner.firstChild) h.insertBefore(inner.firstChild, inner);
    h.removeChild(inner);
  }

  function setupReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* aucune animation ici : le filtre est retiré dans la foulée */
      els.forEach(function (el) { el.classList.add('is-in'); el.classList.add('rv-clear'); });
      return;
    }

    /* smartphone : décalages et durée resserrés, la fluidité prime */
    var narrow = window.matchMedia('(max-width: 760px)').matches;
    var STEP = narrow ? 90 : 120;   /* décalage entre deux éléments (ms) */
    var DUR = narrow ? 650 : 800;   /* durée d'apparition d'un élément (ms) */

    /* blocs d'ensemble : le décalage ne vaut que pour des frères qui apparaissent
       ensemble, c'est-à-dire les enfants d'une grille ou d'une rangée — cartes et
       tuiles. Le décalage s'y compte par parent : un compteur tenu sur la liste
       entière de la page faisait tourner le modulo au milieu d'un rang, et les cartes
       d'une même grille partaient dans le désordre.
       Une pile verticale n'est pas un groupe : les blocs de prix de la carte se
       succèdent sur toute la hauteur de la page et arrivent chacun à leur tour au fil
       du défilement ; leur imposer un décalage ne ferait que retarder leur venue. */
    var rowParents = [], rowIsRow = [], rowCounts = [];

    function groupRank(el) {
      var parent = el.parentNode;
      if (!parent || parent.nodeType !== 1) return 0;
      var g = rowParents.indexOf(parent);
      if (g < 0) {
        g = rowParents.length;
        var cs = window.getComputedStyle(parent), disp = cs.display;
        rowParents.push(parent);
        rowIsRow.push(disp === 'grid' || disp === 'inline-grid' ||
          ((disp === 'flex' || disp === 'inline-flex') && cs.flexDirection.indexOf('column') !== 0));
        rowCounts.push(0);
      }
      return rowIsRow[g] ? rowCounts[g]++ : 0;
    }

    /* section qui suit la séquence immersive : elle se lève dans le fondu, son
       contenu paraît dès l'entrée à l'écran plutôt qu'à 20 %, sinon le visiteur
       traverse près d'un écran de fond vide après la fermeture au noir. */
    var afterImm = document.querySelector('[data-immersive] + section');

    els.forEach(function (el) {
      if (afterImm && afterImm.contains(el)) el._rvEarly = true;
      var items = revealCascade(el);
      if (!items) {
        /* bloc d'ensemble : dans une grille, les frères se succèdent dans l'ordre de
           lecture ; ailleurs, le bloc part sans attendre. */
        /* plafonné : une grille longue ne doit pas traîner sur toute sa longueur */
        var d = Math.min(groupRank(el), 5) * 0.09;
        el.style.transitionDelay = d + 's';
        el._rvPlainEnd = d * 1000 + 900 + 100;  /* .9s de transition (site.css) + marge */
        return;
      }
      el.classList.add('rv-split');
      var masked = [], targets = [];
      items.forEach(function (item, n) {
        /* le délai reste porté par l'élément lui-même : le masque du grand titre
           en hérite, alors que la remontée revient à son contenu */
        item.style.setProperty('--rv-d', (STEP * n) + 'ms');
        var target = item;
        if (item.tagName === 'H1' || item.tagName === 'H2') {
          target = revealMask(item);
          masked.push(item);
        }
        target.classList.add('rv-i');
        targets.push(target);
      });
      el._rvItems = items;
      el._rvTargets = targets;
      el._rvMasked = masked;
      el._rvEnd = STEP * (items.length - 1) + DUR + 200;
    });

    /* une fois l'apparition terminée, on efface toute trace de l'animation */
    function revealCleanup(el) {
      if (!el._rvItems) return;
      el.classList.remove('rv-split');
      el._rvTargets.forEach(function (t) { t.classList.remove('rv-i'); });
      el._rvItems.forEach(function (item) { item.style.removeProperty('--rv-d'); });
      el._rvMasked.forEach(revealUnmask);
      el._rvItems = el._rvTargets = el._rvMasked = null;
    }

    function revealIn(el) {
      el.classList.add('is-in');
      if (el._rvEnd) setTimeout(function () { revealCleanup(el); }, el._rvEnd);
      /* bloc d'ensemble : le flou dissipé, on retire le filtre pour de bon (« .rv-clear ») */
      if (el._rvPlainEnd) setTimeout(function () { el.classList.add('rv-clear'); }, el._rvPlainEnd);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var r = e.boundingClientRect;
        var tall = r.height > vh * 0.8 && e.intersectionRatio > 0 && r.top < vh * 0.75;
        /* déclenchement à ~20 % de visibilité ; les blocs plus hauts que l'écran et les
           sections déjà dépassées (saut d'ancre) sont affichés sans attendre ce seuil */
        if (e.intersectionRatio >= 0.2 || tall || r.bottom < 0 || (e.target._rvEarly && e.isIntersecting)) {
          revealIn(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: [0, 0.2], rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- transitions cinématographiques : noir → photographie → contenu ----------
     Sections plein cadre (hero de page, bandeau signature, appel final) : la photo émerge du noir,
     puis surtitre / titre / texte / boutons suivent en cascade, la ligne dorée se dessine.
     Joué une seule fois, à ~20 % de visibilité. Styles : bloc « .cine » de site.css. */
  function setupCinematic() {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var SPECS = [
      { sel: '.page-hero', base: 150, items: ['.page-hero-crumb', '.page-hero-title', '.page-hero-lede'] },
      { sel: '.signature-band', base: 350, items: ['h2', 'span'] },
      { sel: '.fcta', base: 350, items: ['.fcta-kicker', '.fcta-title', '.btn-row'] }
    ];
    var STEP = 130; /* décalage entre deux éléments (ms) */
    var targets = [];
    SPECS.forEach(function (spec) {
      document.querySelectorAll(spec.sel).forEach(function (section) {
        section.classList.add('cine');
        if (section.querySelector('img')) section.classList.add('cine-photo');
        var n = 0;
        spec.items.forEach(function (sel) {
          var el = section.querySelector(sel);
          if (!el) return;
          el.classList.add('cine-item');
          el.style.setProperty('--cine-d', (spec.base + STEP * n++) + 'ms');
        });
        section.style.setProperty('--cine-line-d', (spec.base + 200) + 'ms');
        targets.push(section);
      });
    });
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        /* section déjà dépassée (saut d'ancre) : on l'affiche sans animation visible */
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          e.target.classList.add('cine-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- parallaxe discrète sur les grandes photographies immersives ----------
     Réservé aux vues d'ensemble du lieu en plein cadre (salon, piscine, bord de mer) :
     pendant le scroll, la photo se déplace un peu moins vite que le contenu placé devant
     elle — 20 px au maximum sur desktop, 8 px sur smartphone. On écrit la propriété
     `translate` (et non `transform`) pour laisser intactes les animations Ken Burns et
     les transitions cinématographiques. Le relais est pris en douceur : rien ne bouge
     tant que la révélation de la section n'est pas terminée, puis l'amplitude monte
     progressivement depuis zéro, sans saut possible. Styles : bloc « .pxl » de site.css. */
  function setupParallax() {
    if (!('IntersectionObserver' in window)) return;
    if (!(window.CSS && CSS.supports && CSS.supports('translate', '0 1px'))) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* photographies immersives retenues ; macros cigares, assiettes et bouteilles restent fixes */
    var IMMERSIVE = /(lounge-wide|lounge-chesterfield|lounge-portrait|pool-dusk|pool-day|pool-night-tree|beach)\./;
    var SETTLE = 900; /* laisse la section, la photo, le titre et la ligne dorée se poser */
    var RAMP = 700;   /* puis le parallaxe monte de 0 à son amplitude */

    var items = [];
    document.querySelectorAll('.home-hero-media > img, .page-hero-media > img, .fcta > img, .signature-band > img')
      .forEach(function (img) {
        if (!IMMERSIVE.test(img.getAttribute('src') || '')) return;
        img.classList.add('pxl');
        /* le parent porte déjà le cadre de la section (inset: 0 pour les hero) */
        items.push({ img: img, box: img.parentNode, visible: false, since: 0, y: null });
      });
    if (!items.length) return;

    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function amplitude() {
      var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pxl-range'));
      return (v > 0 ? v : 40) / 2;
    }

    var amp = amplitude();
    var queued = false;

    function update() {
      queued = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var t = now();
      var ramping = false;
      items.forEach(function (it) {
        if (!it.visible) return;
        var r = it.box.getBoundingClientRect();
        var span = (vh + r.height) / 2;
        if (span <= 0) return;
        /* -1 : section sous le pli · 0 : centrée · 1 : sortie par le haut */
        var p = (vh / 2 - (r.top + r.height / 2)) / span;
        p = p < -1 ? -1 : (p > 1 ? 1 : p);
        /* montée progressive (smoothstep) : démarre à 0, donc aucun à-coup à la prise de relais */
        var k = (t - it.since) / RAMP;
        if (k < 1) ramping = true;
        k = k <= 0 ? 0 : (k >= 1 ? 1 : k * k * (3 - 2 * k));
        var y = Math.round(p * amp * k * 100) / 100;
        if (y !== it.y) { it.y = y; it.img.style.translate = '0 ' + y + 'px'; }
      });
      if (ramping) request();
    }

    function request() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var it = null;
        for (var i = 0; i < items.length; i++) { if (items[i].box === e.target) { it = items[i]; break; } }
        if (!it) return;
        it.visible = e.isIntersecting;
        if (e.isIntersecting && !it.since) it.since = now() + SETTLE;
      });
      request();
    }, { rootMargin: '15% 0px' });
    items.forEach(function (it) { io.observe(it.box); });

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', function () { amp = amplitude(); request(); }, { passive: true });
    request();
  }

  /* ---------- réservation (drawer) ---------- */
  var COPY_FR = {
    table: { kicker: 'Réservation', title: 'Votre table vous attend.', submit: 'Demander une réservation', placeholder: 'Occasion, préférences, allergies…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre réservation.' },
    event: { kicker: 'Aba’a Événements', title: 'Réserver ce moment.', submit: 'Demander une réservation', placeholder: 'Précisions sur votre venue…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre réservation.' },
    membership: { kicker: 'Votre venue', title: 'Préparer votre venue.', submit: 'Demander une réservation', placeholder: 'Date souhaitée, espace, occasion…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous pour confirmer votre réservation.' },
    privatisation: { kicker: 'Privatisation', title: 'Privatiser Aba’a.', submit: 'Envoyer ma demande', placeholder: 'Occasion, espace souhaité, préférences…', confirm: 'Il vous reste à envoyer le message WhatsApp qui vient de s’ouvrir — l’équipe Aba’a reviendra ensuite vers vous au sujet de votre événement privé.' }
  };
  var COPY_EN = {
    table: { kicker: 'Reservation', title: 'Your table awaits.', submit: 'Request a reservation', placeholder: 'Occasion, preferences, allergies…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your reservation.' },
    event: { kicker: 'Aba’a Events', title: 'Reserve this moment.', submit: 'Request a reservation', placeholder: 'Details about your visit…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your reservation.' },
    membership: { kicker: 'Your visit', title: 'Plan your visit.', submit: 'Request a reservation', placeholder: 'Preferred date, space, occasion…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you to confirm your reservation.' },
    privatisation: { kicker: 'Private hire', title: 'Book Aba’a exclusively.', submit: 'Send my request', placeholder: 'Occasion, space wanted, preferences…', confirm: 'One step left: send the WhatsApp message that just opened — the Aba’a team will then get back to you about your private event.' }
  };
  var COPY = LANG === 'en' ? COPY_EN : COPY_FR;
  var RSV_LABELS = LANG === 'en'
    ? { greeting: { table: 'Hello Aba’a Mvoé Lodge, I would like to reserve a table.', membership: 'Hello Aba’a Mvoé Lodge, I would like to plan my visit.', privatisation: 'Hello Aba’a Mvoé Lodge, I would like to book the Business Lounge exclusively.', event: 'Hello Aba’a Mvoé Lodge, I would like to reserve for ' }, name: 'Name', guests: 'Guests', date: 'Date', time: 'Time', phone: 'Phone' }
    : { greeting: { table: 'Bonjour Aba’a Mvoé Lodge, je souhaite réserver une table.', membership: 'Bonjour Aba’a Mvoé Lodge, je souhaite organiser ma venue.', privatisation: 'Bonjour Aba’a Mvoé Lodge, je souhaite privatiser le Business Lounge.', event: 'Bonjour Aba’a Mvoé Lodge, je souhaite réserver pour ' }, name: 'Nom', guests: 'Personnes', date: 'Date', time: 'Heure', phone: 'Tél' };

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

    /* Fermé, le tiroir n'était que translaté hors écran : ses champs restaient
       dans l'ordre de tabulation et son titre dans le plan de la page. */
    function setInert(on) {
      if ('inert' in HTMLElement.prototype) drawer.inert = on;
      else if (on) drawer.setAttribute('aria-hidden', 'true');
      else drawer.removeAttribute('aria-hidden');
    }
    setInert(true);
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
      setInert(false);
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
      setInert(true);
    }

    /* Le focus doit rester dans le tiroir tant qu'il est ouvert. */
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !drawer.classList.contains('is-on')) return;
      var f = [].slice.call(drawer.querySelectorAll('a[href],button,input,textarea,select'))
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

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

  /* ---------- boutique de cigares (panier cigares + livraison) ---------- */
  var CART_LABELS = LANG === 'en'
    ? { less: 'Less', more: 'More', remove: 'Remove', free: 'Free', delivery: 'Delivery', pickup: 'Pickup at the cigar cellar', greeting: 'Hello Aba’a Mvoé Lodge, I would like to order cigars:', mode: 'Method', zone: 'Zone', address: 'Address', subtotal: 'Subtotal', total: 'Total', name: 'Name', phone: 'Phone' }
    : { less: 'Moins', more: 'Plus', remove: 'Retirer', free: 'Offerte', delivery: 'Livraison', pickup: 'Retrait à la cave à cigares', greeting: 'Bonjour Aba’a Mvoé Lodge, je souhaite commander des cigares :', mode: 'Mode', zone: 'Zone', address: 'Adresse', subtotal: 'Sous-total', total: 'Total', name: 'Nom', phone: 'Tél' };

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
      setInert(false);
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

  /* ---------- voile de fumée entre deux sections ----------
     Le voile ne dérive que pendant qu'il traverse l'écran : hors champ,
     l'animation est mise en pause et l'opacité retombe à zéro, donc aucune page
     ne fait tourner de fumée en arrière-plan.
     Mouvement réduit, ou navigateur sans IntersectionObserver : la classe n'est
     jamais posée, le voile reste invisible et le site est inchangé.
     Styles : bloc « voile de fumée entre deux sections » de site.css. */
  function setupSmoke() {
    var veils = Array.prototype.slice.call(document.querySelectorAll('.smoke-veil'));
    if (!veils.length) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-drifting', e.isIntersecting);
      });
    }, { rootMargin: '12% 0px' });
    veils.forEach(function (v) { io.observe(v); });
  }

  /* ---------- passage de lumière sur le doré ----------
     Une lumière chaude traverse une seule fois quelques pièces dorées, à
     l'apparition de la section qui les porte, puis tout redevient stable : la
     classe est retirée une fois le passage terminé, donc aucune animation ne
     continue de tourner en arrière-plan de la page.

     Le délai attend d'abord que la ligne ait fini de se dessiner (cinématique
     pour le hero, cascade de révélation pour le bandeau de chiffres), puis
     marque une pause d'environ 400 ms. C'est cette pause qui donne la lecture
     « finition métallique » plutôt que « animation » : le tracé et le reflet ne
     se confondent pas, ils se succèdent.

     Deux pièces au plus par page : la ligne dorée du hero et, là où il existe,
     le filet haut du bandeau de chiffres. Les boutons, eux, ne réagissent qu'au
     survol et relèvent du CSS seul.

     La classe est posée sur le conteneur de la ligne, et non sur la ligne :
     pendant son tracé celle-ci est à scaleX(0), donc d'aire nulle, et aucun
     observateur d'intersection ne peut s'y accrocher.

     Mouvement réduit, ou navigateur sans IntersectionObserver : rien n'est posé,
     le site est strictement inchangé.
     Styles : bloc « passage de lumière sur le doré » de site.css. */
  function setupGoldSheen() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* lueur d'ambiance : une seule section par page, la première après le hero.
       Elle ne dérive que pendant qu'elle traverse l'écran. */
    var amb = document.querySelector('main:not(.legal-page) > section.section');
    if (amb) {
      amb.classList.add('gsheen-amb');
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('gsheen-drift', e.isIntersecting);
        });
      }, { rootMargin: '10% 0px' }).observe(amb);
    }

    var PAUSE = 400;    /* respiration entre la fin du tracé et le reflet */
    var SHEEN = 2100;   /* durée du passage : doit suivre goldSheen dans site.css */
    /* « draw » = temps que met la ligne à se dessiner, repris des animations en place */
    var SPECS = [
      { sel: '.home-hero-crumb', draw: 1050 },                 /* heroContentIn : .15s + .9s */
      { sel: '.page-hero-crumb', draw: 1050 },                 /* cine : --cine-line-d (350 ms) + .7s */
      { sel: '.stat-row', draw: 800, cascade: true }            /* révélation : --rv-d + .8s */
    ];

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        var wait = el._gsWait;
        setTimeout(function () { el.classList.add('gsheen-on'); }, wait);
        /* la trace est effacée : l'élément retrouve son état d'origine, sans reliquat */
        setTimeout(function () { el.classList.remove('gsheen-on'); }, wait + SHEEN + 120);
      });
    }, { threshold: 0.35 });

    SPECS.forEach(function (spec) {
      document.querySelectorAll(spec.sel).forEach(function (el) {
        /* le bandeau de chiffres hérite du décalage de cascade posé par setupReveal */
        var cascade = spec.cascade ? (parseFloat(el.style.getPropertyValue('--rv-d')) || 0) : 0;
        el._gsWait = spec.draw + cascade + PAUSE;
        io.observe(el);
      });
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

  /* ---------- séquence immersive de l'accueil ----------
     Pilote la section `[data-immersive]` : une photographie tenue en
     `position: sticky` pendant que trois phrases s'y succèdent, puis une
     fermeture au noir qui enchaîne sur la section suivante.

     Le sticky, le cadrage et toute la mise en forme sont faits en CSS (bloc
     « séquence immersive » de site.css). Ce script ne fait qu'une chose : lire
     la progression du défilement dans la section et l'écrire sous forme de
     variables CSS. Il ne touche ni à la mise en page, ni aux dimensions, ni à
     la position de quoi que ce soit — donc aucun recalcul de rendu n'est
     déclenché, seulement de la composition.

     Rythme : les mesures sont prises dans une frame d'animation, jamais dans
     l'écouteur de défilement, et le calcul s'arrête dès que la section quitte
     l'écran. Même montage que le parallaxe des photos immersives.

     La progression est déduite des hauteurs réellement mesurées (section et
     scène) plutôt que de `innerHeight` : sur mobile la scène est en `svh` et
     la fenêtre change de hauteur au repli de la barre d'outils, ce qui
     décalerait la séquence à chaque fois.

     Mouvement réduit, absence d'IntersectionObserver, ou script non exécuté :
     rien n'est posé, les valeurs par défaut du CSS s'appliquent et la section
     reste une photographie fixe surmontée de ses trois phrases. */
  function setupImmersive() {
    var sec = document.querySelector('[data-immersive]');
    if (!sec) return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var stage = sec.querySelector('.imm-stage');
    var words = Array.prototype.slice.call(sec.querySelectorAll('.imm-word'));
    if (!stage || !words.length) return;

    /* Fenêtre de lecture de chaque phrase, en progression de 0 à 1. Les fenêtres
       ne se chevauchent jamais et sont séparées par un intervalle vide : entre
       deux phrases l'écran revient à la seule photographie, ce qui est ce qui
       donne à chacune son poids. */
    var WINDOWS = [[.07, .32], [.36, .61], [.64, .88]];
    var FADE  = .28;   /* part de la fenêtre consacrée à l'apparition, idem à la sortie */
    var RISE  = 15;    /* px : la phrase monte de 15 px en paraissant */
    var DRIFT = 10;    /* px : et poursuit doucement sa montée en s'effaçant */

    var SCALE = .04;   /* échelle de la photo : 1 → 1,04 sur toute la séquence */
    var SHIFT = -16;   /* px : dérive verticale, couverte par le surdimensionnement CSS */
    var SCRIM = [.25, .45];
    var BLACK_FROM = .86;  /* la fermeture au noir n'occupe que la toute fin */
    var BLACK_MAX  = 1;    /* opaque : la section suivante prend le relais sans marche */

    var visible = false, queued = false;

    /* smoothstep : accélération et décélération symétriques, sans à-coup aux
       deux extrémités — c'est ce qui évite qu'une phrase « démarre » à l'œil. */
    function ease(t) { return t * t * (3 - 2 * t); }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    function update() {
      queued = false;
      if (!visible) return;

      var travel = sec.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return;   /* scène aussi haute que la section : rien à parcourir */
      var p = clamp01(-sec.getBoundingClientRect().top / travel);

      /* mobile : mêmes repères de temps, amplitude de moitié */
      var soft = window.innerWidth <= 760 ? .5 : 1;

      stage.style.setProperty('--imm-scale', (1 + SCALE * soft * p).toFixed(4));
      stage.style.setProperty('--imm-shift', (SHIFT * soft * p).toFixed(2) + 'px');
      stage.style.setProperty('--imm-scrim', (SCRIM[0] + (SCRIM[1] - SCRIM[0]) * p).toFixed(3));
      stage.style.setProperty('--imm-black',
        (ease(clamp01((p - BLACK_FROM) / (1 - BLACK_FROM))) * BLACK_MAX).toFixed(3));

      for (var i = 0; i < words.length; i++) {
        var win = WINDOWS[i];
        var t = clamp01((p - win[0]) / (win[1] - win[0]));
        var o, y;
        if (t <= 0)            { o = 0; y = RISE; }          /* pas encore là */
        else if (t >= 1)       { o = 0; y = -DRIFT; }        /* déjà partie */
        else if (t < FADE)     { o = ease(t / FADE);       y = RISE * (1 - o); }
        else if (t > 1 - FADE) { o = ease((1 - t) / FADE); y = -DRIFT * (1 - o); }
        else                   { o = 1; y = 0; }             /* pleine lecture */
        words[i].style.setProperty('--o', o.toFixed(3));
        words[i].style.setProperty('--y', y.toFixed(2) + 'px');
      }
    }

    function queue() {
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(update);
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) queue();
    }, { rootMargin: '12% 0px' }).observe(sec);

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
  }

  /* Stagger testimonials adapté au site statique. Les articles HTML restent la source. */
  function setupTestimonials() {
    document.querySelectorAll('[data-testimonials]').forEach(function (section) {
      var rail = section.querySelector('.tst-rail');
      var cards = Array.from(rail.querySelectorAll('.tst-card'));
      if (cards.length < 2) return;
      var prev = section.querySelector('[data-tst-prev]');
      var next = section.querySelector('[data-tst-next]');
      var active = 0;
      var gesture = null;
      var suppressClick = false;
      var status = document.createElement('p');
      status.className = 'tst-status';
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      rail.after(status);

      function position(index) {
        var offset = (index - active + cards.length) % cards.length;
        return offset > cards.length / 2 ? offset - cards.length : offset;
      }
      function render() {
        cards.forEach(function (card, i) {
          var offset = position(i);
          var visible = Math.abs(offset) <= 2;
          var wasHidden = card.getAttribute('aria-hidden') === 'true';
          card.classList.toggle('tst-recycle', !visible || wasHidden);
          card.style.setProperty('--tst-offset', offset);
          card.style.setProperty('--tst-lift', offset === 0 ? '-26px' : Math.abs(offset) % 2 ? '18px' : '6px');
          card.style.setProperty('--tst-angle', offset === 0 ? '0deg' : offset % 2 ? '2.5deg' : '-2.5deg');
          card.style.zIndex = offset === 0 ? '5' : String(3 - Math.min(Math.abs(offset), 3));
          card.classList.toggle('is-active', offset === 0);
          card.setAttribute('aria-hidden', String(!visible));
          card.tabIndex = Math.abs(offset) === 1 ? 0 : -1;
        });
        status.textContent = 'Avis de démonstration ' + (active + 1) + ' / ' + cards.length;
      }
      function move(steps) {
        active = (active + steps + cards.length) % cards.length;
        render();
        if (cards.indexOf(document.activeElement) !== -1) rail.focus({ preventScroll: true });
      }
      cards.forEach(function (card, i) {
        card.setAttribute('role', 'group');
        card.setAttribute('aria-roledescription', 'diapositive');
        card.setAttribute('aria-label', 'Avis ' + (i + 1) + ' sur ' + cards.length);
        // Monogrammes : pas de portraits de personnes associés aux avis fictifs.
        var avatar = document.createElement('span');
        avatar.className = 'tst-monogram';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = card.querySelector('.tst-name').textContent.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join('');
        card.prepend(avatar);
        card.addEventListener('click', function () {
          if (!suppressClick && position(i) !== 0) move(position(i));
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            move(position(i));
          }
        });
      });
      prev.addEventListener('click', function () { move(-1); });
      next.addEventListener('click', function () { move(1); });
      rail.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) === -1) return;
        e.preventDefault();
        if (e.key === 'Home') move(-active);
        else if (e.key === 'End') move(cards.length - 1 - active);
        else move(e.key === 'ArrowRight' ? 1 : -1);
      });
      rail.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary || e.button !== 0) return;
        suppressClick = false;
        gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, touch: e.pointerType !== 'mouse' };
      });
      rail.addEventListener('pointermove', function (e) {
        if (!gesture || gesture.id !== e.pointerId) return;
        var dx = e.clientX - gesture.x;
        var dy = e.clientY - gesture.y;
        if (!suppressClick && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { gesture = null; return; }
        if (Math.abs(dx) > 8) {
          suppressClick = true;
          // Au toucher le pointeur est déjà capturé implicitement : le recapturer
          // émettrait lostpointercapture et couperait le geste en cours.
          if (!gesture.touch) rail.setPointerCapture(e.pointerId);
          rail.classList.add('is-dragging');
          gesture.dx = dx;
          rail.style.setProperty('--tst-drag', Math.max(-90, Math.min(90, dx * .4)) + 'px');
        }
      });
      function finish(e) {
        if (!gesture || gesture.id !== e.pointerId) return;
        if (e.type === 'lostpointercapture' && gesture.touch) return;
        var dx = gesture.dx;
        var threshold = Math.min(40, Math.max(24, rail.clientWidth * .08));
        gesture = null;
        rail.classList.remove('is-dragging');
        rail.style.removeProperty('--tst-drag');
        if (e.type === 'pointerup' && Math.abs(dx) > threshold) move(dx < 0 ? 1 : -1);
        if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      }
      rail.addEventListener('pointerup', finish);
      rail.addEventListener('pointercancel', finish);
      rail.addEventListener('lostpointercapture', finish);
      prev.hidden = next.hidden = false;
      section.classList.add('tst-stagger');
      render();
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    setupTestimonials();
    initAnalytics();
    setupNav();
    setupMobileMenu();
    setupReveal();
    setupCinematic();
    setupParallax();
    setupReserveDrawer();
    setupCigarCart();
    setupWaForms();
    setupCompare();
    setupWaLinks();
    setupSmoke();
    setupImmersive();
    setupGoldSheen();
  });
})();
