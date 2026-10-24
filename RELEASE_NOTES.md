# Re:Read v0.2.0

## What's New in v0.2.0

### 📖 E-Book & Light Novel Reader
- Native reading support for `.epub`, `.fb2`, `.fb2.zip`, and `.txt` files.
- Interactive Table of Contents (TOC) drawer with nested navigation and fragment support.
- Typography customization: font sizing, line height, font family, and margins.
- Automatic opening at the first reading chapter, skipping cover/blank pages.
- Full RTL and BiDi support for Persian and Arabic text alongside standard LTR.

### 📚 Comic & Manga Reader
- Archive support for `.cbz`, `.cbr`, `.zip`, and `.rar` formats.
- Dual-page spread layout with Manga (RTL) and Western Comic (LTR) modes.
- Continuous vertical strip view for Webtoons.
- Automatic `ComicInfo.xml` inspection for metadata and reading direction detection.
- Natural alphanumeric filename ordering preserving original image quality.

### 🤏 Touchpad Pinch-to-Zoom & Navigation
- Smooth touchpad pinch-to-zoom powered by native Windows DirectManipulation (`ICoreWebView2Settings5`).
- 2D panning with mouse drag, spacebar, middle-click, or hand tool.
- Smart zoom clamping and cursor-centered magnification.

### ⚡ Performance & Appearance
- Windows 11 native Mica backdrop effect with high contrast and dark mode support.
- Performance Mode toggle to bypass DWM compositor overhead during heavy reading sessions.

### 📦 Platform Installers & Binaries
- **Windows (x64)**: Setup installer (`.exe` NSIS) and Windows Installer package (`.msi`).
- **Linux (x64)**: Standalone `.AppImage` and Debian package (`.deb`).
- SHA-256 checksums provided for all release artifacts.
