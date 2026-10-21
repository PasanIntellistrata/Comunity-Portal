# Intellistrata Community Portal — Supabase Authentication & Database Reference

This directory contains the database migrations, seed scripts, and configuration documentation for integrating Supabase Authentication with the Intellistrata Community Portal.

---

## 1. Directory Structure

```
supabase/
├── migrations/
│   └── 20261012000000_auth_configuration.sql   # Base configuration & auth directives
├── seed/
│   ├── seed_dummy_users.sql                   # SQL seed script for test accounts
│   └── create-test-users.js                   # Node CLI script via Supabase Admin API
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

## 3. Predefined Test Accounts (Development)

The seed scripts provision the following test users for development and testing:

| Email | Role | Unit | Name | Development Password |
|---|---|---|---|---|
| `resident.owner@intellistrata.test` | Resident Owner | 101 | Pasan Udara | `TestPass123!` |
| `committee.member@intellistrata.test` | Strata Committee Member | 205 | Alice Smith | `TestPass123!` |
| `strata.manager@intellistrata.test` | Strata Manager | 100 | Admin Manager | `TestPass123!` |

> **Security Warning**: The password `TestPass123!` is strictly for local and development sandbox environments. Never deploy seed scripts containing default passwords to production.

### How to Run the Seed Scripts

#### Option A: Via Supabase Dashboard (SQL Editor)
1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Copy and run the contents of [`supabase/seed/seed_dummy_users.sql`](file:///c:/Users/pasan/OneDrive/Desktop/Intellistrata/community_portal/supabase/seed/seed_dummy_users.sql).

#### Option B: Via Node.js Admin API Script
Run the provisioning script using your project URL and service role key (kept in environment variables only):

```bash
SUPABASE_URL=https://your-dev-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node supabase/seed/create-test-users.js
```

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
