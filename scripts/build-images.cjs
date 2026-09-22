/**
 * Génération des dérivés WebP servis par le site.
 *
 * Les PNG/JPEG de `assets/` restent les masters : ce script ne les modifie
 * jamais, il produit à côté les fichiers `<nom>-<largeur>.webp` référencés
 * par les pages via srcset.
 *
 * Aucun agrandissement : les largeurs supérieures à celle du master sont
 * ignorées (les sources du site plafonnent entre 475 px et 1448 px).
 *
 *   node scripts/build-images.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const LADDER = [480, 768, 1024, 1280, 1600];
const QUALITY = 80;

// Masters effectivement servis par les pages. Tenir cette liste à jour en même
// temps que le balisage ; les images non listées ne sont pas converties.
const MASTERS = [
  'cigar-hand.png', 'cigar-macro.png', 'cigars-table.png', 'cigars-wall-art-clean.png',
  'gastronomy-board.png', 'gastronomy-charcuterie.png', 'gastronomy-sliders-wings.png',
  'gastronomy-table-lanterns.png', 'gastronomy-tapas-platter.png', 'gastronomy.png',
  'lounge-chesterfield.png', 'lounge-seating.jpg', 'lounge-wide.png',
  'pool-compare-day.png', 'pool-compare-night.png', 'pool-day.png', 'pool-dusk.png',
  'spirits-bottle.png', 'spirits-cocktail-blue.png', 'spirits-cocktail-tray.png',
  'spirits-rum-art.png', 'whisky.png', 'wine-red-table.png', 'wine-sharing.png',
  // Intégrées à la galerie cigares et aux pages Table / Cave (audit du 22/09/2026).
  'cigars-cohiba-detail.png', 'cigars-selection-bar.png', 'cigars-limited-edition.png',
  'humidor.png', 'gastronomy-plated-dinner.png', 'champagne-toast.png',
  // Cartes « Découvrir les espaces » de la page Privatisation (22/09/2026).
  'lounge-private-dinner.jpg', 'pool-buffet.jpg',
];

// Le logo est affiché au maximum à 130 px de large (pied de page) : une seule
// largeur suffit, dimensionnée pour les écrans à forte densité.
const LOGO = { file: 'logo-abaa.png', width: 300 };

// Cartes de membre : les masters vivent dans « carte membre/ » (fichiers
// d'impression 300 dpi), la section React consomme les WebP produits ici.
const CARDS = [
  ['ABAA_carte_membre_Bronze_recto_300dpi.png', 'membership-card-bronze.webp'],
  ['ABAA_carte_membre_Or_recto_300dpi.png', 'membership-card-or.webp'],
  ['ABAA_carte_membre_Champagne_recto_300dpi.png', 'membership-card-champagne.webp'],
];

// Images Open Graph : 1200x630 imposé par les réseaux, recadrage centré.
const OG = [
  ['lounge-wide.png', 'og-accueil'],
  ['lounge-chesterfield.png', 'og-club'],
  ['gastronomy-board.png', 'og-carte'],
  ['gastronomy.png', 'og-table'],
  ['cigar-macro.png', 'og-cigares'],
  ['spirits-bottle.png', 'og-spiritueux'],
  ['pool-dusk.png', 'og-poolside'],
];

const kb = (n) => Math.round(n / 1024);

async function main() {
  const manifest = {};
  let before = 0;
  let after = 0;

  for (const file of MASTERS) {
    const src = path.join(ASSETS, file);
    if (!fs.existsSync(src)) { console.log('ABSENT  ' + file); continue; }

    const meta = await sharp(src).metadata();
    const base = file.replace(/\.(png|jpe?g)$/i, '');
    before += fs.statSync(src).size;

    // On écarte les paliers trop proches de la largeur native (ex. 480 pour un
    // master de 493 px) : deux fichiers quasi identiques sans bénéfice.
    const widths = LADDER.filter((w) => w < meta.width * 0.88);
    widths.push(meta.width);

    const entries = [];
    for (const w of widths) {
      const out = path.join(ASSETS, `${base}-${w}.webp`);
      const h = Math.round((meta.height / meta.width) * w);
      await sharp(src).resize(w, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY }).toFile(out);
      const size = fs.statSync(out).size;
      after += size;
      entries.push({ w, h, size, file: `${base}-${w}.webp` });
    }
    manifest[file] = { width: meta.width, height: meta.height, entries };
    console.log(
      `${file.padEnd(34)} ${meta.width}x${meta.height}  ` +
      `${String(kb(fs.statSync(src).size)).padStart(5)} KB -> ` +
      `${String(kb(entries[entries.length - 1].size)).padStart(4)} KB ` +
      `(${entries.length} largeurs)`
    );
  }

  // Logo
  {
    const src = path.join(ASSETS, LOGO.file);
    const meta = await sharp(src).metadata();
    const h = Math.round((meta.height / meta.width) * LOGO.width);
    const out = path.join(ASSETS, 'logo-abaa.webp');
    await sharp(src).resize(LOGO.width).webp({ quality: 88 }).toFile(out);
    before += fs.statSync(src).size;
    after += fs.statSync(out).size;
    manifest[LOGO.file] = {
      width: meta.width, height: meta.height,
      entries: [{ w: LOGO.width, h, size: fs.statSync(out).size, file: 'logo-abaa.webp' }],
    };
    console.log(`${LOGO.file.padEnd(34)} ${meta.width}x${meta.height}  ` +
      `${kb(fs.statSync(src).size)} KB -> ${kb(fs.statSync(out).size)} KB (logo)`);
  }

  // Cartes de membre
  for (const [srcName, outName] of CARDS) {
    const src = path.join(__dirname, '..', 'carte membre', srcName);
    if (!fs.existsSync(src)) { console.log('ABSENT  ' + srcName); continue; }
    const out = path.join(ASSETS, outName);
    await sharp(src).webp({ quality: 90 }).toFile(out);
    const meta = await sharp(out).metadata();
    console.log(`${outName.padEnd(34)} ${meta.width}x${meta.height}  ` +
      `${kb(fs.statSync(out).size)} KB (carte membre)`);
  }

  // Open Graph — JPEG, car plusieurs crawlers (dont WhatsApp) ignorent le WebP.
  for (const [file, name] of OG) {
    const src = path.join(ASSETS, file);
    const out = path.join(ASSETS, `${name}.jpg`);
    await sharp(src).resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    console.log(`${(name + '.jpg').padEnd(34)} 1200x630  ${kb(fs.statSync(out).size)} KB (Open Graph)`);
  }

  fs.writeFileSync(path.join(ASSETS, 'image-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nMasters : ${kb(before)} KB  ->  dérivés WebP : ${kb(after)} KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
