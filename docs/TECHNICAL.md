# Technical Reference — Community Portal

This document covers the architecture, design decisions, and developer guide for the Intellistrata Community Portal.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Frontend Architecture (F7 + React)](#3-frontend-architecture)
4. [State Management (F7 Store)](#4-state-management)
5. [Routing](#5-routing)
6. [Native Integration (Capacitor)](#6-native-integration)
7. [AI Assistant + MCP Server](#7-ai-assistant--mcp-server)
8. [Environment Variables](#8-environment-variables)
9. [Build & Deployment](#9-build--deployment)
10. [Adding New Features](#10-adding-new-features)
11. [Supabase Authentication & Security](#11-supabase-authentication--security)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | Framework7 React | ^9.0.0 |
| View Library | React | ^18.2.0 |
| Bundler | Vite | ^5.2.0 |
| Native Shell | Capacitor | ^8.x |
| AI Provider | OpenAI GPT-4o | via `openai` SDK |
| MCP Protocol | @modelcontextprotocol/sdk | latest |
| MCP Transport | Express (Streamable HTTP) | ^4.x |
| Schema Validation | Zod | ^3.x |
| Icons | Framework7 Icons + Material Icons | ^4.x / ^1.x |
| Target Platforms | Web, Android, iOS | — |

---

## 2. Project Structure

```
community_portal/                  ← Root workspace
├── src/                           ← F7 React app source
│   ├── components/
│   │   └── app.jsx                ← Root F7 App (tabs, panel, router config)
│   ├── pages/
│   │   ├── home.jsx               ← Home tab
│   │   ├── about.jsx              ← Catalog tab
│   │   ├── form.jsx               ← Contact/Settings tab
│   │   ├── assistant.jsx          ← AI Assistant chat tab
│   │   ├── dynamic-route.jsx      ← URL param demo
│   │   ├── request-and-load.jsx   ← Async route demo
│   │   └── 404.jsx                ← Not found
│   ├── js/
│   │   ├── app.jsx                ← Entry point (mounts React + F7)
│   │   ├── routes.jsx             ← App routes array
│   │   ├── store.js               ← F7 reactive store
│   │   └── capacitor-app.js       ← Capacitor bridge
│   ├── css/
│   │   └── app.css                ← Brand design tokens + F7 overrides
│   └── fonts/                     ← Icon fonts (auto-copied on postinstall)
├── public/                        ← Static assets (icons, splash)
├── www/                           ← Vite build output (Capacitor webDir)
├── android/                       ← Android Gradle project
├── ios/                           ← iOS Xcode project
├── mcp-server/                    ← AI Assistant backend
│   ├── src/
│   │   ├── index.js               ← Express server (:3000)
│   │   ├── mcp.js                 ← MCP Server instance + tool registration
│   │   ├── chat.js                ← OpenAI GPT-4o tool-call loop
│   │   ├── tools/                 ← One file per MCP tool
│   │   └── data/mock-data.js      ← In-memory seed data
│   └── package.json
├── index.html                     ← Vite HTML entry
├── vite.config.js
├── capacitor.config.js            ← appId: com.intellistrata.portal
├── package.json
├── CHANGELOG.md
├── ROADMAP.md
└── TECHNICAL.md                   ← This file
```

---

## 3. Frontend Architecture

### Framework7 + React

Framework7 (F7) provides native-feeling iOS and Android UI components. The app uses `<App>`, `<Views>`, and `<View>` to create a tab-based navigation shell that mirrors native mobile UX.

**Theme detection:** F7 is configured with `theme: 'auto'` — it renders iOS-style UI on iOS devices and Material Design on Android/web.

**Entry flow:**
```
index.html
  └── src/js/app.jsx          (imports F7, React, CSS, mounts <App />)
        └── src/components/app.jsx  (root F7 component, defines tabs & panel)
              └── <View> per tab  (each view has its own router stack)
```

### Component Conventions

- Pages live in `src/pages/` and export a single default React component
- Each page receives `f7route` and `f7router` as props (injected by F7 router)
- Global app state is accessed via `useStore('key')` hook from `framework7-react`
- Navigation uses `<Link href="/path/">` or `f7.views.main.router.navigate('/path/')`

---

## 4. State Management

The app uses the **F7 built-in Store** (reactive, lightweight, no Redux needed).

**Location:** `src/js/store.js`

```js
// Reading state in a component
import { useStore } from 'framework7-react';
const products = useStore('products');   // reactive — re-renders on change

// Dispatching an action
import { f7 } from 'framework7-react';
f7.store.dispatch('addProduct', { id: '4', title: 'New Item' });
```

**Shape:**
```js
{
  state: { products: [...] },
  getters: { products },
  actions: { addProduct }
}
```

Replace with a real database adapter in the `actions` when ready (v1.3.0).

---

## 5. Routing

Routes are declared in `src/js/routes.jsx` as a flat array. F7's router handles nested views automatically per tab.

```js
// Add a new page:
import MyPage from '../pages/my-page.jsx';
{ path: '/my-page/', component: MyPage }

// Dynamic segments:
{ path: '/user/:userId/', component: UserPage }
// Access in component: f7route.params.userId

// Async / lazy loaded:
{ path: '/heavy/', async({ resolve }) {
    import('../pages/heavy.jsx').then(({ default: c }) => resolve({ component: c }));
}}
```

Each bottom tab is a separate `<View>` with its own router history stack, so navigating within a tab doesn't affect other tabs.

---

## 6. Native Integration (Capacitor)

### Configuration

`capacitor.config.js` (root):
```js
{
  appId: 'com.intellistrata.portal',
  appName: 'Community Portal',
  webDir: 'www',              // Vite build output
  server: { androidScheme: 'https' }
}
```

### Native Workflow

```bash
npm run build           # Vite → www/
npx cap sync            # Copy www/ → android/ & ios/
npx cap open android    # Open Android Studio
npx cap open ios        # Open Xcode (macOS only)
```

### Capacitor Bridge

`src/js/capacitor-app.js` is initialised inside `f7ready()` in `src/components/app.jsx`.
It handles:
- Android hardware back button (via DOM `backbutton` event)
- App resume/pause lifecycle events

### Adding Plugins

```bash
npm install @capacitor/camera
npx cap sync
```

```js
import { Camera } from '@capacitor/camera';
const photo = await Camera.getPhoto({ quality: 90, resultType: 'uri' });
```

---

## 7. AI Assistant + MCP Server

### Overview

The AI assistant is a two-part system:

1. **MCP Server** (`mcp-server/`) — standalone Node.js process exposing community tools via the Model Context Protocol
2. **Chat UI** (`src/pages/assistant.jsx`) — F7 React chat page that calls the server

### MCP Server Architecture

```
Express (:3000)
  ├── POST /chat         ← Used by the F7 app
  │     └── chat.js      ← Sends message to OpenAI with tool definitions
  │           └── OpenAI calls tools → mcp.js executes handlers → returns result
  ├── GET  /mcp          ← MCP inspector / health
  └── POST /mcp          ← Raw MCP JSON-RPC (for Claude Desktop, Cursor, etc.)
```

### MCP Tools Reference

| Tool Name | Input Schema | Description |
|---|---|---|
| `get_announcements` | `{ limit?: number, category?: string }` | List community notices |
| `search_community` | `{ query: string, type?: 'user\|post\|event' }` | Full-text search |
| `create_post` | `{ title: string, body: string, category: string }` | Create new announcement |
| `get_events` | `{ from?: string, to?: string }` | Upcoming community events |
| `get_documents` | `{ category?: string }` | Community document library |
| `answer_faq` | `{ question: string }` | Search FAQ knowledge base |
| `get_user_profile` | `{ userId?: string, name?: string }` | Look up resident profile |

### OpenAI Tool-Call Loop

```
User message
    │
    ▼
OpenAI (with tools as function definitions)
    │
    ├─ Text response? → return to client
    │
    └─ Tool call? → execute MCP tool handler
                       │
                       ▼
                   Tool result
                       │
                       ▼
                   Back to OpenAI (with tool result)
                       │
                       └─ Final text response → return to client
```

This loop runs synchronously and supports multi-step tool chaining (e.g. search → then get profile).

### Connecting External MCP Clients

The `POST /mcp` endpoint speaks standard MCP JSON-RPC. To connect Claude Desktop:

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "community-portal": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

---

## 8. Environment Variables

### MCP Server (`mcp-server/.env`)

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o |
| `OPENAI_MODEL` | No | Default: `gpt-4o` |
| `PORT` | No | Default: `3000` |
| `CORS_ORIGIN` | No | Default: `*` (restrict in production) |

Copy `mcp-server/.env.example` → `mcp-server/.env` and fill in values.

---

## 9. Build & Deployment

### Local Development

```bash
# Terminal 1 — F7 web app
npm run dev              # http://localhost:5173

# Terminal 2 — MCP / AI server
cd mcp-server
npm start                # http://localhost:3000
```

### Production Build

```bash
npm run build            # Vite → www/
npm run cap:sync         # Sync to native
npm run cap:android      # Open Android Studio → Archive
npm run cap:ios          # Open Xcode → Archive (macOS)
```

### MCP Server Deployment

Deploy `mcp-server/` to any Node.js host (Railway, Fly.io, Render, AWS Lambda):
1. Set `OPENAI_API_KEY` as an environment secret
2. Set `CORS_ORIGIN` to your app's domain
3. Update the API base URL in `src/pages/assistant.jsx`

---

## 10. Adding New Features

### New Page

1. Create `src/pages/my-feature.jsx`
2. Add route in `src/js/routes.jsx`
3. Link from a page or tab: `<Link href="/my-feature/">`

### New MCP Tool

1. Create `mcp-server/src/tools/my-tool.js` — export `{ definition, handler }`
2. Import and register in `mcp-server/src/mcp.js`
3. Add to the tools array in `mcp-server/src/chat.js`

### New Capacitor Plugin

```bash
npm install @capacitor/plugin-name
npx cap sync
```

Import and use in any component or `capacitor-app.js`.

---

## 11. Supabase Authentication & Security

### Centralized Service Architecture

All authentication and session operations are centralized in `src/js/services/auth.js`. React components, route guards, and API helpers interact strictly with `authService` rather than making raw SDK or network calls.

```
React Components / Routes
           │
           ▼
    authService (src/js/services/auth.js)
     ├── MockAuth (when VITE_USE_MOCK_API=true)
     └── SupabaseAuth (when VITE_USE_MOCK_API=false)
           │
           ▼
    supabase client (src/js/services/supabase.js)
           │
           ▼
    Supabase Auth Service (GoTrue)
```

### Supported Authentication Methods

1. **Email & Password**:
   - Tested using predefined development dummy users.
   - Credentials validated via `supabase.auth.signInWithPassword()`.
2. **Google OAuth**:
   - Initiated via `authService.loginWithOAuth('Google')` (`provider: 'google'`).
   - Redirects to Google consent screen and returns to `/auth/callback`.
3. **Microsoft OAuth (Entra ID / Azure AD)**:
   - Initiated via `authService.loginWithOAuth('Microsoft')` (mapped to `provider: 'azure'`).
   - Requests `email` and `offline_access` scopes.
   - Redirects to Microsoft login and returns to `/auth/callback`.

### Session Management & Token Propagation

- **Token Storage**: Supabase automatically manages encrypted refresh tokens and active access tokens in local storage.
- **Persistence Across Refresh**: Route guards and app state check `authService.isAuthenticated()`, which synchronously verifies session presence before re-validating in the background, preventing unintended bounces to `/login/`.
- **Backend API Requests**: `LiveAPI` in `src/js/services/api.js` awaits `authService.getToken()` and attaches:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Session Expiration / 401 Handling**: If the token cannot be refreshed or if the internal backend returns HTTP 401 Unauthorized, `LiveAPI` calls `authService.logout()`, clearing client state and redirecting to `/login/`.

### Public Registration Policy

Per Intellistrata design requirements:
- **No Public Self-Registration**: Registration forms are disabled.
- **Invitation-Based Workflow**: In future phases, administrators will invite residents/managers via email, issuing an invitation token to set their password and link to internal records.

### Database Migrations & Seed Scripts

All database assets are maintained in the `supabase/` directory:
- `supabase/migrations/20261012000000_auth_configuration.sql`: Auth configuration and schema directives.
- `supabase/seed/seed_dummy_users.sql`: SQL seed for local test accounts (`resident.owner@intellistrata.test`, `committee.member@intellistrata.test`, `strata.manager@intellistrata.test`).
- `supabase/seed/create-test-users.js`: Automated provisioning utility for cloud development instances.
- `supabase/README.md`: Comprehensive setup and migration guide.
