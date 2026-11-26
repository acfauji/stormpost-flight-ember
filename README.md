# STORMPOST — Islewatch Flight

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/acfauji/stormpost-flight-ember/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/acfauji/stormpost-flight-ember/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

An original, offline Canvas flight game over a volcanic archipelago. Ember is the default palette; `?variant=teal` selects the alternate. Three contracts combine flight controls, storm/safe-route decisions, supply drops, fuel consumption, airframe wear, and runway landing checks.

## Run it

Node.js 22.18 or newer; no installation or build step:

```sh
node serve.ts --port 8091
```

Open `http://127.0.0.1:8091/` in desktop Chrome. Enter launches; W/S pitch, A/D bank, Q/E yaw, Shift/Ctrl throttle, F flaps, G gear, Space supply drop, V route, P pause. Hold and drag the mouse to fly.

## Screenshots and reproducible checkpoints

The four JPEGs are unedited 1280×800 Chrome captures. The cover, storm, and approach use playable `?scene=cover`, `?scene=storm`, and `?scene=runway` checkpoints. `sortieReplay.js` advances the actual flight physics from a full-fuel offshore departure, including two storm holding circuits. Fuel and hull are integrated, not assigned screenshot values. Real keyboard bank/drop inputs are then applied for the captures. These are reproducible scenario checkpoints, not a claim of continuous human piloting. `?scene=debrief` is the separately staged end-screen demonstration.

## Deterministic hand-in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Copies the static game and original captures and writes the dossier using the unchanged official `vendor/makefun-game.ts`. No network access or external assets are required by the game. The badge links in this README are repository metadata only.

MIT licensed. Entered on [make.fun](https://make.fun/bounty/best-flight-game-20261126-0057).
