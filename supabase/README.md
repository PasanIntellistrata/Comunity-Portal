# Intellistrata Community Portal — Supabase Authentication & Database Reference

This directory contains the database migrations, seed scripts, and configuration documentation for integrating Supabase Authentication with the Intellistrata Community Portal.

---

## 1. Directory Structure

```
supabase/
├── migrations/
│   └── 20261012000000_auth_configuration.sql   # Base configuration & auth directives
├── seed/
│   ├── user-mapping.json                      # Structured user mapping configuration
│   ├── create-test-users.js                   # Safe repeatable Node CLI provisioning script
│   └── seed_dummy_users.sql                   # SQL seed script for test accounts (SQL fallback)
└── README.md                                  # This documentation
```

> **Important Architecture Principle**: Per project requirements, schema migrations and seed scripts are strictly separated. No custom application tables (e.g. `public.users`) are created in the frontend repository; application data schema and user mapping remain under the ownership of the Intellistrata backend team.

---

## 2. Authentication Policy

### No Public Self-Registration
The Community Portal enforces an **invitation-only** policy. Public self-registration is disabled:
- The public registration link on `/login` has been removed.
- Direct navigation to `/register` automatically redirects to `/login`.
- `authService.register()` rejects self-registration requests with an informative error.

### Configuring in Supabase Dashboard
To enforce this at the database level:
1. Navigate to **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Email**.
2. Toggle **OFF**: `Enable Signup` (or ensure only invited/admin-created users can exist).
3. If invitations are used, invite users via **Authentication** -> **Users** -> **Invite user**.

---

## 3. Predefined Test Accounts & User Mapping

