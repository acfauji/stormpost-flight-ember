# STORMPOST — Islewatch Flight

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/acfauji/stormpost-flight-ember/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/acfauji/stormpost-flight-ember/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

An original, offline WebGL2 twin-turboprop flight game over a volcanic archipelago. The aircraft, terrain, lights, cockpit, weather and effects are procedural: no downloaded meshes, textures or runtime services. Three contracts combine storm/safe-route decisions, supply drops, fuel consumption, airframe wear and runway contact checks.

## Run it

Node.js 22.18 or newer; no installation or build step:

```sh
node serve.ts --port 8091
```

Open `http://127.0.0.1:8091/` in desktop Chrome with WebGL2 enabled. W/S pitch, A/D bank, Shift/Ctrl throttle, F flaps, G gear, Space supply drop, V route, C cockpit/chase, Q/E cockpit look, B wheel brakes, P pause, M sound. Hold and drag the mouse to fly. Keys 1/2/3 start the rescue/relay/delivery contracts; Enter restarts after a landing or crash.

## Authentic flown screenshots

The four unedited 1280×800 Chrome JPEGs were captured during one continuous deterministic sortie from the ordinary offshore start: ring gate → storm-corridor supply drop → Runway 18 centerline flare → off-strip stall impact. A scratch-only Playwright pilot sends actual mouse and keyboard events; the same fixed 50 Hz integrator drives normal play and replay. Fuel, hull, score, attitude, gear, flaps and position come from that simulation, not assignments made for a screenshot. The crash frame follows another 2.4 seconds of effects animation after physical impact. No practice presets or `?scene=` shortcuts are used. Capture scripts, raw trajectory, contact sheets and judging evidence stay outside the hand-in repository.

## Deterministic hand-in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Copies the static game and original captures and writes the dossier using the unchanged official `vendor/makefun-game.ts`. No network access or external assets are required by the game. The badge links in this README are repository metadata only.

MIT licensed. Entered on [make.fun](https://make.fun/bounty/best-flight-game-20261126-0057).
