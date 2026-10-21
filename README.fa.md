<div dir="rtl" align="center">

# Re:Read نسخهٔ ۰٫۲٫۰

کتاب‌خوان دسکتاپ برای Markdown، PDF، EPUB، کمیک و مانگا، با پشتیبانی از متن فارسی و انگلیسی و تم‌های Re:Zero.

[English](README.md) · [فارسی](README.fa.md)

</div>

## قابلیت‌ها

- ویرایش Markdown با پیش‌نمایش زنده، جدول، فهرست کارها و فرمول‌های KaTeX.
- نمایش دوجهتهٔ پاراگراف‌های فارسی/عربی و انگلیسی و جداسازی کد و اعداد درون متن.
- نمایش PDF همراه با جابه‌جایی صفحه و بزرگ‌نمایی.
- کمیک و مانگا با فرمت‌های ZIP/CBZ و RAR/CBR: ترتیب طبیعی صفحات، حالت راست‌به‌چپ مانگا، چپ‌به‌راست کمیک، وب‌تون، صفحات تکی/دوتایی و بزرگ‌نمایی.
- EPUB نسخهٔ ۲ و ۳، FB2 و رمان متنی: متن و تصویر، فهرست تودرتو، پیوند فصل‌ها و تنظیمات خوانایی.
- ۴۳ تم شخصیت Re:Zero، کنترل تصویر زمینه و حالت استریمر.
- خروجی Tauri برای ویندوز و لینوکس؛ اجرای Electron نیز برای توسعه در دسترس است.

خواندن EPUB از نخستین فصل متنی در ترتیب اصلی آغاز می‌شود. جلد همچنان از طریق فهرست یا دکمه‌های فصل قابل دسترسی است. محتوای ناشر با قالب خوانای برنامه بازچینی می‌شود. کتاب‌های دارای DRM پشتیبانی نمی‌شوند.

## پیش‌نیازها

