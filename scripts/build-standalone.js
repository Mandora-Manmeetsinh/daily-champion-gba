// Builds dist/standalone.html: one self-contained file with CSS, JS and all sprites inlined.
// Handy for previews and for hosts that only accept a single HTML file.
// Run `npm run sprites` first if the sprites folder is empty.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const { DEX } = require('../engine.js');

const sprites = { front: {}, back: {} };
for (const id of new Set(Object.values(DEX).map(d => d.id))) {
  for (const kind of ['front', 'back']) {
    const f = path.join(root, 'sprites', kind, `${id}.png`);
    if (fs.existsSync(f)) sprites[kind][id] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  }
}

let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>\n${read('style.css')}\n</style>`);
html = html.replace('<script src="engine.js"></script>', `<script>window.SPRITES=${JSON.stringify(sprites)};</script>\n<script>\n${read('engine.js')}\n</script>`);
html = html.replace('<script src="game.js"></script>', `<script>\n${read('game.js')}\n</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'standalone.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
