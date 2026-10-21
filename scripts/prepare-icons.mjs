import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const required = [...config.bundle.icon, 'icons/icon.png'];
if (required.every((name) => fs.existsSync(path.join('src-tauri', name)))) {
  console.log('Using existing application icons.');
} else {
  // Text-only exports omit binary icons. Prefer the project's existing artwork.
  const source = ['app-icon.svg', 'public/logo.svg', 'scripts/release-icon.svg'].find((name) => fs.existsSync(name));
  if (!source) throw new Error('Missing icon artwork. Add app-icon.svg and run npm run release:icons.');
  console.log(`Generating missing application icons from ${source}.`);
  const cli = path.resolve('node_modules/@tauri-apps/cli/tauri.js');
  const result = spawnSync(process.execPath, [cli, 'icon', source, '--output', 'src-tauri/icons'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
