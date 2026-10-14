const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../engine.js');

test('every champion team and the pool resolve to real Pokémon', () => {
  for (const c of G.CHAMPS) {
    assert.equal(c.team.length, 6, c.name);
    assert.equal(new Set(c.team).size, 6, `${c.name} has duplicates`);
    c.team.forEach(k => assert.ok(G.DEX[k], `${c.name}: ${k} missing from DEX`));
  }
  G.POOL.forEach(k => {
    const d = G.DEX[k];
    assert.ok(d.types.length >= 1 && d.types.every(t => G.TYPES.includes(t)), k);
    assert.ok(d.cov.every(t => G.TYPES.includes(t)), `${k} coverage`);
  });
});

test('type chart spot checks', () => {
  assert.equal(G.effOf('Electric', ['Ground']), 0);
  assert.equal(G.effOf('Rock', ['Fire', 'Flying']), 4);
  assert.equal(G.effOf('Fairy', ['Dragon']), 2);
  assert.equal(G.effOf('Dragon', ['Fairy']), 0);
  assert.equal(G.effOf('Grass', ['Fire', 'Flying']), 0.25);
});

test('every Pokémon gets four distinct-type attacks', () => {
  G.POOL.forEach(k => {
    const m = G.makeMon(k);
    assert.equal(m.moves.length, 4, k);
    assert.equal(new Set(m.moves.map(v => v.type)).size, 4, k);
  });
});

test('daily champion rotation covers all champions every cycle', () => {
  const n = G.CHAMPS.length;
  for (let cycle = 0; cycle < 3; cycle++) {
    const seen = new Set();
    for (let d = 1; d <= n; d++) seen.add(G.dayInfo(cycle * n + d).champ);
    assert.equal(seen.size, n);
  }
});

test('daily info is deterministic and teams have six unique Pokémon', () => {
  for (let d = 1; d <= 50; d++) {
    const a = G.dayInfo(d), b = G.dayInfo(d);
    assert.deepEqual(a, b);
    assert.equal(new Set(a.team).size, 6);
  }
});

function playGreedy(S) {
  let guard = 0;
  while (S.phase !== 'over' && guard++ < 500) {
    let a;
    if (S.phase === 'forced') {
      const i = S.p.findIndex((m, idx) => m.hp > 0 && idx !== S.pa);
      a = { t: 'switch', i };
    } else a = { t: 'move', i: G.aiMove(S.p[S.pa], S.o[S.oa]) };
    assert.ok(G.legal(S, a));
    G.playTurn(S, a);
  }
  return guard;
}

test('battles always finish and shared seeds replay identically', () => {
  for (let c = 0; c < G.CHAMPS.length; c++) {
    const info = G.dayInfo(c + 1);
    const run = () => { const S = G.newBattle('daily', c + 1, c, info.team, 0, info.seed); playGreedy(S); return G.makeRec(S); };
    const r1 = run(), r2 = run();
    assert.deepEqual(r1, r2);
    assert.ok(r1.turns > 0 && r1.turns < 200);
  }
});

test('save and resume keeps the battle state and luck intact', () => {
  const info = G.dayInfo(1);
  const S = G.newBattle('daily', 1, info.champ, info.team, 2, info.seed);
  G.playTurn(S, { t: 'move', i: 0 });
  const R = G.hydrate(JSON.parse(JSON.stringify(G.serialize(S))));
  assert.equal(R.rng.s, S.rng.s);
  assert.deepEqual(R.p.map(m => m.hp), S.p.map(m => m.hp));
  assert.deepEqual(R.o.map(m => m.hp), S.o.map(m => m.hp));
  G.playTurn(S, { t: 'move', i: 1 });
  G.playTurn(R, { t: 'move', i: 1 });
  assert.deepEqual(R.p.map(m => m.hp), S.p.map(m => m.hp));
  assert.deepEqual(R.o.map(m => m.hp), S.o.map(m => m.hp));
});

