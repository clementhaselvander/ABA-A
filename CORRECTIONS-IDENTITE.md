# Identité Aba’a — corrections du 22 septembre 2026

Informations officielles appliquées au site français et anglais :
- E-mail : `aude@abaa-mvoelodge.com` (texte, liens mailto et JSON-LD).
- Emplacement : La Sablière, Libreville, Gabon.
- Positionnement : Business Lounge haut de gamme ; cave à cigares, restauration,
  bar à spiritueux, piscine et privatisation.
- Le nom de marque « Aba’a Mvoé Lodge » reste conservé.

## Données structurées

Les 18 blocs JSON-LD utilisent désormais `FoodEstablishment`, sous-type de
`LocalBusiness` pertinent pour un établissement de restauration et de boissons.
La description précise toutes les activités confirmées du Business Lounge.
Aucun service d’hébergement n’est déclaré.
Référence : https://schema.org/FoodEstablishment

L’adresse structurée utilise `streetAddress: La Sablière`,
`addressLocality: Libreville`, `addressCountry: GA`.
La région auparavant renseignée « Libreville » a été retirée : aucune région
administrative n’a été déduite ou ajoutée.

## Fichiers corrigés

Source partagée : `assets/site.js` (libellés de demandes de privatisation).
Documentation mise à jour : `MEMBERSHIPS.md` (corrections requises sur les verso
des cartes avant publication). Présent rapport ajouté : `CORRECTIONS-IDENTITE.md`.

À la racine :
- `index.html`
- `club.html`
- `experience.html`
- `carte.html`
- `cigares.html`
- `contact.html`
- `devenir-membre.html`
- `mentions-legales.html`
- `poolside.html`
- `privatisation.html`
- `spiritueux.html`
- `table.html`

Versions anglaises :
- `en/index.html`
- `en/club.html`
- `en/experience.html`
- `en/carte.html`
- `en/cigares.html`
- `en/contact.html`
- `en/poolside.html`
- `en/privatisation.html`
- `en/spiritueux.html`
- `en/table.html`

## Mentions conservées et informations à confirmer

- GPS : le JSON-LD indique `0.475, 9.435`, alors que les liens et cartes Google
  indiquent `0.4621815, 9.4050848`. Aucune coordonnée ni URL de carte n’a été
  modifiée. Confirmer le point exact avant harmonisation.
- Adresse précise : rue, numéro ou repère d’accès officiel à La Sablière à fournir.
  Le Plus Code existant `FC74+222` des pages Contact reste à confirmer avec le GPS.
- L’adresse fiscale d’Akanda issue de l’attestation reste conservée dans les
  mentions légales et est explicitement distinguée du lieu d’accueil.
  Confirmer séparément toute mise à jour de cette adresse administrative.
- Akanda reste une zone de livraison dans les pages Cigares et leur logique de
  tarification ; cette mention ne situe pas l’établissement.
- « Hébergement du site internet » désigne le prestataire web, pas une activité
  hôtelière. Son identité et ses coordonnées restent à compléter, ainsi que le
  capital social, le responsable de publication et les informations de traitement
  des données déjà signalées comme manquantes dans les mentions légales.
- Le domaine public définitif reste à confirmer pour les URL canoniques.

## Vérifications

- Validation syntaxique des 18 blocs JSON-LD modifiés.
- Comparaison avant/après des objets `geo` et des URL Google : identiques.
- Recherche des anciens e-mails et types d’hébergement dans les sources du site.
- Les documents graphiques sources, images et archives de contrôle ne sont pas
  réécrits par cette correction éditoriale du site.
