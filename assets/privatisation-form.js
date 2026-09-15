/* ===========================================================
   Aba'a Mvoé Lodge — formulaire progressif de privatisation
   (page privatisation.html uniquement)

   Couche d'envoi isolée : aucun service e-mail n'est connecté à ce
   jour. Si PV_ENDPOINT est renseigné (voir .env.example), la demande
   est postée en JSON vers cet endpoint. Sinon, la demande est
   validée localement et l'utilisateur choisit d'ouvrir WhatsApp
   depuis l'écran de confirmation (jamais automatiquement).
   =========================================================== */
(function () {
  'use strict';

  var form = document.getElementById('pv-form-el');
  if (!form) return;

  var WHATSAPP_NUMBER = '24166836354';
  function waUrl(message) { return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message); }

  var PV_ENDPOINT = ''; /* TODO : renseigner l'URL de l'endpoint email une fois connecté. */
  function submitPrivatisationRequest(payload) {
    if (PV_ENDPOINT) {
      return fetch(PV_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('send_failed');
        return true;
      });
    }
    return new Promise(function (resolve) { setTimeout(resolve, 900); });
  }

  /* ---------- helpers ---------- */
  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  var today = todayStr();
  function isPast(v) { return !!v && v < today; }
  function fmtDate(v) { if (!v) return ''; var p = v.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : v; }
  function fmtFcfa(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'; }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isValidPhone(v) { var digits = v.replace(/[^\d+]/g, ''); return /^\+?\d{6,15}$/.test(digits); }

  function val(name) { var el = form.querySelector('[name="' + name + '"]'); return el ? el.value.trim() : ''; }
  function checkedRadio(name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function checkedList(name) {
    return Array.prototype.slice.call(form.querySelectorAll('[name="' + name + '"]:checked')).map(function (el) { return el.value; });
  }
  function getStepEl(n) { return form.querySelector('.pv-step[data-step="' + n + '"]'); }

  /* ---------- date input : jamais de date passée ---------- */
  form.querySelectorAll('input[type="date"]').forEach(function (el) { el.setAttribute('min', today); });

  /* ---------- alerte capacité (non bloquante) ---------- */
  var paxInput = form.querySelector('[name="pax"]');
  var paxAlert = document.getElementById('pv-pax-alert');
  if (paxInput && paxAlert) {
    paxInput.addEventListener('input', function () {
      var n = parseInt(paxInput.value, 10);
      paxAlert.hidden = !(n > 165);
    });
  }

  /* ---------- WhatsApp = même numéro que le téléphone ---------- */
  var waSame = document.getElementById('pv-wa-same');
  var waInput = document.getElementById('pv-whatsapp');
  var telInput = form.querySelector('[name="telephone"]');
  if (waSame && waInput && telInput) {
    waSame.addEventListener('change', function () {
      if (waSame.checked) { waInput.value = telInput.value; waInput.setAttribute('disabled', 'disabled'); }
      else { waInput.removeAttribute('disabled'); }
    });
    telInput.addEventListener('input', function () { if (waSame.checked) waInput.value = telInput.value; });
  }

  /* ---------- « je souhaite être conseillé » exclut les autres espaces ---------- */
  var espaceInputs = form.querySelectorAll('input[name="espaces"]');
  var conseilInput = form.querySelector('input[name="espaces"][data-espace-conseil]');
  espaceInputs.forEach(function (inp) {
    inp.addEventListener('change', function () {
      if (inp.hasAttribute('data-espace-conseil')) {
        if (inp.checked) espaceInputs.forEach(function (o) { if (o !== inp) o.checked = false; });
      } else if (inp.checked && conseilInput) {
        conseilInput.checked = false;
      }
    });
  });

  /* ---------- erreurs de validation ---------- */
  function setError(name, message) {
    var errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (errEl) { errEl.textContent = message || ''; errEl.hidden = !message; }
    var field = form.querySelector('[name="' + name + '"]');
    var wrap = field ? (field.closest('.field') || field.closest('.pv-fieldset')) : null;
    if (wrap) wrap.classList.toggle('has-error', !!message);
  }
  function clearStepErrors(stepEl) {
    stepEl.querySelectorAll('.pv-error').forEach(function (e) { e.hidden = true; e.textContent = ''; });
    stepEl.querySelectorAll('.has-error').forEach(function (e) { e.classList.remove('has-error'); });
  }
  function focusFirstError(name) {
    if (!name) return;
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return;
    var wrap = el.closest('.field') || el.closest('.pv-fieldset') || el;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el.focus) el.focus({ preventScroll: true });
  }

  /* ---------- validation par étape ---------- */
  function validateStep1() {
    clearStepErrors(getStepEl(1));
    var ok = true, first = null;
    if (!checkedRadio('demandeur_type')) { setError('demandeur_type', "Merci d'indiquer le type de demandeur."); ok = false; first = first || 'demandeur_type'; }
    if (!val('nom')) { setError('nom', 'Merci de renseigner votre nom et prénom.'); ok = false; first = first || 'nom'; }
    var reqOrg = ['Entreprise', 'Ministère ou institution', 'Ambassade', 'Association', 'Agence événementielle'].indexOf(checkedRadio('demandeur_type')) !== -1;
    if (reqOrg && !val('organisation')) { setError('organisation', "Merci d'indiquer votre organisation ou institution."); ok = false; first = first || 'organisation'; }
    var email = val('email');
    if (!email) { setError('email', 'Merci de renseigner votre adresse e-mail.'); ok = false; first = first || 'email'; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', "Le format de l'adresse e-mail n'est pas valide."); ok = false; first = first || 'email'; }
    var tel = val('telephone');
    if (!tel) { setError('telephone', 'Merci de renseigner votre numéro de téléphone.'); ok = false; first = first || 'telephone'; }
    else if (!isValidPhone(tel)) { setError('telephone', 'Le numéro de téléphone semble invalide.'); ok = false; first = first || 'telephone'; }
    var wa = val('whatsapp');
    if (wa && !isValidPhone(wa)) { setError('whatsapp', 'Le numéro WhatsApp semble invalide.'); ok = false; first = first || 'whatsapp'; }
    if (!checkedRadio('contact_pref')) { setError('contact_pref', 'Merci de choisir un mode de contact préféré.'); ok = false; first = first || 'contact_pref'; }
    return { ok: ok, first: first };
  }

  function validateStep2() {
    clearStepErrors(getStepEl(2));
    var ok = true, first = null;
    if (!checkedRadio('evenement_type')) { setError('evenement_type', "Merci de choisir le type d'événement."); ok = false; first = first || 'evenement_type'; }
    var d1 = val('date_1');
    if (!d1) { setError('date_1', 'Merci d\'indiquer la date souhaitée.'); ok = false; first = first || 'date_1'; }
    else if (isPast(d1)) { setError('date_1', "La date souhaitée ne peut pas être antérieure à aujourd'hui."); ok = false; first = first || 'date_1'; }
    var d2 = val('date_2');
    if (d2 && isPast(d2)) { setError('date_2', "Cette date ne peut pas être antérieure à aujourd'hui."); ok = false; first = first || 'date_2'; }
    if (!val('heure_debut')) { setError('heure_debut', "Merci d'indiquer l'heure de début."); ok = false; first = first || 'heure_debut'; }
    if (!val('heure_fin')) { setError('heure_fin', "Merci d'indiquer l'heure de fin estimée."); ok = false; first = first || 'heure_fin'; }
    var pax = val('pax'); var paxN = parseInt(pax, 10);
    if (!pax) { setError('pax', "Merci d'indiquer le nombre d'invités prévu."); ok = false; first = first || 'pax'; }
    else if (isNaN(paxN) || paxN < 1) { setError('pax', "Le nombre d'invités doit être supérieur à 0."); ok = false; first = first || 'pax'; }
    if (!checkedRadio('personnalites')) { setError('personnalites', 'Merci de répondre à cette question.'); ok = false; first = first || 'personnalites'; }
    if (!checkedRadio('confidentialite')) { setError('confidentialite', 'Merci de répondre à cette question.'); ok = false; first = first || 'confidentialite'; }
    return { ok: ok, first: first };
  }

  function validateStep3() {
    clearStepErrors(getStepEl(3));
    if (!checkedList('espaces').length) {
      setError('espaces', 'Merci de sélectionner au moins un espace, ou « Je souhaite être conseillé ».');
      return { ok: false, first: 'espaces' };
    }
    return { ok: true, first: null };
  }

  function validateStep4() {
    clearStepErrors(getStepEl(4));
    if (!checkedRadio('restauration')) {
      setError('restauration', 'Merci de choisir une option de restauration.');
      return { ok: false, first: 'restauration' };
    }
    return { ok: true, first: null };
  }

  function validateStep6() {
    clearStepErrors(getStepEl(6));
    var ok = true, first = null;
    if (!checkedRadio('budget')) { setError('budget', 'Merci de sélectionner un budget prévisionnel.'); ok = false; first = first || 'budget'; }
    if (!checkedRadio('visite')) { setError('visite', 'Merci de répondre à cette question.'); ok = false; first = first || 'visite'; }
    var visiteDate = val('visite_date');
    if (visiteDate && isPast(visiteDate)) { setError('visite_date', "Cette date ne peut pas être antérieure à aujourd'hui."); ok = false; first = first || 'visite_date'; }
    var consent = form.querySelector('[name="consent"]');
    if (!consent || !consent.checked) { setError('consent', "Merci d'accepter cette condition pour transmettre votre demande."); ok = false; first = first || 'consent'; }
    return { ok: ok, first: first };
  }

  function validateStep(n) {
    if (n === 1) return validateStep1();
    if (n === 2) return validateStep2();
    if (n === 3) return validateStep3();
    if (n === 4) return validateStep4();
    if (n === 6) return validateStep6();
    return { ok: true, first: null };
  }

  /* ---------- collecte des données ---------- */
  function collectData() {
    return {
      demandeur_type: checkedRadio('demandeur_type'),
      nom: val('nom'),
      organisation: val('organisation'),
      fonction: val('fonction'),
      email: val('email'),
      telephone: val('telephone'),
      whatsapp: val('whatsapp') || val('telephone'),
      contact_pref: checkedRadio('contact_pref'),

      evenement_type: checkedRadio('evenement_type'),
      evenement_nom: val('evenement_nom'),
      date_1: val('date_1'),
      date_2: val('date_2'),
      heure_debut: val('heure_debut'),
      heure_fin: val('heure_fin'),
      pax: val('pax'),
      personnalites: checkedRadio('personnalites'),
      confidentialite: checkedRadio('confidentialite'),
      protocole: val('protocole'),

      espaces: checkedList('espaces'),

      restauration: checkedRadio('restauration'),
      resto_pax: val('resto_pax'),
      boissons: checkedList('boissons'),
      allergies: val('allergies'),

      services: checkedList('services'),
      equipements: checkedList('equipements'),
      besoins: val('besoins'),

      budget: checkedRadio('budget'),
      visite: checkedRadio('visite'),
      visite_date: val('visite_date'),
      visite_creneau: val('visite_creneau'),
      connu_via: val('connu_via'),
      message: val('message')
    };
  }

  /* ---------- récapitulatif ---------- */
  function fmtVal(v) { return v ? v : '—'; }
  function fmtList(arr) { return arr.length ? arr.join(', ') : '—'; }

  function summaryGroup(title, stepNum, rows) {
    var rowsHtml = rows.map(function (r) {
      return '<div class="pv-summary-row"><span>' + escapeHtml(r[0]) + '</span><span>' + escapeHtml(r[1]) + '</span></div>';
    }).join('');
    return '<div class="pv-summary-group"><div class="pv-summary-head"><h4>' + escapeHtml(title) + '</h4>' +
      '<button type="button" class="pv-summary-edit" data-jump="' + stepNum + '">Modifier</button></div>' + rowsHtml + '</div>';
  }

  function renderSummary() {
    var d = collectData();
    var html = '';
    html += summaryGroup('Coordonnées', 1, [
      ['Type de demandeur', fmtVal(d.demandeur_type)],
      ['Nom', fmtVal(d.nom)],
      ['Organisation', fmtVal(d.organisation)],
      ['Fonction', fmtVal(d.fonction)],
      ['E-mail', fmtVal(d.email)],
      ['Téléphone', fmtVal(d.telephone)],
      ['WhatsApp', fmtVal(d.whatsapp)],
      ['Contact préféré', fmtVal(d.contact_pref)]
    ]);
    html += summaryGroup('Événement', 2, [
      ['Type', fmtVal(d.evenement_type)],
      ['Nom / objet', fmtVal(d.evenement_nom)],
      ['Date souhaitée', fmtVal(fmtDate(d.date_1))],
      ['Deuxième date', d.date_2 ? fmtDate(d.date_2) : '—'],
      ['Horaires', (d.heure_debut || '—') + ' – ' + (d.heure_fin || '—')],
      ['Invités prévus', fmtVal(d.pax)],
      ['Personnalités / délégations', fmtVal(d.personnalites)],
      ['Confidentialité renforcée', fmtVal(d.confidentialite)],
      ['Protocole / sécurité', fmtVal(d.protocole)]
    ]);
    html += summaryGroup('Espaces souhaités', 3, [['Sélection', fmtList(d.espaces)]]);
    html += summaryGroup('Restauration & boissons', 4, [
      ['Restauration', fmtVal(d.restauration)],
      ['Nombre de personnes', fmtVal(d.resto_pax)],
      ['Options complémentaires', fmtList(d.boissons)],
      ['Allergies / restrictions', fmtVal(d.allergies)]
    ]);
    html += summaryGroup('Services & équipements', 5, [
      ['Services', fmtList(d.services)],
      ['Équipements', fmtList(d.equipements)],
      ['Précisions', fmtVal(d.besoins)]
    ]);
    html += summaryGroup('Budget & visite', 6, [
      ['Budget prévisionnel', fmtVal(d.budget)],
      ['Visite privée', fmtVal(d.visite)],
      ['Date de visite souhaitée', d.visite_date ? fmtDate(d.visite_date) : '—'],
      ['Créneau', fmtVal(d.visite_creneau)],
      ['Connu via', fmtVal(d.connu_via)],
      ['Message', fmtVal(d.message)]
    ]);
    var summaryEl = document.getElementById('pv-summary');
    summaryEl.innerHTML = html;
    summaryEl.querySelectorAll('[data-jump]').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(parseInt(btn.getAttribute('data-jump'), 10), true); });
    });
  }

  /* ---------- estimation indicative ---------- */
  function computeHours(start, end) {
    if (!start || !end) return 0;
    var s = start.split(':'), e = end.split(':');
    var sMin = (+s[0]) * 60 + (+s[1]), eMin = (+e[0]) * 60 + (+e[1]);
    var diff = eMin - sMin; if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  }

  function computeEstimate() {
    var d = collectData();
    var rows = [], total = 0, hasAny = false, hasDevis = false;
    var espacePrices = { "L'espace intérieur": 150000, 'Salon voilé': 20000, 'Salon ordinaire': 20000, 'Site complet': 3500000 };

    d.espaces.forEach(function (e) {
      if (e === 'Salon privé') {
        var hrs = computeHours(d.heure_debut, d.heure_fin);
        if (hrs > 0) { var amt = hrs * 50000; rows.push({ label: 'Salon privé (' + hrs + ' h)', amount: amt }); total += amt; hasAny = true; }
        else { rows.push({ label: 'Salon privé', devis: true }); hasDevis = true; }
      } else if (espacePrices.hasOwnProperty(e)) {
        rows.push({ label: e, amount: espacePrices[e] }); total += espacePrices[e]; hasAny = true;
      } else if (e !== 'Je souhaite être conseillé') {
        rows.push({ label: e, devis: true }); hasDevis = true;
      }
    });

    if (d.restauration === 'Cocktail dînatoire pour 12 personnes') { rows.push({ label: d.restauration, amount: 360000 }); total += 360000; hasAny = true; }
    else if (d.restauration === 'Cocktail dînatoire pour 20 personnes') { rows.push({ label: d.restauration, amount: 600000 }); total += 600000; hasAny = true; }
    else if (d.restauration && d.restauration !== 'Aucun service de restauration') { rows.push({ label: d.restauration, devis: true }); hasDevis = true; }

    return { rows: rows, total: total, hasAny: hasAny, hasDevis: hasDevis };
  }

  function renderEstimate() {
    var est = computeEstimate();
    var rowsEl = document.getElementById('pv-estimate-rows');
    var totalEl = document.getElementById('pv-estimate-total');
    if (!est.rows.length) {
      rowsEl.innerHTML = '<p class="pv-summary-empty">Sélectionnez vos espaces et votre restauration pour afficher une première estimation.</p>';
    } else {
      rowsEl.innerHTML = est.rows.map(function (r) {
        return '<div class="pv-estimate-row"><span>' + escapeHtml(r.label) + '</span><span>' + (r.devis ? 'Sur devis' : fmtFcfa(r.amount)) + '</span></div>';
      }).join('');
    }
    totalEl.textContent = est.hasAny ? (fmtFcfa(est.total) + (est.hasDevis ? ' + éléments sur devis' : '')) : 'Sur devis';
  }

  /* ---------- message WhatsApp (ouvert uniquement sur action volontaire) ---------- */
  function buildWhatsAppMessage(d, reference) {
    var L = [];
    L.push('Nouvelle demande de privatisation – ' + (d.nom || 'Client') + ' – ' + (fmtDate(d.date_1) || 'date à définir'));
    L.push('Référence : ' + reference, '');
    L.push('— Coordonnées —');
    L.push('Type : ' + (d.demandeur_type || '—'));
    L.push('Nom : ' + (d.nom || '—'));
    if (d.organisation) L.push('Organisation : ' + d.organisation);
    if (d.fonction) L.push('Fonction : ' + d.fonction);
    L.push('E-mail : ' + (d.email || '—'));
    L.push('Téléphone : ' + (d.telephone || '—'));
    L.push('WhatsApp : ' + (d.whatsapp || '—'));
    L.push('Contact préféré : ' + (d.contact_pref || '—'), '');
    L.push('— Événement —');
    L.push('Type : ' + (d.evenement_type || '—'));
    if (d.evenement_nom) L.push('Nom/objet : ' + d.evenement_nom);
    L.push('Date souhaitée : ' + (fmtDate(d.date_1) || '—') + (d.date_2 ? ' (alt. ' + fmtDate(d.date_2) + ')' : ''));
    L.push('Horaire : ' + (d.heure_debut || '—') + ' – ' + (d.heure_fin || '—'));
    L.push('Invités prévus : ' + (d.pax || '—'));
    L.push('Personnalités/délégations : ' + (d.personnalites || '—'));
    L.push('Confidentialité renforcée : ' + (d.confidentialite || '—'));
    if (d.protocole) L.push('Protocole/sécurité : ' + d.protocole);
    L.push('', '— Espaces souhaités —');
    L.push(d.espaces.length ? d.espaces.join(', ') : '—');
    L.push('', '— Restauration & boissons —');
    L.push('Restauration : ' + (d.restauration || '—'));
    if (d.resto_pax) L.push('Personnes concernées : ' + d.resto_pax);
    if (d.boissons.length) L.push('Options : ' + d.boissons.join(', '));
    if (d.allergies) L.push('Allergies/restrictions : ' + d.allergies);
    L.push('', '— Services & équipements —');
    if (d.services.length) L.push('Services : ' + d.services.join(', '));
    if (d.equipements.length) L.push('Équipements : ' + d.equipements.join(', '));
    if (d.besoins) L.push('Précisions : ' + d.besoins);
    L.push('', '— Budget & visite —');
    L.push('Budget : ' + (d.budget || '—'));
    L.push('Visite privée : ' + (d.visite || '—') + (d.visite_date ? ' — ' + fmtDate(d.visite_date) : '') + (d.visite_creneau ? ' (' + d.visite_creneau + ')' : ''));
    if (d.connu_via) L.push('Connu via : ' + d.connu_via);
    if (d.message) L.push('Message : ' + d.message);
    return L.join('\n');
  }

  function makeReference() {
    var d = new Date();
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'ABAA-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rand;
  }

  /* ---------- navigation entre étapes ---------- */
  var TOTAL_STEPS = form.querySelectorAll('.pv-step').length;
  var current = 1;
  var backBtn = document.getElementById('pv-back');
  var nextBtn = document.getElementById('pv-next');
  var submitWrap = document.getElementById('pv-submit-wrap');
  var submitBtn = document.getElementById('pv-submit');
  var liveRegion = document.getElementById('pv-live');
  var progressNav = document.querySelector('.pv-progress');

  function announce(msg) { if (liveRegion) liveRegion.textContent = msg; }

  function showStep(n, scroll) {
    form.querySelectorAll('.pv-step').forEach(function (s) {
      s.classList.toggle('is-on', parseInt(s.getAttribute('data-step'), 10) === n);
    });
    document.querySelectorAll('.pv-progress-step').forEach(function (p) {
      var idx = parseInt(p.getAttribute('data-progress'), 10);
      p.classList.toggle('is-on', idx === n);
      p.classList.toggle('is-done', idx < n);
    });
    document.querySelectorAll('.pv-progress-line').forEach(function (l) {
      l.classList.toggle('is-done', parseInt(l.getAttribute('data-line'), 10) < n);
    });
    backBtn.hidden = n === 1;
    if (n === TOTAL_STEPS) {
      nextBtn.hidden = true;
      submitWrap.hidden = false;
      renderSummary();
      renderEstimate();
    } else {
      nextBtn.hidden = false;
      submitWrap.hidden = true;
    }
    current = n;
    announce('Étape ' + n + ' sur ' + TOTAL_STEPS);
    if (scroll) {
      var head = getStepEl(n).querySelector('.pv-step-head') || getStepEl(n);
      head.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  nextBtn.addEventListener('click', function () {
    var result = validateStep(current);
    if (!result.ok) { announce('Des champs nécessitent votre attention.'); focusFirstError(result.first); return; }
    if (current < TOTAL_STEPS) showStep(current + 1, true);
  });
  backBtn.addEventListener('click', function () { if (current > 1) showStep(current - 1, true); });

  /* ---------- envoi ---------- */
  var confirmEl = document.getElementById('pv-confirm');
  var submitErrorEl = document.getElementById('pv-submit-error');

  function showConfirmation(d, reference) {
    form.hidden = true;
    if (progressNav) progressNav.hidden = true;
    confirmEl.hidden = false;
    document.getElementById('pv-confirm-ref').textContent = reference;
    document.getElementById('pv-confirm-date').textContent = fmtDate(d.date_1) || '—';
    document.getElementById('pv-confirm-wa').href = waUrl(buildWhatsAppMessage(d, reference));
    confirmEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetAll() {
    form.reset();
    form.querySelectorAll('.pv-error').forEach(function (e) { e.hidden = true; e.textContent = ''; });
    form.querySelectorAll('.has-error').forEach(function (e) { e.classList.remove('has-error'); });
    if (paxAlert) paxAlert.hidden = true;
    if (waInput) waInput.removeAttribute('disabled');
    if (submitErrorEl) { submitErrorEl.hidden = true; submitErrorEl.textContent = ''; }
    submitBtn.disabled = false;
    submitWrap.classList.remove('is-loading');
    submitBtn.textContent = 'Envoyer ma demande de privatisation';
    form.hidden = false;
    if (progressNav) progressNav.hidden = false;
    confirmEl.hidden = true;
    showStep(1, true);
  }

  var confirmNewBtn = document.getElementById('pv-confirm-new');
  if (confirmNewBtn) confirmNewBtn.addEventListener('click', resetAll);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return; /* empêche les doubles soumissions */

    var r6 = validateStep6();
    if (!r6.ok) { showStep(6, true); focusFirstError(r6.first); return; }

    var hp = form.querySelector('[name="site_web"]');
    if (hp && hp.value) return; /* piège à robots : on ignore silencieusement */

    if (submitErrorEl) { submitErrorEl.hidden = true; submitErrorEl.textContent = ''; }
    submitBtn.disabled = true;
    submitWrap.classList.add('is-loading');
    submitBtn.textContent = 'Envoi en cours…';

    var d = collectData();
    var reference = makeReference();
    var payload = {
      reference: reference,
      submitted_at: new Date().toISOString(),
      subject: 'Nouvelle demande de privatisation – ' + (d.nom || 'Client') + ' – ' + (d.date_1 || 'date à définir'),
      data: d
    };

    submitPrivatisationRequest(payload).then(function () {
      showConfirmation(d, reference);
    }).catch(function () {
      submitBtn.disabled = false;
      submitWrap.classList.remove('is-loading');
      submitBtn.textContent = 'Envoyer ma demande de privatisation';
      if (submitErrorEl) {
        submitErrorEl.hidden = false;
        submitErrorEl.textContent = "Une erreur est survenue lors de l'envoi. Vos informations sont conservées : vous pouvez réessayer, ou nous contacter directement sur WhatsApp.";
        submitErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  showStep(1, false);
})();
