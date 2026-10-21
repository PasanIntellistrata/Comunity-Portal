# Community Portal

**Intellistrata Community Portal** — a cross-platform app built with Framework7 React + Capacitor.

Runs natively on **Android** and **iOS**, and also as a **web app** in the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | [Framework7 v9](https://framework7.io) + React 18 |
| Bundler | [Vite 5](https://vitejs.dev) |
| Native Shell | [Capacitor 7](https://capacitorjs.com) |
| Targets | Web, Android, iOS |

---

## Getting Started

### Install dependencies
```bash
npm install
```

### Start web dev server
```bash
npm run dev
```
App will be at `http://localhost:5173`

---

## Build & Native

### Build web assets
```bash
npm run build
```

### Sync to native platforms (run after every build)
```bash
npm run cap:sync
```

### Add Android platform (first time only)
```bash
npx cap add android
```

### Add iOS platform (first time only, macOS required)
```bash
npx cap add ios
```

### Open in Android Studio
```bash
npm run cap:android
```

### Open in Xcode (macOS only)
```bash
npm run cap:ios
```

### Build + sync in one command
```bash
npm run build:cap
```

---

## Project Structure

```
community_portal/
├── src/
│   ├── components/
│   │   └── app.jsx          # Root F7 App (tabs, panel)
│   ├── pages/
│   │   ├── home.jsx         # Home tab
│   │   ├── about.jsx        # Catalog tab
│   │   ├── form.jsx         # Settings/Contact tab
│   │   ├── dynamic-route.jsx
│   │   ├── request-and-load.jsx
│   │   └── 404.jsx
│   ├── js/
│   │   ├── app.jsx          # Entry point
│   │   ├── routes.jsx       # App routes
│   │   ├── store.js         # F7 Store (state management)
│   │   └── capacitor-app.js # Capacitor bridge (back button, lifecycle)
│   ├── css/
│   │   └── app.css          # Custom styles
│   └── fonts/               # F7 Icons & Material Icons (auto-copied)
├── public/                  # Static assets (icons, splash)
├── www/                     # Vite build output → Capacitor web dir
├── android/                 # Android native project (after: npx cap add android)
├── ios/                     # iOS native project (after: npx cap add ios)
├── index.html
├── vite.config.js
├── capacitor.config.ts
└── package.json
```

---

## Adding Capacitor Plugins

```bash
npm install @capacitor/camera
npx cap sync
```

Then import in your components:
```js
import { Camera } from '@capacitor/camera';
```

---

## Workflow (daily)

1. `npm run dev` — develop in browser
2. `npm run build:cap` — build + sync to native
3. `npm run cap:android` or `npm run cap:ios` — open native IDE