All predefined accounts, roles, and internal strata mappings are maintained in [`supabase/seed/user-mapping.json`](file:///c:/Users/pasan/OneDrive/Desktop/Intellistrata/community_portal/supabase/seed/user-mapping.json):

| Username | Email | Name | Role | Unit | Internal User ID | Property ID | Lot ID | Development Password |
|---|---|---|---|---|---|---|---|---|
| `resident.owner` | `resident.owner@intellistrata.test` | Pasan Udara | Resident Owner | 101 | `usr_pasan` | `prop-1` | `Lot A-03` | `TestPass123!` |
| `committee.member` | `committee.member@intellistrata.test` | Alice Smith | Strata Committee Member | 205 | `usr_alice` | `prop-1` | `Lot A-01` | `TestPass123!` |
| `strata.manager` | `strata.manager@intellistrata.test` | Admin Manager | Strata Manager | 100 | `usr_admin` | `prop-1` | `All Lots` | `TestPass123!` |
| `admin` | `admin@intellistrata.com` | Admin Manager | Strata Manager | 100 | `usr_admin` | `prop-1` | `All Lots` | `TestPass123!` |
| `bob` | `bob@demo.com` | Bob Johnson | Strata Committee Member | 205 | `usr_bob` | `prop-1` | `Lot B-01` | `TestPass123!` |
| `charlie` | `charlie@demo.com` | Charlie Brown | Resident Owner | 304 | `usr_charlie` | `prop-1` | `Lot B-02` | `TestPass123!` |

> **Security Warning**: The default password `TestPass123!` is strictly for local and development sandbox environments. Never deploy seed scripts containing default passwords to production.

---

## 4. How to Run the Safe Provisioning Script

The provisioning script [`supabase/seed/create-test-users.js`](file:///c:/Users/pasan/OneDrive/Desktop/Intellistrata/community_portal/supabase/seed/create-test-users.js) uses the official Supabase JavaScript client Auth Admin API (`supabaseAdmin.auth.admin`).

### Safety Guarantees:
- **Repeatable & Idempotent:** Queries existing users first via `listUsers()`. Existing accounts are safely skipped; passwords are **never** unexpectedly reset or duplicated.
- **Credential Protection:** Passwords, access tokens, and secret keys are **never** logged to the console or stored in Git.
- **Separation of Secrets:** Reads the `SUPABASE_SERVICE_ROLE_KEY` from a private, gitignored environment file (`.env.seed.local`). It is never prefixed with `VITE_` or exposed to frontend client code.

### Step-by-Step Setup & Execution:

1. **Create your local provisioning environment file** (excluded from Git):
   ```bash
   cp .env.seed.example .env.seed.local
   ```

2. **Configure credentials in `.env.seed.local`**:
   - Set `SUPABASE_URL` to your Supabase project URL (e.g. from `.env`).
   - Set `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard -> **Project Settings** -> **API** -> `service_role (secret)`).
   - *(Optional)* Set `TEST_USER_PASSWORD` if you wish to use a different development password.

3. **Run the provisioning script**:
   ```bash
   npm run seed:users
   ```
   Or directly via Node:
   ```bash
   node supabase/seed/create-test-users.js
   ```

4. **Verify the Results**:
   - Check the terminal output summary (shows newly created vs skipped accounts).
   - Open **Supabase Dashboard** -> **Authentication** -> **Users** to confirm all test accounts are present with `email_confirmed_at` populated.
   - Start the dev server (`npm run dev`) and log in at `http://localhost:5173/login`:
     - Test logging in using the **Email** (e.g. `resident.owner@intellistrata.test`).
     - Test logging in using the **Username** (e.g. `resident.owner`).
     - Password: `TestPass123!` (or your configured `TEST_USER_PASSWORD`).

---

## 4. OAuth Providers Configuration

The Community Portal supports social single sign-on through **Google** and **Microsoft**.

### Supabase Callback URL
Both providers require registering Supabase's OAuth callback URL in their respective developer consoles:
```
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

---

### A. Google OAuth Configuration
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** -> **Credentials**.
3. Click **Create Credentials** -> **OAuth Client ID**.
4. Application type: **Web application**.
5. **Authorized redirect URIs**: Add:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
6. Copy the generated **Client ID** and **Client Secret**.
7. In the **Supabase Dashboard**:
   - Go to **Authentication** -> **Providers** -> **Google**.
   - Toggle **Enable Google provider**.
   - Paste the **Client ID** and **Client Secret**.
   - Click **Save**.

---

### B. Microsoft / Azure AD Configuration
> **Note on Supabase Provider Name**: In Supabase JavaScript SDK, the provider name for Microsoft Entra ID / Azure AD is `'azure'`. The frontend code automatically translates provider requests to `'azure'` and requests the `email` and `offline_access` scopes.

1. Open the [Microsoft Entra Admin Center / Azure Portal](https://portal.azure.com/).
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**) -> **App registrations** -> **New registration**.
3. Set Supported Account Types (e.g. *Accounts in this organizational directory only* or *Multitenant and personal Microsoft accounts*).
4. Under **Redirect URI**, select **Web** and enter:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
5. Click **Register**.
6. Under **Certificates & secrets**, create a **New client secret** and copy the Value.
7. Under **Overview**, note the **Application (client) ID** and **Directory (tenant) ID**.
8. In the **Supabase Dashboard**:
   - Go to **Authentication** -> **Providers** -> **Azure**.
   - Toggle **Enable Azure provider**.
   - Paste the **Application (client) ID**, **Secret Value**, and **Azure Tenant URL** (e.g. `https://login.microsoftonline.com/<tenant-id>`).
   - Click **Save**.

---

## 5. Redirect URLs Configuration in Supabase

In the **Supabase Dashboard** under **Authentication** -> **URL Configuration**:

1. **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://portal.intellistrata.com`

2. **Redirect URLs (Allow list)**:
   Add the following paths:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/**`
   - `https://portal.intellistrata.com/auth/callback`
   - `https://portal.intellistrata.com/**`

---

## 6. Intellistrata Internal Backend Integration Contract

All authenticated API requests from the Community Portal are routed through [`src/js/services/api.js`](file:///c:/Users/pasan/OneDrive/Desktop/Intellistrata/community_portal/src/js/services/api.js).

### Request Headers
```http
GET /api/announcements HTTP/1.1
Host: api.intellistrata.com
Authorization: Bearer <supabase_access_token>
```

### Backend Responsibilities (For Maahir & Backend Team):
1. **JWT Validation**:
   - The backend validates the RS256/HS256 signature against Supabase's JWKS endpoint:
     `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
     or using the project's Supabase JWT Secret.
2. **User Identification**:
   - Extract the standard JWT claims:
     - `sub`: Supabase Auth User UUID
     - `email`: User email address
3. **Internal User Mapping**:
   - Map `sub` or `email` to the internal Intellistrata resident or committee member entity.
4. **Error Responses**:
   - If a token is missing, expired, or invalid, return `401 Unauthorized`.
   - The frontend's `LiveAPI` catches 401, clears client credentials, and navigates to `/login/`.

---

## 7. Future Invitation-Based Registration Architecture

To transition to invitation-based registration in a future phase:
1. An administrator or property manager triggers an invitation from the management dashboard.
2. Supabase sends an invite email containing an OTP/magic link (`supabase.auth.admin.inviteUserByEmail()`).
3. The invited user clicks the link, which redirects to the portal with an invitation token hash.
4. The user sets their password using `supabase.auth.updateUser({ password: newPassword })`.
5. The backend maps the newly activated user to their strata lots and unit numbers.
