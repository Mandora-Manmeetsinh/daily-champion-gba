// Downloads pixel sprites for every Pokémon in engine.js from the PokeAPI/sprites repo.
// Gen 1-3 Pokémon use the Game Boy Advance sprites (Emerald front, FireRed/LeafGreen back).
// Newer Pokémon use the closest official small game sprites available.
// Usage: node scripts/fetch-sprites.js
const fs = require('fs');
const path = require('path');
const { DEX } = require('../engine.js');

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const urls = {
  front: id => id <= 386 ? [BASE + `versions/generation-iii/emerald/${id}.png`, BASE + `${id}.png`] : [BASE + `${id}.png`],
  back: id => id <= 386 ? [BASE + `versions/generation-iii/firered-leafgreen/back/${id}.png`, BASE + `back/${id}.png`] : [BASE + `back/${id}.png`],
};

async function get(list) {
  for (const u of list) {
    try {
      const r = await fetch(u);
      if (r.ok) return Buffer.from(await r.arrayBuffer());
    } catch (e) { /* try next */ }
  }
  return null;
}

(async () => {
  const ids = [...new Set(Object.values(DEX).map(d => d.id))];
  let missing = 0;
  for (const kind of ['front', 'back']) {
    const dir = path.join(__dirname, '..', 'sprites', kind);
    fs.mkdirSync(dir, { recursive: true });
    for (const id of ids) {
      const file = path.join(dir, `${id}.png`);
      if (fs.existsSync(file)) continue;
      const buf = await get(urls[kind](id));
      if (buf) fs.writeFileSync(file, buf);
      else { missing++; console.warn(`missing ${kind} sprite for #${id}`); }
    }
  }
  console.log(missing ? `Done with ${missing} missing sprites (the game falls back to placeholders).` : `Done. ${ids.length} Pokémon, front and back.`);
})();
