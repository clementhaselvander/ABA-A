# Page Devenir membre

Page statique : `devenir-membre.html`, avec une section React isolée.
Les styles propres à cette page restent dans `assets/memberships.css`.
Le composant est `components/ui/pricing-section.tsx`, monté par `src/memberships.tsx`.
L’ancien `assets/memberships.js` n’est plus chargé.

## Installation et compilation

Installer Node.js 22 LTS ou supérieur, puis exécuter :

```sh
npm ci
npm run build
```

La compilation vérifie TypeScript et produit `assets/memberships-react.js` et
`assets/memberships-react.css`. Livrer ces deux fichiers avec le site statique.
Après toute modification TSX ou Tailwind, relancer `npm run build`.
Les changements dans `assets/memberships-data.js` ne nécessitent pas de compilation.

Le projet ne possédait ni React, ni TypeScript, ni Tailwind, ni configuration shadcn.
Ils sont maintenant configurés pour cette section, sans migration des autres pages.
`components/ui` accueille les primitives et composants réutilisables ; l’alias `@/`
et `components.json` assurent la résolution des imports et la compatibilité shadcn.
`styles/react.css` est l’entrée Tailwind, sans Preflight pour préserver le site.
Installation manuelle shadcn : https://ui.shadcn.com/docs/installation/manual
Pour ajouter une primitive ultérieurement : `npx shadcn@latest add <composant>`.
Ne pas écraser les composants Card personnalisés sans examiner les différences.

Les seules dépendances de rendu sont React, React DOM, Motion, clsx et tailwind-merge.
NumberFlow et Lucide sont omis : tarifs fixes et aucun pictogramme nécessaire.
Les photos et le logo Aba’a existants sont conservés. Aucun fournisseur de contexte
ni gestionnaire d’état global n’est nécessaire. `PricingSection` reçoit `plans`.
`components/demo.tsx` fournit un exemple de montage avec ces mêmes données.
Motion anime chaque carte au scroll et respecte `prefers-reduced-motion`.
Le CTA final suit la première formule disponible et utilise sa destination.

## Modifier les formules

La source unique est `assets/memberships-data.js` : nom, tarif en FCFA,
description, avantages, visuel, disponibilité, ordre et CTA.

- Les noms « Adhésion I / II / III » sont provisoires.
- Les listes `benefits` sont vides tant que les privilèges ne sont pas validés.
- Aucune durée ou périodicité n'est présumée pour les tarifs.
- Pour ouvrir une formule, vérifier sa destination `cta.href`, puis passer
  `available` à `true`. Le bouton désactivé devient un lien « Demander mon
  adhésion ». Les mentions générales de disponibilité sont mises à jour.
- La destination prévue est la page de contact. Un futur formulaire dédié peut
  être branché en modifiant uniquement `cta.href`.

## Référence graphique et limite de la source

Document examiné intégralement avant développement :
`ABAA_Mvoe_Lodge_Charte_Graphique (2).pdf`, 14 pages.

- Page 9 : ébène #140F0B, or #D5A464, or clair #F4CD82, bronze #A17340.
- Page 10 : Cinzel, Cormorant Garamond et Jost, déjà utilisés par le site.
- Page 13 : recto noir et or de la **carte de visite**, logo centré et bord fin.

Ce document ne contient pas trois modèles identifiés comme cartes membres.
Le fichier `assets/membership-card-charte.png` est une extraction du recto de
la page 13, réutilisée sans inventer de déclinaisons pour les trois niveaux.
La page indique que ces visuels sont provisoires. Remplacer les trois
`cardVisual` et `cardAlt` lorsque les modèles membres définitifs sont fournis.

## Navigation et accessibilité

Liens ajoutés dans les menus desktop et mobile et les pieds de page.
Depuis les pages anglaises, « Membership (FR) » identifie la destination française.
Les CTA indisponibles sont de vrais boutons `disabled`, sans lien ni action.
Les effets au survol sont limités aux pointeurs fins, sans mouvement réduit.
