# Daily Champion (GBA edition)

A free daily Pokémon battle against a League Champion from every region, styled like a Game Boy Advance game. Everyone gets the same champion, the same random six Pokémon and the same random rolls each day. You get one official battle, then a spoiler-free result grid to share.

No accounts, no backend, no build step. It is plain HTML, CSS and JavaScript.

## Features

**Battles**
- GBA-style battle screen with real pixel sprites (front for the champion, back for you), per-region arenas, info boxes, typewriter dialogue and a menu for Fight, Bag, Pokémon and Exit.
- Animations: sprites slide and pop in, lunge when attacking, flash on hit, shake the screen on crits and super effective hits, and faint away. Tap the screen or press Space to skip.
- Sound effects generated in the browser (WebAudio, no audio files).
- **Bag:** 2 Potions per battle (4 in the Gauntlet). One heals 120 HP on any Pokémon and uses your turn.
- Type-hint option that shows x2 / x1/2 / no-effect on your moves.
- Keyboard controls: 1-4 attack, F fight, B bag, P party, Esc back, Space skip.

**Modes**
- **Today:** one official battle per day against the champion of the day, with save and resume. Everyone shares the same team and the same luck.
- **Practice:** pick any champion, reroll your team, rematch forever.
- **Gauntlet:** all 12 champions back to back in random order with one team. HP carries over and you have 4 Potions for the whole run.

**Progress**
- 12 champion badges (Badge Case) earned from any win.
- 12 achievements (Flawless, Speed Run, Lucky Streak, Gauntlet Veteran and more).
- Trainer card with a custom name, daily record, recent battles and settings (sound, text speed, animations, type hints).
- Hall of Fame screen after a win and a copyable share grid.
- Streaks and stats saved in `localStorage`.

12 champions: Blue, Red, Lance, Steven, Wallace, Cynthia, Alder, Iris, Diantha, Kukui, Leon and Geeta.

## Run it locally

```bash
git clone <your-repo-url>
cd daily-champion
npm start        # serves http://localhost:8000 (needs Python 3)
```

Open `index.html` through a local server rather than double-clicking it, so the scripts and sprites load.

## Tests

The battle engine lives in `engine.js` with no DOM code, so it is tested in Node (18+) with no dependencies.

```bash
npm test
```

## Sprites

Sprites live in `sprites/front` and `sprites/back`, named by National Dex number. Gen 1-3 Pokémon use the Game Boy Advance sprites (Emerald front, FireRed/LeafGreen back). Newer Pokémon use the closest official small game sprites available. If a sprite file is missing, the game shows a colored placeholder instead.

To re-download or add sprites after adding Pokémon:

```bash
npm run sprites          # Node 18+, fetches from the PokeAPI/sprites repository
```

## Deploy to GitHub Pages

1. Push this repo to GitHub on the `main` branch.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push again (or run the workflow manually). `.github/workflows/pages.yml` runs the tests and deploys the site, including the `sprites` folder.

Prefer no workflow? Set Pages to **Deploy from a branch** (`main`, `/ (root)`) and delete the workflow file.

## Single-file build

```bash
npm run build:standalone    # writes dist/standalone.html (about 300 KB, sprites inlined)
```

Useful for previews or hosts that accept only one HTML file.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `style.css` | GBA-style theme, battle screen and animations |
| `engine.js` | Pokémon data, type chart, daily seeding, battle logic, gauntlet |
| `game.js` | UI, scene and animation playback, sound, storage, badges, achievements |
| `sprites/` | Front and back sprite PNGs by Dex number |
| `scripts/fetch-sprites.js` | Downloads sprites |
| `scripts/build-standalone.js` | Builds the single-file version |
| `test/engine.test.js` | Engine tests (`node:test`) |
| `.github/workflows/pages.yml` | Test and deploy workflow |

## How it works

- **Day number:** days since 2026-10-13 in the player's local time zone. Change the date in `todayNo()` in `game.js` if you fork this.
- **Daily picks:** the champion order and team come from seeded shuffles (`dayInfo` in `engine.js`).
- **Battles:** a simplified engine. Level 100, the same stat training on both sides, the 18-type chart, same-type bonus, crits and 85-100% damage rolls. No abilities or status moves. Each Pokémon gets four attacks generated from its types plus coverage types, and the fourth slot is a risky 110-power move. Physical or special is decided by whichever attack stat is higher.
- **Champion AI:** always uses the move with the highest expected damage and sends Pokémon out in a fixed order.
- **Events:** `playTurn` returns a list of events (message, animation cue, HP snapshot) that the UI plays back, so the engine stays free of any UI code.

## Adding content

**A Pokémon:** add a line to `DEX_RAW` in `engine.js` and its Dex number to `IDS`, then run `npm run sprites`:

```
Name|Type1|Type2 (or empty)|base hp,atk,def,spa,spd,spe|coverage1,coverage2,coverage3
```

**A champion:** add an object to `CHAMPS` and an entry to `ARENAS` in `engine.js` (`name`, `region`, `sub`, `color`, and six unique Pokémon names). Arena backgrounds are CSS gradients in `style.css` (`.screen[data-arena=...]`). Changing the roster size shifts which champion lands on which day.

## Known limitations

- Base stats were entered by hand and may be slightly off.
- Champion teams are fan-simplified rosters of six unique Pokémon, so they won't match every in-game team exactly.
- Newer Pokémon (Gen 4 and up) use different sprite art than the GBA-era ones, so the style is not perfectly uniform.
- Progress is stored per browser. Clearing site data resets it. An unfinished Gauntlet is not saved.
- The day number and the once-a-day rule are enforced client-side only, so a determined player can reset them.

## Disclaimer

Daily Champion is an unofficial fan project. It is not affiliated with or endorsed by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company. Pokémon, character names and sprite artwork belong to their respective owners and are included here for fan, non-commercial use. Sprites are fetched from the [PokeAPI sprites](https://github.com/PokeAPI/sprites) collection. If you publish or monetize a fork, check that you have the right to use these assets.

## License

MIT for the source code. See [LICENSE](LICENSE) and replace `<your name>` with your own name before publishing. The license does not cover Pokémon names or sprite artwork.
