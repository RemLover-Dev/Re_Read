import { spawn } from 'node:child_process';
import http from 'node:http';

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const port = process.env.PORT || '1420';
  const devUrl = `http://127.0.0.1:${port}/`;
  const isAlreadyRunning = await checkServerReady(devUrl);

  if (isAlreadyRunning) {
    console.log(`\x1b[32m✔ Frontend dev server is already running on ${devUrl}\x1b[0m`);
    // Keep process alive so Tauri's supervisor doesn't terminate
    setInterval(() => {}, 10000);
    return;
  }

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(npxCmd, ['vite', '--clearScreen', 'false'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('\x1b[31m[Vite Dev Server Error]\x1b[0m', err);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[Vite] exited with code ${code}`);
    }
    process.exit(code ?? 0);
  });

  // Keep process alive
  process.on('SIGINT', () => {
    try {
      child.kill();
    } catch (_) {}
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    try {
      child.kill();
    } catch (_) {}
    process.exit(0);
  });
}

main();
