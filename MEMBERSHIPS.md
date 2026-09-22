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

La source unique est `assets/memberships-data.js` : nom, montant en FCFA,
libellé du montant, description, avantages, visuel, disponibilité, ordre et CTA.

- Les noms sont Bronze, Or et Champagne, repris des cartes imprimées.
- `amount` n'est **pas** un tarif d'adhésion : les cartes le désignent comme
  « crédit de consommation », et `amountLabel` reprend ce libellé mot pour mot.
  Le prix d'une adhésion n'est pas connu ; ne pas présenter `amount` comme tel.
- `amountNote` reprend la mention « Modalités à confirmer » du recto.
- Les listes `benefits` sont vides tant que les privilèges ne sont pas validés.
- Aucune durée ou périodicité n'est présumée pour les montants.
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

Ce document ne contenait pas de modèles de cartes membres. Le placeholder
`assets/membership-card-charte.png` (extrait de la page 13) n'est plus utilisé.

## Cartes membres définitives

Source : dossier `carte membre/` à la racine (PDF print + PNG 300 dpi,
1081 × 708 px, recto et verso pour chaque niveau).

Les trois **recto** sont servis par `cardVisual` :

| Niveau | Source | Fichier servi | Spécimen |
| --- | --- | --- | --- |
| Bronze | `ABAA_carte_membre_Bronze_recto_300dpi.png` | `assets/membership-card-bronze.webp` | Léa Moussavou · 0128 |
| Or | `ABAA_carte_membre_Or_recto_300dpi.png` | `assets/membership-card-or.webp` | Patrick Ndoumba · 0067 |
| Champagne | `ABAA_carte_membre_Champagne_recto_300dpi.png` | `assets/membership-card-champagne.webp` | Sarah Békalé · 0009 |

### Génération des spécimens

Les fichiers servis ne sont pas de simples copies. Le gabarit imprimé laisse deux
champs vierges — « Nom du membre » et « N° ABA'A · 0000 » — qui donnaient sur le
site l'impression d'une carte non finie. `tools/build-member-cards.cjs` les
remplace par des valeurs fictives :

```sh
tmp/runtime/node-v22.23.2-win-x64/node.exe tools/build-member-cards.cjs
```

Les sources de `carte membre/` ne sont jamais modifiées : le script repart
d'elles à chaque exécution. Pour changer un nom ou un numéro, éditer la table
`SPECIMENS` en tête du script et le relancer ; ne pas retoucher les WebP à la main,
la prochaine exécution écraserait la retouche.

Ces noms sont **fictifs**. La page le dit dans `member-terms` et les `cardAlt` le
répètent ; ne pas y substituer un membre réel, la page est publique.

Le script relève lui-même la géométrie et les couleurs sur chaque gabarit plutôt
que de les coder en dur, et s'arrête s'il trouve de l'encre là où il en attend :
un gabarit redessiné produira une erreur explicite, pas une carte abîmée.

Les **verso** ne sont volontairement pas publiés : leurs fichiers sources portent
encore une adresse e-mail personnelle et une mention d’hébergement incompatibles
avec les informations officielles confirmées le 22 septembre 2026.
Le site utilise désormais La Sablière, Libreville, `aude@abaa-mvoelodge.com`
et le positionnement Business Lounge haut de gamme, sans hébergement.
Les fichiers graphiques des verso devront être corrigés avant publication.
Une fois ces corrections réalisées, le verso pourra être ajouté — par exemple en
retournement au survol — via un champ `cardVisualBack` dans la source.

## Navigation et accessibilité

Liens ajoutés dans les menus desktop et mobile et les pieds de page.
Depuis les pages anglaises, « Membership (FR) » identifie la destination française.
Les CTA indisponibles sont de vrais boutons `disabled`, sans lien ni action.
Les effets au survol sont limités aux pointeurs fins, sans mouvement réduit.
