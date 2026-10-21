import fs from 'node:fs';
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const tauri = readJson('src-tauri/tauri.conf.json');
const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const packageSection = cargo.match(/^\[package\]\s*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1];
const rustVersion = packageSection?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Use a stable x.y.z release version.');
if (tauri.version !== pkg.version || rustVersion !== pkg.version) {
  throw new Error('package.json, Cargo.toml and tauri.conf.json must have the same version.');
}
const lock = readJson('package-lock.json');
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) {
  throw new Error('Run npm install --package-lock-only to synchronize package-lock.json.');
}
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${pkg.version}`) {
  throw new Error(`Tag must be v${pkg.version}; found ${process.env.GITHUB_REF_NAME}.`);
}
console.log(`Release configuration is synchronized at ${pkg.version}.`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${pkg.version}\n`);
