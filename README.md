<div align="center">

# 📖 Re:Read

### Aesthetic BiDi Markdown, LaTeX & PDF Desktop Reader with Dynamic Anime Themes

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://microsoft.com/windows)

[English](README.md) • [فارسی (Persian)](README.fa.md)

</div>

---

## 🌟 Overview

**Re:Read** is a high-performance, aesthetic desktop reader and editor designed for modern note-taking, technical reading, and streaming. Built with **Tauri v2**, **React**, **TypeScript**, and **Rust**, it combines a clean glassmorphism UI with native Windows 11/10 vibrancy, full bidirectional (BiDi) text isolation for Persian/Arabic, KaTeX mathematical typesetting, PDF rendering, and an immersive **42-character Re:Zero theme engine**.

Whether you are studying technical documents with complex math formulas, taking notes in right-to-left languages with inline English, reading PDF textbooks, or streaming notes with animated overlays, Re:Read provides a fluid, distraction-free environment.

---

## ✨ Key Features

### 📝 Bidirectional (BiDi) Markdown Pipeline
- **Smart Paragraph Detection**: Automatically detects RTL (Persian, Arabic, Hebrew) and LTR (English, code) paragraphs on a block-by-block basis.
- **Inline Isolation**: Preserves English phrases, inline code snippets (`` `code` ``), and numerical data inside RTL sentences without layout inversion or punctuation flipping.
- **Syntax Highlighting & Formatting**: Full GitHub-Flavored Markdown (GFM) tables, task lists, blockquotes, and headings.

### 📐 LaTeX & Mathematical Typesetting
- **KaTeX Integration**: High-speed mathematical rendering for inline equations (`$E=mc^2$`) and display blocks (`$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`).
- **Directional Isolation**: Equations remain strictly LTR formatted even within RTL Persian/Arabic paragraphs.

### 📑 Integrated PDF Reader
- **Canvas-Accelerated PDF Viewer**: Powered by `pdfjs-dist` for fast rendering of local PDF documents.
- **Reading Controls**: Page navigation, zoom in/out, fit-to-page, and continuous scrolling.

### 🎨 42-Character Re:Zero Dynamic Theme Engine
- **42 Unique Character Profiles**: Spanning all 8 factions (Emilia Camp, Crusch Camp, Anastasia Camp, Priscilla Camp, Felt Camp, Witches of Sin, Witch Cult, and Historical Rogues).
- **Tailored Color Schemes**: Handcrafted color palettes matching each character's identity (Rem, Ram, Emilia, Beatrice, Echidna, Subaru, Reinhard, and 35+ more).
- **3-Tier Resilient Wallpaper Pipeline**:
  1. High-resolution art dynamically fetched from Safebooru / Zerochan APIs.
  2. Local persistent caching to minimize network usage.
  3. Elegant mathematical gradients as instant fallback.

### 🪟 Windows 11 / 10 Glassmorphism
- **Frameless Acrylic & Mica Windows**: Native vibrancy blur backdrop powered by `window-vibrancy` in Rust and Electron's backdrop material.
- **Custom Native-Style Titlebar**: Draggable window titlebar with minimize, maximize/restore, close buttons, mode switcher, and theme picker.

### 🎥 Streamer & Presentation Overlay
- **OBS / Presentation Friendly**: Built-in streamer overlay mode with floating badges and animated notification banners for screen recording or presentations.

