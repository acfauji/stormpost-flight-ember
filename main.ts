// Node 22 runs this TypeScript directly; the hand-in has no build or install step.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyDeliverable(source: string, target: string) {
  const destination = join(output, target);
  if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });
  cpSync(join(repository, source), destination, { recursive: true });
}

mkdirSync(output, { recursive: true });
copyDeliverable('game', 'game');
copyDeliverable('screenshots', 'screenshots');
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
