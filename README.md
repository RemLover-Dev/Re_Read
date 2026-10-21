<div align="center">

# Re:Read 0.2.0

A desktop reader for Markdown, PDF, EPUB, comics and manga, with Persian/English typography and Re:Zero themes.

[English](README.md) · [فارسی](README.fa.md)

</div>

## Features

- Markdown editing with a live preview, GitHub-flavored tables, task lists and KaTeX mathematics.
- Bidirectional Persian/Arabic and English paragraphs with inline isolation for code and numbers.
- PDF reading with page navigation and zoom.
- ZIP/CBZ and RAR/CBR comics: natural page order, manga RTL, comic LTR, webtoon strips, single/double pages and zoom.
- EPUB 2/3, FB2 and text novels: readable text and illustrations, nested contents, chapter links and typography controls.
- 43 Re:Zero character themes, wallpaper controls and a streamer overlay.
- Tauri desktop distribution for Windows and Linux; Electron is also available for development.

The EPUB reader opens at the first linear text chapter and keeps the cover accessible through Contents or chapter navigation. It reflows publisher content using the reader's typography. DRM-protected books are not supported.

## Requirements

- Node.js 24 and npm. The test command uses Node's built-in TypeScript stripping.
- For Tauri: stable Rust and the native dependencies listed in [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
- Windows: Microsoft C++ Build Tools and WebView2.
- Linux: WebKitGTK 4.1, GTK 3 and the build packages below.

On Ubuntu 22.04:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf xdg-utils libfuse2
```

## Install and develop

Clone your repository, enter its root directory, then install the locked dependencies:

```bash
npm ci
```

The optional `.env` settings are described in `.env.example`. Keep credentials in your local `.env`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Browser frontend at http://127.0.0.1:1420 |
| `npm run desktop` | Electron development app |
| `npm run desktop:tauri` | Tauri development app |
| `npm test` | Parser, layout, BiDi, query and theme tests |
| `npm run build` | TypeScript check and production frontend |
| `npm run release:check` | Check synchronized versions and release tag |
| `npm run release:icons` | Prepare missing native application icons |

`@xmldom/xmldom` is an application dependency of the EPUB reader. It is included in `package.json` and `package-lock.json`; `npm ci` installs it.

## Build installers locally

Run these on the target operating system after installing its Tauri prerequisites:

```bash
npm run release:check
npm run release:icons
```

Windows:

```bash
npm run tauri:build -- --bundles nsis,msi
```

Linux:

```bash
npm run tauri:build -- --bundles deb,appimage
```

Outputs are under `src-tauri/target/release/bundle/`:

| Platform / architecture | Packages | Bundle subdirectories |
| --- | --- | --- |
| Windows x64 | NSIS setup `.exe`, `.msi` | `nsis/`, `msi/` |
| Linux x64 | `.AppImage`, `.deb` | `appimage/`, `deb/` |

Existing icons are kept. If binary icons are missing, `release:icons` generates them from `app-icon.svg`, then `public/logo.svg`, or the included fallback `scripts/release-icon.svg`. Commit your preferred artwork and generated `src-tauri/icons/` files. Windows Mica effects are specific to Windows; Linux uses the reader's regular themed appearance.

## GitHub Actions

The workflow is `.github/workflows/build.yml`, named **Build Windows and Linux**. It uses Tauri to package installers; it does not package the Electron development shell.

- Pushes to `main`/`master` and pull requests targeting those branches build both platforms and upload workflow artifacts.
- **Actions → Build Windows and Linux → Run workflow** builds both platforms without creating a release.
- Pushing `v0.2.0` builds both platforms and, after both succeed, creates a **draft GitHub Release** with their installers and SHA-256 checksums.
- Workflow artifacts are named `ReRead-0.2.0-Windows-x64` and `ReRead-0.2.0-Linux-x64`, retained for 14 days.
- After testing the installers, open **Releases**, edit the draft and choose **Publish release**. Release assets then remain available independently of workflow artifact retention.

The workflow installs Linux native dependencies and uses Node 24, Rust stable, `npm ci`, the test suite and `tauri-action`. Its release job uses the automatically provided `GITHUB_TOKEN` with `contents: write`; a separate personal token is not required. Repository or organization policies must allow Actions to run and the release job to write repository contents. Installers are unsigned unless you add your own signing configuration.

If another workflow already builds or publishes releases, merge or remove the overlapping triggers so one tag does not run duplicate release pipelines.

## Project layout

- `src/components/`: Markdown, PDF, EPUB, comic readers and shared controls.
- `src/core/archive/`: Comic/EPUB/FB2 parsers, reading order and page layout.
- `src-tauri/`: Rust desktop application and installer configuration.
- `electron/`: Electron development shell.
- `scripts/`: Development launchers and release helpers.
- `tests/`: Automated tests and optional browser regressions.
- `.github/workflows/build.yml`: Windows/Linux installer build and draft-release workflow.

## License

MIT. See [LICENSE](LICENSE).
