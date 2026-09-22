/* Génère les recto de cartes membres servis par le site, à partir des fichiers
 * définitifs de « carte membre/ », en remplaçant les champs vierges du gabarit
 * (« Nom du membre », « N° ABA'A · 0000 ») par des valeurs SPÉCIMEN.
 *
 *   node tools/build-member-cards.cjs
 *
 * Node n'est pas sur le PATH de la machine : utiliser le runtime portable,
 *   tmp/runtime/node-v22.23.2-win-x64/node.exe tools/build-member-cards.cjs
 *
 * Les sources dans « carte membre/ » ne sont jamais modifiées.
 * Pour changer une valeur affichée, éditer SPECIMENS puis relancer le script.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tmp/qa/node_modules/playwright-core'));

/* Valeurs fictives. Aucun membre réel : ces cartes sont des spécimens de présentation. */
const SPECIMENS = [
  { tier: 'Bronze',    out: 'membership-card-bronze.webp',    name: 'Léa Moussavou',   number: '0128' },
  { tier: 'Or',        out: 'membership-card-or.webp',        name: 'Patrick Ndoumba', number: '0067' },
  { tier: 'Champagne', out: 'membership-card-champagne.webp', name: 'Sarah Békalé',    number: '0009' },
];

/* Géométrie relevée au pixel sur les trois gabarits 1081 × 708 : identique partout.
 * y1 est la ligne de base (aucune de ces chaînes n'a de jambage descendant). */
const BLOCK = { x: 85, y: 540, w: 260, h: 92, rowAbove: 538, rowBelow: 636, donorX: 430 };
const LINES = {
  label:  { text: 'MEMBRE',            x: 97, top: 552, baseline: 561, width: 71,  font: 'Jost',              weight: 500, tracked: true },
  name:   { text: 'Nom du membre',     x: 97, top: 564, baseline: 589, width: 202, font: 'Cormorant Garamond', weight: 400, italic: true },
  number: { text: 'N° ABA’A · 0000',   x: 97, top: 609, baseline: 618, width: 142, font: 'Jost',              weight: 400, tracked: true },
};

