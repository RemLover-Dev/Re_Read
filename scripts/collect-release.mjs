import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const platform = process.platform === 'win32' ? 'Windows' : process.platform === 'linux' ? 'Linux' : null;
if (!platform) throw new Error('Release collection supports Windows and Linux.');
const extensions = platform === 'Windows' ? ['.exe', '.msi'] : ['.deb'];
const root = 'src-tauri/target/release/bundle';
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root).filter((file) => extensions.some((extension) => file.endsWith(extension)));
for (const extension of extensions) if (!files.some((file) => file.endsWith(extension))) throw new Error(`Missing ${extension} installer.`);
fs.rmSync('release-artifacts', { recursive: true, force: true });
fs.mkdirSync('release-artifacts');
const sums = [];
for (const file of files) {
  const name = path.basename(file);
  if (fs.existsSync(path.join('release-artifacts', name))) throw new Error(`Duplicate installer filename: ${name}`);
  fs.copyFileSync(file, path.join('release-artifacts', name));
  sums.push(`${createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${name}`);
}
fs.writeFileSync(`release-artifacts/SHA256SUMS-${platform}-x64.txt`, sums.join('\n') + '\n');
console.log(`Collected ${files.length} ${platform} installers.`);
