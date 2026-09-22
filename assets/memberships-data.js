/* Source unique du programme. Aucun avantage non validé n'est ajouté.
 * Ouverture d'une formule : passer available à true et vérifier cta.href.
 * name, amount, description, benefits, cardVisual, order et cta sont éditables ici.
 * La durée d'adhésion n'est pas définie : ne pas ajouter de périodicité au montant.
 * Visuels : recto des cartes membres définitives, dossier « carte membre ».
 * Les cartes affichées sont des spécimens : nom et numéro sont fictifs et sont
 * gravés dans les PNG par tools/build-member-cards.cjs. Pour les changer,
 * éditer SPECIMENS dans ce script et le relancer — pas de retouche manuelle.
 * amountLabel reprend mot pour mot le libellé imprimé sur la carte : le montant
 * est un crédit de consommation, pas un prix d'adhésion. Ne pas le requalifier.
 */
window.ABAA_MEMBERSHIPS = [
  {
    id: 'bronze',
    name: 'Bronze',
    amount: 2000000,
    amountLabel: 'Crédit de consommation',
    amountNote: 'Modalités à confirmer',
    description: 'Le premier niveau du cercle Aba’a.',
    benefits: [],
    cardVisual: 'assets/membership-card-bronze.webp',
    cardAlt: 'Carte de membre Bronze Aba’a, recto noir et or, au nom d’un membre fictif',
    available: false,
    order: 1,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=bronze' }
  },
  {
    id: 'or',
    name: 'Or',
    amount: 3500000,
    amountLabel: 'Crédit de consommation',
    amountNote: 'Modalités à confirmer',
    description: 'Le deuxième niveau du programme d’adhésion.',
    benefits: [],
    cardVisual: 'assets/membership-card-or.webp',
    cardAlt: 'Carte de membre Or Aba’a, recto noir et or, au nom d’un membre fictif',
    available: false,
    order: 2,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=or' }
  },
  {
    id: 'champagne',
    name: 'Champagne',
    amount: 5000000,
    amountLabel: 'Crédit de consommation',
    amountNote: 'Modalités à confirmer',
    description: 'Le troisième niveau du cercle Aba’a.',
    benefits: [],
    cardVisual: 'assets/membership-card-champagne.webp',
    cardAlt: 'Carte de membre Champagne Aba’a, recto doré, au nom d’un membre fictif',
    available: false,
    order: 3,
    cta: { label: 'Demander mon adhésion', pendingLabel: 'Bientôt disponible', href: 'contact.html?objet=champagne' }
  }
];
