/* Source unique du programme. Aucun avantage non validé n'est ajouté.
 * Ouverture d'une formule : passer available à true et vérifier cta.href.
 * name, price, description, benefits, cardVisual, order et cta sont éditables ici.
 * La durée d'adhésion n'est pas définie : ne pas ajouter de périodicité au tarif.
 * Visuel provisoire commun : recto de la carte de visite, charte p. 13.
 * Le PDF fourni ne comporte pas de modèles membres distincts.
 */
window.ABAA_MEMBERSHIPS = [
  {
    id: 'adhesion-1',
    name: 'Adhésion I',
    price: 2000000,
    description: 'Le premier niveau du futur cercle Aba’a.',
    benefits: [],
    cardVisual: 'assets/membership-card-charte.png',
    cardAlt: 'Recto noir et or Aba’a, modèle de la charte graphique',
    available: false,
    order: 1,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=adhesion-1' }
  },
  {
    id: 'adhesion-2',
    name: 'Adhésion II',
    price: 3500000,
    description: 'Le deuxième niveau du futur programme d’adhésion.',
    benefits: [],
    cardVisual: 'assets/membership-card-charte.png',
    cardAlt: 'Recto noir et or Aba’a, modèle de la charte graphique',
    available: false,
    order: 2,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=adhesion-2' }
  },
  {
    id: 'adhesion-3',
    name: 'Adhésion III',
    price: 5000000,
    description: 'Le troisième niveau du futur cercle Aba’a.',
    benefits: [],
    cardVisual: 'assets/membership-card-charte.png',
    cardAlt: 'Recto noir et or Aba’a, modèle de la charte graphique',
    available: false,
    order: 3,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=adhesion-3' }
  }
];
