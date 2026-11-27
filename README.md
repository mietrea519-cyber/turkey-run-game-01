# Turkey Run — The Great Thanksgiving Escape

![Competition](https://make.fun/badge/turkey-run-game-01.svg)
![Rank](https://make.fun/badge/turkey-run-game-01/mietrea519-cyber/turkey-run-game-01/rank.svg)
![Reward](https://make.fun/badge/turkey-run-game-01/mietrea519-cyber/turkey-run-game-01/reward.svg)

Entry for [Make the best turkey escape game](https://make.fun/c/turkey-run-game-01) on make.fun — a $250 bounty with 20 paid places.

## The game

Tom the turkey is about to become Thanksgiving dinner. Run him out of the
farmyard, across the garden and through the kitchen to the forest gate, 1200 m
away — while the farmer closes in behind him.

- **Jump** (Space / ↑ / tap) over fences, hay bales and puddles
- **Slide** (↓) under the flying carving knives
- **Dash** (Shift) to pull away from the farmer
- Grab corn for points, dodge the glowing oven in the kitchen stage
- 3 hearts, a HUD of score / distance / stage / farmer distance, title screen,
  caught and escaped end screens, and a restart

Everything is original: hand-drawn canvas art, synthesized WebAudio sounds, no
libraries, no network requests — plain static files under `game/`, playable from
`file://` or any static server.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## How it is handed in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
into `/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-game.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots (first by name is the cover):

1. `1-title.jpg` — title screen
2. `2-play.jpg` — a run in the farmyard, HUD visible
3. `3-kitchen.jpg` — the kitchen stage: oven and carving knives
4. `4-escaped.jpg` — the escaped end screen

## Layout

- `game/index.html` — page and canvas
- `game/css/style.css` — autumn page chrome and HUD
- `game/src/main.js` — boot and screenshot poses (`?shot=title|play|kitchen|end`)
- `game/src/game.js` — states, loop, collisions, HUD
- `game/src/turkey.js` — the turkey: jump, slide, dash
- `game/src/farmer.js` — the chasing farmer
- `game/src/obstacles.js` — fences, hay, puddles, ovens, knives, corn
- `game/src/world.js` — parallax farm scenery and the forest gate
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files)
- `game/src/rng.js` — seeded random numbers
- `main.ts` — the hand-in program
- `serve.ts` — local static server
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `screenshots/` — 4 real renders of the game

## License

MIT — see [LICENSE](LICENSE).
