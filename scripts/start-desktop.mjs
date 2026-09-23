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
  const isTauriRequested = process.argv.includes('--tauri');
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (isTauriRequested) {
    console.log('\x1b[36mStarting Re:Read native Tauri application...\x1b[0m');
    const tauriProcess = spawn('node', ['scripts/run-tauri.mjs', 'dev'], {
      stdio: 'inherit',
      shell: true,
    });
    tauriProcess.on('exit', (code) => {
      process.exit(code ?? 0);
    });
    return;
  }

  const port = process.env.PORT || '1420';
  const devUrl = `http://127.0.0.1:${port}/`;
  const isDevRunning = await checkServerReady(devUrl);
  let viteProcess = null;

  if (!isDevRunning) {
    console.log('\x1b[36mStarting Vite frontend dev server...\x1b[0m');
    viteProcess = spawn(npxCmd, ['vite'], {
      stdio: 'inherit',
      shell: true,
    });

    // Wait for server ready (up to 15 seconds)
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 300));
      if (await checkServerReady(devUrl)) {
        console.log('\x1b[32m✔ Vite dev server is ready.\x1b[0m');
        break;
      }
    }
  } else {
    console.log(`\x1b[32m✔ Frontend dev server already active on ${devUrl}\x1b[0m`);
  }

  console.log('\x1b[32mLaunching Re:Read Windows Desktop application...\x1b[0m');
  const electronProcess = spawn(npxCmd, ['electron', 'electron/main.cjs'], {
    stdio: 'inherit',
    shell: true,
  });

  const cleanup = () => {
    if (viteProcess) {
      try {
        viteProcess.kill();
      } catch (_) {}
    }
  };

  electronProcess.on('exit', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}

main();
