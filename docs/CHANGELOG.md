# Changelog

All notable changes to **Community Portal** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- Real database backend (SQLite / Firebase) replacing mock data
- Push notifications via `@capacitor/push-notifications`
- User authentication (JWT + OAuth 2.0)
- Community forum with threaded replies
- File upload support for documents

---

## [1.1.0] — 2026-09-01

### Added
- **AI Assistant** — conversational GPT-4o powered assistant accessible via a dedicated tab
- **MCP Server** (`mcp-server/`) — standalone Node.js Model Context Protocol server with Streamable HTTP transport
  - 7 registered MCP tools: `get_announcements`, `search_community`, `create_post`, `get_events`, `get_documents`, `answer_faq`, `get_user_profile`
  - `POST /chat` endpoint for the F7 app
  - `POST /mcp` + `GET /mcp` raw MCP JSON-RPC endpoints (compatible with Claude Desktop, Cursor, Windsurf)
- **Assistant tab** in the bottom tab bar with a native-style chat UI
- `CHANGELOG.md`, `ROADMAP.md`, `TECHNICAL.md` documentation files

---

## [1.0.0] — 2026-09-01

### Added
- Initial project scaffold — Framework7 v9 + React 18 + Vite 5
- **Capacitor 8** integration for Android and iOS native packaging
  - `android/` native project (Gradle)
  - `ios/` native project (Xcode / Swift Package Manager)
- **Tabs** navigation layout with 3 tabs: Home, Catalog, Contact
- **Home page** — welcome banner + notice board from F7 store
- **Catalog page** — community feature menu (announcements, events, docs, directory, services, marketplace)
- **Contact / Settings page** — form with name, email, message, push notification toggle
- **F7 Store** — built-in reactive state management with sample product/notice data
- **Capacitor bridge** (`src/js/capacitor-app.js`) — Android back button, app lifecycle events
- Framework7 Icons + Material Icons font assets
- `README.md` with full developer workflow guide
- `.gitignore` configured for Vite + Capacitor

### Fixed
- `Row`/`Col` components removed (dropped in F7 v9) — replaced with CSS flex
- Icon CSS import paths corrected (`framework7-icons/css/framework7-icons.css`)
- Capacitor config converted from `.ts` to `.js` (CommonJS) to avoid ESM parse error
- `@capacitor/app` dynamic import removed to prevent Rollup resolution failure

---

[Unreleased]: https://github.com/intellistrata/community-portal/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/intellistrata/community-portal/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/intellistrata/community-portal/releases/tag/v1.0.0
