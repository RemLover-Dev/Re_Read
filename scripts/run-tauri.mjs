import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const cargoBinDir = path.join(os.homedir(), '.cargo', 'bin');
const cargoExe = path.join(cargoBinDir, process.platform === 'win32' ? 'cargo.exe' : 'cargo');

// Ensure .cargo/bin is in PATH for this process
const currentPath = process.env.PATH || '';
if (!currentPath.includes(cargoBinDir) && fs.existsSync(cargoBinDir)) {
  process.env.PATH = `${cargoBinDir}${path.delimiter}${currentPath}`;
}

// Enable Chromium pinch gestures and viewport scaling in WebView2
if (!process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS) {
  process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS =
    '--enable-pinch --enable-viewport --enable-features=TouchpadOverscrollHistoryNavigation';
}

const userArgs = process.argv.slice(2);
const args = userArgs.length > 0 ? userArgs : ['dev'];
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['@tauri-apps/cli', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
