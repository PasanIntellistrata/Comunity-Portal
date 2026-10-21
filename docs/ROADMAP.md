# Roadmap — Community Portal

This document outlines the planned features and milestones for the Intellistrata Community Portal.

> Status legend: ✅ Done · 🚧 In Progress · 📋 Planned · 💡 Idea

---

## v1.0.0 — Foundation ✅
_Released: 2026-09-01_

- ✅ Framework7 v9 + React 18 + Vite 5 scaffold
- ✅ Capacitor 8 — Android + iOS native packaging
- ✅ Tabs navigation (Home, Catalog, Contact)
- ✅ F7 reactive store for state management
- ✅ Framework7 Icons + Material Icons

---

## v1.1.0 — AI Assistant 🚧
_In Progress_

- 🚧 GPT-4o powered conversational assistant
- 🚧 MCP server with Streamable HTTP transport
- 🚧 7 community MCP tools (announcements, search, events, documents, FAQ, posts, users)
- 🚧 Native chat UI tab in the app

---

## v1.2.0 — Authentication & Profiles 📋
_Target: Q4 2026_

- 📋 User registration & login (email + password)
- 📋 JWT-based session management
- 📋 OAuth 2.0 social login (Google, Apple)
- 📋 Resident profile pages (name, unit, avatar)
- 📋 Role-based access control (resident, committee, admin)

---

## v1.3.0 — Real Data Layer 📋
_Target: Q4 2026_

- 📋 Replace mock data with a real database
  - Option A: **SQLite** via `@capacitor-community/sqlite` (offline-first)
  - Option B: **Firebase Firestore** (realtime sync)
  - Option C: **Supabase** (PostgreSQL + Auth + Storage)
- 📋 MCP tools updated to query the real database
- 📋 Offline support with data caching

---

## v1.4.0 — Community Features 📋
_Target: Q1 2027_

- 📋 Announcement board with rich text + image support
- 📋 Community events calendar with RSVP
- 📋 Document library with upload/download
- 📋 Resident directory (opt-in)
- 📋 Marketplace listings (buy/sell/free)
- 📋 Service requests (maintenance, etc.)

---

## v1.5.0 — Push Notifications & Messaging 📋
_Target: Q1 2027_

- 📋 Push notifications via `@capacitor/push-notifications`
- 📋 In-app messaging / direct messages between residents
- 📋 Committee broadcast notifications
- 📋 Notification preferences (per category)

---

## v2.0.0 — Production Hardening 📋
_Target: Q2 2027_

- 📋 CI/CD pipeline (GitHub Actions → App Store + Google Play)
- 📋 End-to-end test suite (Playwright + Capacitor)
- 📋 MCP server deployed to cloud (Railway / Fly.io / AWS)
- 📋 OAuth 2.1 secured MCP endpoints
- 📋 Admin dashboard (web-only, React)
- 📋 Analytics & error monitoring (Sentry)

---

## Future Ideas 💡

- 💡 AI-powered committee meeting minutes summariser
- 💡 Levy payment portal integration
- 💡 Visitor management (pre-authorise guests)
- 💡 Smart parcel locker notifications
- 💡 Community polls & voting
- 💡 Multi-building / multi-strata support
