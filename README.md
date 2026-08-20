# YT Downloader

A modern, cross-platform desktop application for downloading videos and audio using [yt-dlp](https://github.com/yt-dlp/yt-dlp). Built with [Tauri v2](https://tauri.app/) (Rust backend) and React + TypeScript + Tailwind CSS (frontend).

## Features

- 🎬 Download video and audio from YouTube and 1000+ supported sites
- 🍪 **YouTube Authentication (cookies.txt)**: Bypass YouTube 360p / 403 restrictions and unlock all HD/4K resolutions
- 🌐 **Multi-Language Support**: 10 languages (English, Türkçe, Español, Français, Deutsch, Português, العربية, 日本語, 한국어, 中文)
- ⚙️ **Settings Drawer**: Easy management of cookies, appearance themes, and language
- 📊 Real-time progress tracking with speed display
- 🎨 Theme options: System (automatic OS follow), Light, and Dark modes
- 📁 Show downloaded files in system file manager
- ✏️ Rename downloaded files
- 🔄 Up to 3 concurrent downloads with automatic queuing
- 💾 Download history persists across app restarts
- ⚙️ First-run dependency check with one-click install
- 🖱️ Native app experience without unwanted browser context menus

---

## 🍪 YouTube High-Quality Downloads (cookies.txt Guide)

### Why is this needed? / Neden gerekli?
> **English:** Due to YouTube's recent anti-bot protections (SABR streaming and Proof of Origin / PO Tokens), YouTube restricts unauthenticated requests to a maximum resolution of **360p** or throws `HTTP 403 Forbidden` errors. Providing a `cookies.txt` file from your web browser authenticates yt-dlp as a real user, unlocking **720p, 1080p, 1440p, 4K, and 8K** resolutions.
>
> **Türkçe:** YouTube'un yeni bot koruma mekanizmaları (SABR akışı ve PO Token zorunluluğu) nedeniyle oturum açılmamış isteklerde kalite maksimum **360p** ile sınırlandırılmakta veya `403 Forbidden` hatası alınmaktadır. Tarayıcınızdan alacağınız bir `cookies.txt` dosyası sayesinde uygulama tüm **720p, 1080p, 2K, 4K** formatlarını sorunsuz şekilde indirebilir.

### How to get your `cookies.txt`? / `cookies.txt` Nasıl Alınır?

1. **Install a Browser Extension / Tarayıcı Eklentisi Yükleyin:**
   - **Chrome / Edge / Brave / Opera:** [Get cookies.txt locally (Chrome Web Store)](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - **Firefox:** [cookies.txt (Firefox Add-ons)](https://addons.mozilla.org/firefox/addon/cookies-txt/)
2. **Log in to YouTube / YouTube'a Giriş Yapın:**
   - Open your browser, navigate to [youtube.com](https://www.youtube.com) and ensure you are logged into your account.
3. **Export the Cookies / Çerezleri Dışa Aktarın:**
   - While on YouTube, click the extension icon and select **Export** / **Download**.
   - Save the file as `cookies.txt` on your computer.
4. **Select in YT Downloader / Uygulamada Tanıtın:**
   - Open YT Downloader and click **Settings (⚙️)** or use the banner inside the **Add Download** modal.
   - Click **"Select cookies.txt"** and choose your saved file.
   - *The file path is saved automatically, you only need to do this once!*

---

## Prerequisites

### Required System Tools

The app requires two external tools. On first launch, it will check for these and offer to install them:

- **yt-dlp** — The video downloader engine
- **ffmpeg** — Required for merging video + audio streams and format conversion

### Development Tools

- **Rust** (1.70+) — [Install via rustup](https://rustup.rs/)
- **Node.js** (18+) — [Download](https://nodejs.org/)
- **npm** (9+) — Comes with Node.js

### Platform-Specific Requirements

#### macOS
- Xcode Command Line Tools: `xcode-select --install`
- Homebrew (recommended): [brew.sh](https://brew.sh/)

#### Windows
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)
- [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

#### Linux
- `webkit2gtk-4.1` and related libs:
  ```bash
  # Debian/Ubuntu
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  
  # Fedora
  sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel
  ```

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

```bash
npm run tauri dev
```

This starts both the Vite dev server (frontend HMR) and the Tauri Rust backend.

### 3. Production Build

```bash
npm run tauri build
```

This produces platform-specific bundles:

| Platform | Output |
|----------|--------|
| macOS | `src-tauri/target/release/bundle/dmg/YT Downloader.dmg` |
| Windows | `src-tauri/target/release/bundle/msi/YT Downloader.msi` |
| Linux | `src-tauri/target/release/bundle/appimage/YT Downloader.AppImage` |

## Installing yt-dlp and ffmpeg

### macOS (Homebrew)
```bash
brew install yt-dlp ffmpeg
```

### Windows (winget)
```bash
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

### Linux
```bash
# yt-dlp
pip3 install yt-dlp

# ffmpeg
sudo apt install ffmpeg      # Debian/Ubuntu
sudo dnf install ffmpeg      # Fedora
sudo pacman -S ffmpeg        # Arch
```

## Architecture

```
├── src/                    # React Frontend (TypeScript)
│   ├── components/         # UI Components
│   ├── store/              # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API wrappers & utilities
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Rust Backend
│   └── src/
│       ├── commands/       # Tauri command handlers
│       ├── state.rs        # App state types
│       └── store.rs        # JSON persistence
```

## License

MIT