const page_fn = async ({ dataUrl, block, lines, specimen }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const D = ctx.getImageData(0, 0, c.width, c.height).data;
  const px = (x, y) => { const i = (y * c.width + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

  /* Couleur d'encre : le pixel le plus éloigné du fond dans la bande de la ligne. */
  function inkColor(line) {
    const bg = lum(px(line.x + 5, block.rowAbove));
    let best = null, bestD = -1;
    for (let y = line.top; y <= line.baseline; y++) {
      for (let x = line.x; x <= line.x + line.width; x++) {
        const p = px(x, y), d = Math.abs(lum(p) - bg);
        if (d > bestD) { bestD = d; best = p; }
      }
    }
    return `rgb(${best[0]},${best[1]},${best[2]})`;
  }
  const colors = Object.fromEntries(Object.entries(lines).map(([k, l]) => [k, inkColor(l)]));

  /* Garde-fous : la zone donneuse et la droite du bloc doivent être vierges.
   * Toute encre inattendue signalerait un gabarit différent de celui relevé. */
  const bgRow = x => lum(px(x, block.rowAbove));
  const scanClean = (x0, x1, why) => {
    for (let y = block.y; y < block.y + block.h; y++)
      for (let x = x0; x < x1; x++)
        if (Math.abs(lum(px(x, y)) - bgRow(x)) > 22)
          throw new Error(`encre inattendue à ${x},${y} (${why}) — gabarit non reconnu`);
  };
  scanClean(310, block.x + block.w, 'droite du bloc');
  scanClean(block.donorX, block.donorX + block.w, 'zone donneuse');
  for (const x of [block.x, block.donorX])
    for (let i = 0; i < block.w; i++)
      if (Math.abs(lum(px(x + i, block.rowBelow)) - bgRow(x + i)) > 22)
        throw new Error(`ligne de référence basse non vierge à x=${x + i}`);

  /* Reconstruction du fond, en séparant les deux composantes du fond de carte.
   *
   * Le dégradé : les lignes vierges qui encadrent le bloc sont interpolées
   * colonne par colonne. Chaque colonne garde donc son propre vignettage, ce
   * qu'une zone de fond simplement recopiée ne saurait pas faire — le vignettage
   * est radial, et une bande prise au centre s'éclaircit vers le bas bien moins
   * vite qu'une bande prise près du bord gauche.
   *
   * La texture : la carte porte un semis de points très discret, qu'aucune
   * interpolation ne produit et dont l'absence trahissait le rectangle retouché.
   * On la prélève sur une zone de fond voisine, en lui retirant son propre
   * dégradé, pour ne transporter que le détail haute fréquence. */
  const patch = ctx.getImageData(block.x, block.y, block.w, block.h);
  const donor = ctx.getImageData(block.donorX, block.y, block.w, block.h);
  const above = ctx.getImageData(0, block.rowAbove, c.width, 1).data;
  const below = ctx.getImageData(0, block.rowBelow, c.width, 1).data;
  const span = block.rowBelow - block.rowAbove;
  for (let col = 0; col < block.w; col++) {
    const dstI = (block.x + col) * 4, srcI = (block.donorX + col) * 4;
    for (let row = 0; row < block.h; row++) {
      const t = (block.y + row - block.rowAbove) / span;
      for (let ch = 0; ch < 3; ch++) {
        const gradDst = above[dstI + ch] + (below[dstI + ch] - above[dstI + ch]) * t;
        const gradSrc = above[srcI + ch] + (below[srcI + ch] - above[srcI + ch]) * t;
        const i = (row * block.w + col) * 4 + ch;
        const texture = donor.data[i] - gradSrc;
        patch.data[i] = Math.max(0, Math.min(255, Math.round(gradDst + texture)));
      }
    }
  }
  ctx.putImageData(patch, block.x, block.y);

  /* Calage typographique. La taille est déduite de la hauteur d'encre relevée sur
   * le gabarit, mesurée sur la chaîne d'origine elle-même : « Nom du membre »
   * culmine à ses ascendantes (d, b), plus hautes que les capitales en Cormorant,
   * et se caler sur un « M » donnerait un corps nettement trop grand.
   * L'interlettrage se déduit ensuite de la largeur d'origine. */
  const report = {};
  function fit(line, key) {
    const style = line.italic ? 'italic ' : '';
    const probe = size => { ctx.font = `${style}${line.weight} ${size}px "${line.font}"`; };
    const inkAscent = size => { probe(size); return ctx.measureText(line.text).actualBoundingBoxAscent; };
    const target = line.baseline - line.top;
    let size = 20;
    for (let i = 0; i < 40; i++) size = size * (target / inkAscent(size));
    ctx.letterSpacing = '0px'; probe(size);
    const natural = ctx.measureText(line.text).width;
    // Chromium ajoute l'espace après chaque glyphe, y compris le dernier.
    const ls = line.tracked && line.text.length > 1 ? (line.width - natural) / line.text.length : 0;
    report[key] = { size: +size.toFixed(2), ls: +ls.toFixed(2), natural: +natural.toFixed(1), cible: line.width };
    return { size, ls, style };
  }

  function draw(line, key, text, color) {
    const { size, ls, style } = fit(line, key);
    ctx.letterSpacing = `${ls}px`;
    ctx.font = `${style}${line.weight} ${size}px "${line.font}"`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, line.x, line.baseline);
    ctx.letterSpacing = '0px';
  }

  draw(lines.label, 'label', lines.label.text, colors.label);
  draw(lines.name, 'name', specimen.name, colors.name);
  draw(lines.number, 'number', `N° ABA’A · ${specimen.number}`, colors.number);

  /* WebP plutôt que PNG : le canvas ré-encode sans quantifier et sortait des PNG
   * deux fois plus lourds que les sources (≈ 490 Ko pour la carte Champagne).
   * En WebP quasi sans perte, la même carte pèse ≈ 53 Ko — moins que la source —
   * sans dégrader les petits textes dorés, vérifié à la loupe. */
  return { image: c.toDataURL('image/webp', 0.94), report, colors };
};

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
    <p style="font-family:Jost">Jost</p><p style="font-family:'Cormorant Garamond';font-style:italic">Cormorant</p>`,
    { waitUntil: 'networkidle' });
  /* Les faces doivent être chargées explicitement : déclarées dans la feuille de
   * style, elles ne sont sinon pas encore disponibles pour le canvas. */
  const loaded = await page.evaluate(async () => {
    const faces = ['italic 500 40px "Cormorant Garamond"', '500 14px "Jost"', '400 14px "Jost"'];
    await Promise.all(faces.map(f => document.fonts.load(f, 'ABC0123 ’·')));
    await document.fonts.ready;
    return faces.every(f => document.fonts.check(f));
  });
  if (!loaded) throw new Error('polices Google non chargées — vérifier l’accès réseau avant de régénérer');

  for (const s of SPECIMENS) {
    const src = path.join(ROOT, 'carte membre', `ABAA_carte_membre_${s.tier}_recto_300dpi.png`);
    const dataUrl = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
    const out = await page.evaluate(page_fn, { dataUrl, block: BLOCK, lines: LINES, specimen: s });
    const dest = path.join(ROOT, 'assets', s.out);
    fs.writeFileSync(dest, Buffer.from(out.image.split(',')[1], 'base64'));
    console.log(`${s.tier.padEnd(10)} → assets/${s.out}  (${s.name} · ${s.number})`);
    if (process.env.CARDS_DEBUG) console.log('  ', JSON.stringify(out.report), JSON.stringify(out.colors));
  }
  await browser.close();
})();