- Node.js نسخهٔ ۲۴ و npm؛ تست‌ها از قابلیت داخلی Node برای اجرای TypeScript استفاده می‌کنند.
- برای Tauri: نسخهٔ پایدار Rust و [پیش‌نیازهای بومی Tauri](https://v2.tauri.app/start/prerequisites/).
- ویندوز: ابزارهای ساخت ++C مایکروسافت و WebView2.
- لینوکس: WebKitGTK 4.1، GTK 3 و بسته‌های ساخت زیر.

برای Ubuntu 22.04:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf xdg-utils libfuse2
```

## نصب و اجرای توسعه

مخزن خود را clone کنید، وارد پوشهٔ اصلی پروژه شوید و وابستگی‌های ثبت‌شده را نصب کنید:

```bash
npm ci
```

تنظیمات اختیاری در `.env.example` توضیح داده شده‌اند. اطلاعات ورود را در فایل محلی `.env` نگه دارید.

| دستور | کاربرد |
| --- | --- |
| `npm run dev` | اجرای رابط وب در http://127.0.0.1:1420 |
| `npm run desktop` | اجرای توسعه با Electron |
| `npm run desktop:tauri` | اجرای توسعه با Tauri |
| `npm test` | تست پردازش فایل‌ها، چیدمان، متن دوجهته و تم‌ها |
| `npm run build` | بررسی TypeScript و ساخت رابط نهایی |
| `npm run release:check` | بررسی هماهنگی نسخه‌ها و تگ انتشار |
| `npm run release:icons` | آماده‌سازی آیکون‌های بومی در صورت نبودن آن‌ها |

بستهٔ `@xmldom/xmldom` وابستگی بخش EPUB است و در `package.json` و `package-lock.json` ثبت شده است. دستور `npm ci` آن را نصب می‌کند.

## ساخت نصب‌کننده به‌صورت محلی

پس از نصب پیش‌نیازهای Tauri، روی سیستم‌عامل مقصد اجرا کنید:

```bash
npm run release:check
npm run release:icons
```

ویندوز:

```bash
npm run tauri:build -- --bundles nsis,msi
```

لینوکس:

```bash
npm run tauri:build -- --bundles deb,appimage
```

خروجی‌ها در `src-tauri/target/release/bundle/` قرار می‌گیرند:

| سیستم و معماری | بسته‌ها | زیرپوشه |
| --- | --- | --- |
| ویندوز x64 | نصب‌کنندهٔ NSIS با پسوند `.exe` و بستهٔ `.msi` | `nsis/` و `msi/` |
| لینوکس x64 | `.AppImage` و `.deb` | `appimage/` و `deb/` |

آیکون‌های موجود استفاده می‌شوند. اگر آیکون‌های باینری موجود نباشند، دستور `release:icons` به‌ترتیب از `app-icon.svg`، سپس `public/logo.svg` و در نهایت `scripts/release-icon.svg` استفاده می‌کند. طرح دلخواه و آیکون‌های تولیدشده در `src-tauri/icons/` را commit کنید. افکت Mica مخصوص ویندوز است؛ در لینوکس ظاهر معمول مبتنی بر تم نمایش داده می‌شود.

## ساخت خودکار با GitHub Actions

فایل گردش‌کار `.github/workflows/build.yml` و نام آن **Build Windows and Linux** است. نصب‌کننده‌ها با Tauri ساخته می‌شوند؛ این گردش‌کار پوستهٔ توسعهٔ Electron را بسته‌بندی نمی‌کند.

- push روی شاخه‌های `main` یا `master` و pull request به این شاخه‌ها، هر دو خروجی را می‌سازد و به‌صورت artifact ذخیره می‌کند.
- مسیر **Actions → Build Windows and Linux → Run workflow** امکان ساخت دستی هر دو سیستم، بدون ایجاد Release را فراهم می‌کند.
- push تگ `v0.2.0` پس از موفقیت هر دو ساخت، یک **پیش‌نویس GitHub Release** با نصب‌کننده‌ها و فایل‌های بررسی SHA-256 ایجاد می‌کند.
- artifactها با نام‌های `ReRead-0.2.0-Windows-x64` و `ReRead-0.2.0-Linux-x64` به‌مدت ۱۴ روز نگهداری می‌شوند.
- پس از آزمایش نصب‌کننده‌ها، پیش‌نویس را در **Releases** باز کنید و **Publish release** را بزنید. فایل‌های Release مستقل از مهلت نگهداری artifactها باقی می‌مانند.

گردش‌کار از Node 24، Rust پایدار، `npm ci`، تست‌ها و `tauri-action` استفاده می‌کند و پیش‌نیازهای لینوکس را نصب می‌کند. برای ایجاد Release از `GITHUB_TOKEN` خودکار با مجوز `contents: write` استفاده می‌شود؛ توکن شخصی جداگانه لازم نیست. سیاست مخزن یا سازمان باید اجرای Actions و نوشتن محتوای مخزن توسط job انتشار را مجاز کند. نصب‌کننده‌ها تا زمانی که تنظیمات امضای خود را اضافه نکنید، بدون امضای دیجیتال هستند.

اگر گردش‌کار دیگری برای انتشار دارید، محرک‌های هم‌پوشان را ادغام یا حذف کنید تا یک تگ، دو فرایند انتشار موازی ایجاد نکند.

## آماده‌سازی و push نسخهٔ ۰٫۲٫۰

شمارهٔ نسخه در این چهار فایل باید یکسان باشد:

- `package.json`
- `package-lock.json` در ریشه و `packages[""].version`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

این بسته هر چهار مورد را روی `0.2.0` تنظیم می‌کند. فایل‌های `README.md`، `README.fa.md` و `RELEASE_NOTES.md` را در همان commit انتشار نگه دارید. فایل `Cargo.lock` را نیز با Cargo به‌روزرسانی و commit کنید؛ اگر هنوز وجود ندارد، دستور زیر آن را تولید می‌کند.

در PowerShell و پوشهٔ clone موجود:

```powershell
Set-Location -LiteralPath "E:\projects\RemLover-Dev\Rems Reader"
npm ci
npm run release:check
npm test
npm run build
npm run release:icons
cargo generate-lockfile --manifest-path src-tauri/Cargo.toml

git status
git diff
```

تغییرات، از جمله هر دو README و گردش‌کار، را مرور کنید. سپس فایل‌های انتشار را stage کنید:

```powershell
git add .github/workflows/build.yml README.md README.fa.md RELEASE_NOTES.md .gitignore package.json package-lock.json scripts/check-release.mjs scripts/prepare-icons.mjs scripts/collect-release.mjs scripts/release-icon.svg src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json src-tauri/src/window/vibrancy.rs src-tauri/icons
```

اصلاحات دلخواه EPUB و کمیک را که هنوز commit نشده‌اند نیز به commit انتشار اضافه کنید. سپس:

```powershell
git diff --cached --stat
git diff --cached
git commit -m "Release v0.2.0: Windows and Linux builds"
git push origin HEAD
```

دستور `git push origin HEAD` شاخهٔ فعلی را ارسال می‌کند. اگر مخزن به pull request نیاز دارد، ابتدا آن را merge کنید و سپس تگ را روی commit نهایی انتشار بسازید:

```powershell
git tag -a v0.2.0 -m "Re:Read v0.2.0"
git push origin v0.2.0
```

push تگ، ساخت نسخهٔ انتشار را آغاز می‌کند. تگ را فقط یک‌بار بسازید. اگر قبلاً وجود دارد، ابتدا تگ و Release موجود را بررسی کنید. تگ نسخهٔ منتشرشده را force-push نکنید.

برای نسخه‌های بعدی، هر چهار فایل نسخه، هر دو README و یادداشت انتشار را تغییر دهید؛ پس از تغییر `package.json`، دستور `npm install --package-lock-only` را اجرا و بررسی‌ها را تکرار کنید.

## ساختار پروژه

- `src/components/`: بخش‌های Markdown، PDF، EPUB، کمیک و کنترل‌های مشترک.
- `src/core/archive/`: پردازش کتاب‌ها و آرشیوها، ترتیب خواندن و چیدمان صفحات.
- `src-tauri/`: برنامهٔ Rust و تنظیمات نصب‌کننده‌ها.
- `electron/`: پوستهٔ توسعهٔ Electron.
- `scripts/`: ابزارهای اجرا و انتشار.
- `tests/`: تست‌های خودکار و تست‌های اختیاری مرورگر.
- `.github/workflows/build.yml`: ساخت ویندوز/لینوکس و ایجاد پیش‌نویس Release.

## مجوز

MIT؛ فایل [LICENSE](LICENSE) را ببینید.