test('illegal actions are rejected', () => {
  const S = G.newBattle('practice', 0, 0, G.dayInfo(1).team, 0, 1);
  assert.equal(G.legal(S, { t: 'switch', i: 0 }), false);
  assert.equal(G.legal(S, { t: 'move', i: 4 }), false);
  assert.equal(G.legal(S, { t: 'switch', i: 3 }), true);
  S.p[3].hp = 0;
  assert.equal(G.legal(S, { t: 'switch', i: 3 }), false);
});

const fs = require('fs');
const path = require('path');

test('every Pokémon has an id and front and back sprite files', () => {
  for (const k of G.POOL) {
    const id = G.DEX[k].id;
    assert.ok(Number.isInteger(id), `${k} has no id`);
    for (const kind of ['front', 'back']) {
      const f = path.join(__dirname, '..', 'sprites', kind, `${id}.png`);
      assert.ok(fs.existsSync(f), `missing sprites/${kind}/${id}.png for ${k} (run npm run sprites)`);
    }
  }
});

test('every champion has an arena', () => {
  G.CHAMPS.forEach(c => assert.ok(typeof c.arena === 'string' && c.arena.length, c.name));
});

test('potions heal, use a turn and respect limits', () => {
  const S = G.newBattle('practice', 0, 0, G.dayInfo(1).team, 0, 9);
  assert.equal(G.legal(S, { t: 'item', i: 0 }), false, 'full-HP Pokémon cannot take a Potion');
  S.p[1].hp = 50;
  assert.equal(G.legal(S, { t: 'item', i: 1 }), true);
  const before = S.p[0].hp;
  const evs = G.playTurn(S, { t: 'item', i: 1 });
  assert.equal(S.p[1].hp, 50 + G.POTION_HEAL > S.p[1].max ? S.p[1].max : 50 + G.POTION_HEAL);
  assert.equal(S.bag, 1);
  assert.ok(evs.some(e => e.fx && e.fx.k === 'heal'));
  assert.ok(S.p[0].hp <= before, 'opponent got a free attack');
  S.bag = 0;
  S.p[2].hp = 10;
  assert.equal(G.legal(S, { t: 'item', i: 2 }), false, 'no Potions left');
});

test('events carry animation cues for attacks and hits', () => {
  const S = G.newBattle('practice', 0, 3, G.dayInfo(2).team, 0, 4);
  const evs = G.playTurn(S, { t: 'move', i: 0 });
  assert.ok(evs.some(e => e.fx && e.fx.k === 'lunge'));
  assert.ok(evs.every(e => e.snap && typeof e.snap.pHp === 'number'));
});

test('gauntlet visits all 12 champions once and carries HP over', () => {
  const S = G.newGauntlet(G.dayInfo(3).team, 0, 77);
  assert.equal(new Set(S.gauntlet.order).size, 12);
  assert.equal(S.bag, 4);
  const first = S.champ;
  S.o.forEach(m => { m.hp = 0 });
  S.p[0].hp = 123;
  G.advanceGauntlet(S);
  assert.notEqual(S.champ, first);
  assert.equal(S.gauntlet.pos, 1);
  assert.ok(S.o.every(m => m.hp === m.max));
  assert.equal(S.p[0].hp, 123);
  assert.equal(S.phase, 'battle');
});

test('records include stats used by achievements', () => {
  const info = G.dayInfo(5);
  const S = G.newBattle('daily', 5, info.champ, info.team, 0, info.seed);
  let guard = 0;
  while (S.phase !== 'over' && guard++ < 500) {
    const a = S.phase === 'forced'
      ? { t: 'switch', i: S.p.findIndex((m, i) => m.hp > 0 && i !== S.pa) }
      : { t: 'move', i: G.aiMove(S.p[S.pa], S.o[S.oa]) };
    G.playTurn(S, a);
  }
  const r = G.makeRec(S);
  assert.equal(r.mode, 'daily');
  assert.ok(Number.isInteger(r.crits) && Number.isInteger(r.faints) && Number.isInteger(r.potions));
  assert.equal(r.team.length, 6);
});
