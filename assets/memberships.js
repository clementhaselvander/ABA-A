(function () {
  'use strict';
  var root = document.querySelector('[data-memberships]');
  var plans = window.ABAA_MEMBERSHIPS;
  if (!root || !Array.isArray(plans) || !plans.length) return;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var fragment = document.createDocumentFragment();
  plans.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (plan) {
    var article = element('article', 'member-plan');
    article.id = plan.id;
    article.setAttribute('aria-labelledby', plan.id + '-title');

    var figure = element('figure', 'member-card');
    var image = element('img');
    image.src = plan.cardVisual;
    image.alt = plan.cardAlt;
    image.width = 1081;
    image.height = 708;
    image.loading = 'lazy';
    image.decoding = 'async';
    figure.appendChild(image);
    article.appendChild(figure);

    var body = element('div', 'member-plan-body');
    body.appendChild(element('span', 'member-level', 'Niveau ' + String(plan.order).padStart(2, '0')));
    var title = element('h3', 'member-plan-title', plan.name);
    title.id = plan.id + '-title';
    body.appendChild(title);
    // Libellé imprimé sur la carte : ce montant est un crédit, pas un tarif d'adhésion.
    body.appendChild(element('p', 'member-amount-label', plan.amountLabel));
    var price = element('p', 'member-price', new Intl.NumberFormat('fr-FR').format(plan.amount));
    price.appendChild(element('span', '', ' FCFA'));
    body.appendChild(price);
    if (plan.amountNote) body.appendChild(element('p', 'member-amount-note', plan.amountNote));
    body.appendChild(element('p', 'member-description', plan.description));

    var benefits = element('div', 'member-benefits');
    benefits.appendChild(element('h4', '', 'Privilèges membres'));
    if (plan.benefits.length) {
      var list = element('ul');
      plan.benefits.forEach(function (benefit) { list.appendChild(element('li', '', benefit)); });
      benefits.appendChild(list);
    } else {
      benefits.appendChild(element('p', '', 'Les privilèges de cette formule seront précisés à l’ouverture du programme.'));
    }
    body.appendChild(benefits);

    // Un bouton natif désactivé ne possède ni lien, ni action, ni écouteur.
    var cta = element(plan.available ? 'a' : 'button', 'btn btn-line member-cta', plan.available ? plan.cta.label : plan.cta.pendingLabel);
    if (plan.available) {
      cta.href = plan.cta.href;
      cta.setAttribute('aria-label', plan.cta.label + ' — ' + plan.name);
    } else {
      cta.type = 'button';
      cta.disabled = true;
      cta.setAttribute('aria-describedby', 'membership-availability');
    }
    body.appendChild(cta);
    article.appendChild(body);
    fragment.appendChild(article);
  });
  root.replaceChildren(fragment);

  // Les mentions générales suivent aussi l'ouverture de la première formule.
  var isOpen = plans.some(function (plan) { return plan.available; });
  document.querySelectorAll('[data-membership-status]').forEach(function (node) {
    node.textContent = isOpen ? 'Demandes d’adhésion ouvertes' : 'Bientôt disponible';
  });
  document.querySelectorAll('[data-membership-preview]').forEach(function (node) {
    node.hidden = isOpen;
  });
  document.querySelectorAll('[data-membership-open]').forEach(function (node) {
    node.hidden = !isOpen;
  });
})();