### ⚡ Dual Engine Architecture
- **Tauri v2 (Primary)**: Ultra-small memory footprint (~30MB RAM) and blazing-fast native Rust backend.
- **Electron (Fallback)**: Seamless fallback option ensuring portability across various Windows environments.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 18, TypeScript 5.7 |
| **Bundler & Tooling** | Vite 6.1, PostCSS, Tailwind CSS |
| **Editor** | CodeMirror 6 (`@codemirror/lang-markdown`, `@codemirror/theme-one-dark`) |
| **Markdown & Math** | Unified, Remark-parse, Remark-rehype, Rehype-stringify, Remark-math, Rehype-katex, KaTeX |
| **PDF Rendering** | PDF.js (`pdfjs-dist`) |
| **State Management** | Zustand 5 |
| **Icons** | Lucide React |
| **Desktop Backend** | Tauri v2 (Rust, `tauri-plugin-shell`, `tauri-plugin-fs`, `window-vibrancy`, `tokio`, `reqwest`) |
| **Alternative Desktop** | Electron 44 |
| **CI/CD** | GitHub Actions (`windows-latest`, Tauri build & artifact upload) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
1. **Node.js** (v18 or v20 LTS recommended): [Download Node.js](https://nodejs.org/)
2. **Rust & Cargo** (required for building the Tauri app): [Install Rust](https://rustup.rs/)
3. **C++ Build Tools for Windows**: Visual Studio Build Tools with C++ workload (or Visual Studio Community).

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/reread.git
cd reread
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your parameters (optional):
```env
# Optional Zerochan login for automated character wallpaper scraping
ZEROCHAN_LOGIN=your_username
ZEROCHAN_PASSWORD=your_password

# Port configuration (defaults to 1420)
PORT=1420
```

---

## 💻 Running the App

### 1. Tauri Desktop (Recommended)

Starts the Vite frontend dev server on port `1420` and launches the native Tauri Windows application:

```bash
npm run desktop:tauri
# or
npm run tauri:dev
```

### 2. Electron Desktop (Fallback)

Starts the Vite dev server and launches the Electron shell:

```bash
npm run desktop:electron
```

### 3. Web Browser Dev Mode

To develop or test the frontend in your browser:

```bash
npm run dev
```
Open [http://127.0.0.1:1420](http://127.0.0.1:1420) in your browser.

### 4. Running Tests

Run the test suite covering BiDi compilation, Booru queries, and character registry validation:

```bash
npm test
```

---

## 📦 Building the Windows Executable (`.exe`)

### Local Build

To create the release executable and the NSIS setup installer locally:

```bash
npm run tauri:build
```

The output files will be created in:
- **Standalone Executable**: `src-tauri/target/release/re-read.exe`
- **Windows Setup Installer**: `src-tauri/target/release/bundle/nsis/ReRead_0.1.0_x64-setup.exe`
- **MSI Installer**: `src-tauri/target/release/bundle/msi/ReRead_0.1.0_x64_en-US.msi`

---

## 🤖 GitHub Actions Automated Build

This repository includes an automated CI/CD workflow (`.github/workflows/build.yml`) to compile the Windows `.exe` on GitHub:

1. **Trigger Manually**: Go to the **Actions** tab on your GitHub repository, click **Build Windows App (.exe)**, and click **Run workflow**.
2. **Trigger on Tag/Push**: Push a version tag (e.g. `git tag v0.1.0 && git push origin v0.1.0`), and GitHub Actions will automatically compile and publish the installers to **GitHub Releases**.
3. **Download Artifacts**: When any run finishes, you can download the zipped `ReRead-Windows-x64` artifact containing both the standalone `.exe` and the NSIS setup installer directly from the workflow summary page!

---

## ⌨️ Workspace Modes & Shortcuts

| Mode | Shortcut / Action | Description |
|---|---|---|
| **Split Mode** | Mode switch in titlebar | Dual-pane: CodeMirror editor on the left, live BiDi/LaTeX reader on the right with resizable divider |
| **Editor Mode** | Mode switch in titlebar | Full-screen Markdown editor with toolbar formatting buttons |
| **Reader Mode** | Mode switch in titlebar | Distraction-free reading view with full BiDi isolation and KaTeX formulas |
| **PDF Mode** | Mode switch in titlebar | Open and view PDF documents with page navigation and zoom |
| **Booru Mode** | Mode switch in titlebar | Browse character artworks and select custom wallpapers |
| **Theme Selector** | Palette icon in titlebar | Choose from 42 character themes across 8 factions |
| **DevTools** | `F12` or `Ctrl + Shift + I` | Toggle developer console |

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions workflow for Windows .exe build
├── electron/
│   ├── main.cjs               # Electron main process with Acrylic blur
│   └── preload.cjs            # Electron secure IPC bridge
├── public/
│   └── logo.svg               # Application branding icon
├── scripts/
│   ├── run-tauri.mjs          # Tauri CLI wrapper with Cargo PATH resolution
│   ├── start-desktop.mjs      # Desktop launcher (Electron/Tauri)
│   └── start-dev.mjs          # Vite supervisor with port conflict handling
├── src/
│   ├── components/
│   │   ├── booru/             # Booru/Zerochan image browser
│   │   ├── editor/            # CodeMirror editor & formatting toolbar
│   │   ├── pdf/               # PDF.js document viewer
│   │   ├── reader/            # BiDi Markdown & KaTeX reader component
│   │   ├── streamer/          # Streamer / OBS overlay banner
│   │   ├── themes/            # Character theme picker modal
│   │   └── titlebar/          # Custom Windows Acrylic/Mica titlebar
│   ├── core/
│   │   ├── bidi/              # Bidirectional paragraph & inline isolation
│   │   ├── booru/             # Booru API queries and tag builder
│   │   └── wallpaper/         # Resilient 3-tier background pipeline
│   ├── stores/                # Zustand stores (workspace, themes)
│   ├── styles/                # Tailwind CSS globals and animations
│   ├── themes/                # 42-character roster data & palette definitions
│   ├── App.tsx                # Main application layout
│   └── main.tsx               # React application entry point
├── src-tauri/
│   ├── capabilities/          # Tauri v2 security capabilities
│   ├── icons/                 # Multi-resolution application icons (.ico, .png)
│   ├── src/
│   │   ├── commands/          # Custom Rust IPC commands
│   │   ├── window/            # Native Windows Acrylic & Mica vibrancy
│   │   └── main.rs            # Rust backend entry point
│   ├── Cargo.toml             # Rust package configuration
│   └── tauri.conf.json        # Tauri v2 application configuration
├── tests/                     # Node.js automated test suites
├── LICENSE                    # MIT License
├── package.json               # Node.js dependencies and scripts
└── vite.config.ts             # Vite configuration with port 1420
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

Copyright (c) 2025-2026 **RemLover-Dev**.
