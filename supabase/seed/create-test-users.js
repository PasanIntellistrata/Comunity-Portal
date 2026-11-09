/**
 * Intellistrata Community Portal — Safe User Provisioning Script
 * File: supabase/seed/create-test-users.js
 *
 * Requirements & Security Guarantees:
 * - Uses the official Supabase JavaScript client Auth Admin API (`supabaseAdmin.auth.admin`).
 * - Never inserts passwords directly into database tables.
 * - Safe to rerun: inspects existing users via `listUsers()` and skips existing accounts without resetting passwords.
 * - Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from local env files (.env.seed.local / .env.seed / .env.local).
 * - Never prints passwords, tokens, or secret keys to console output.
 * - Preserves internal User ID, Property ID, Lot ID, and role mappings in `user-mapping.json`.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// ---------- Safe Local Environment Loader ----------

function loadEnvFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.substring(0, eqIdx).trim();
      let val = line.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Check local env files in order of security preference (all ignored by Git)
const envCandidateFiles = [
  path.join(projectRoot, '.env.seed.local'),
  path.join(projectRoot, '.env.seed'),
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '.env'),
];

for (const envPath of envCandidateFiles) {
  loadEnvFileIfExists(envPath);
}

// ---------- Environment & Credentials Validation ----------

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testPassword = process.env.TEST_USER_PASSWORD || 'TestPass123!';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ [Error] Missing required Supabase credentials for admin provisioning.');
  console.error('─────────────────────────────────────────────────────────────────────────────');
  console.error('To run this provisioning script safely without exposing secret keys:');
  console.error('1. Copy the seed template to a private local file (gitignored):');
  console.error('     cp .env.seed.example .env.seed.local');
  console.error('2. Open `.env.seed.local` and set your `SUPABASE_SERVICE_ROLE_KEY`:');
  console.error('     SUPABASE_URL=' + (supabaseUrl || 'https://your-project.supabase.co'));
  console.error('     SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key');
  console.error('3. Re-run the provisioning script:');
  console.error('     npm run seed:users');
  console.error('─────────────────────────────────────────────────────────────────────────────\n');
  process.exit(1);
}

// Ensure key is NOT accidentally a publishable anon key
if (serviceRoleKey.startsWith('sb_publishable_') || serviceRoleKey.startsWith('anon_')) {
  console.error('\n⚠️ [Error] The provided SUPABASE_SERVICE_ROLE_KEY appears to be an Anonymous or Publishable key.');
  console.error('The Auth Admin API requires the Supabase Service Role Key (secret).');
  console.error('Obtain it from Supabase Dashboard -> Project Settings -> API -> `service_role (secret)`.\n');
  process.exit(1);
}

// ---------- Supabase Admin Client Initialization ----------

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ---------- Load Structured User Mapping ----------

const mappingFilePath = path.join(__dirname, 'user-mapping.json');
if (!fs.existsSync(mappingFilePath)) {
  console.error(`\n❌ [Error] User mapping file not found at: ${mappingFilePath}\n`);
  process.exit(1);
}

let predefinedUsers = [];
try {
  predefinedUsers = JSON.parse(fs.readFileSync(mappingFilePath, 'utf-8'));
} catch (e) {
  console.error('\n❌ [Error] Failed to parse user-mapping.json:', e.message);
  process.exit(1);
}

// ---------- Repeatable Provisioning Execution ----------

async function provisionTestUsers() {
  console.log('\n=============================================================================');
  console.log(' Intellistrata Community Portal — Predefined Test Users Provisioning');
  console.log('=============================================================================');
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  console.log(`📋 Total users in predefined mapping: ${predefinedUsers.length}`);

  let existingUsersMap = new Map();

  try {
    // Inspect existing users using the official Admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      console.error('❌ Failed to query existing users from Supabase Auth:', error.message);
      process.exit(1);
    }
    for (const u of data.users || []) {
      if (u.email) {
        existingUsersMap.set(u.email.toLowerCase().trim(), u);
      }
    }
    console.log(`🔍 Discovered ${existingUsersMap.size} existing account(s) in Supabase Auth.\n`);
  } catch (err) {
    console.error('❌ Exception querying existing users:', err.message);
    process.exit(1);
  }

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of predefinedUsers) {
    const email = (user.email || '').trim().toLowerCase();
    if (!email) {
      console.warn(`⚠️ Skipping entry with missing email: ${JSON.stringify(user)}`);
      continue;
    }

    const username = user.username || email.split('@')[0];
    const role = user.role || 'Resident Owner';
    const unit = user.unit || '101';
    const fullName = user.name || 'Resident';

    // Check if user already exists
    if (existingUsersMap.has(email)) {
      const existing = existingUsersMap.get(email);
      console.log(`ℹ️  [ALREADY EXISTS] ${email} (Username: "${username}") — ID: ${existing.id}`);
      console.log(`    ↳ Skipped to prevent unexpected password reset.`);
      skippedCount++;
      continue;
    }

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          unit,
          role,
          username,
        },
      });

      if (error) {
        if (error.message && error.message.includes('already been registered')) {
          console.log(`ℹ️  [ALREADY EXISTS] ${email} (Username: "${username}")`);
          console.log(`    ↳ Skipped to prevent unexpected password reset.`);
          skippedCount++;
        } else {
          console.error(`❌ [FAILED] Could not create ${email}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ [CREATED] ${email} (Username: "${username}") — ID: ${data.user.id}`);
        console.log(`    ↳ Role: ${role} | Unit: ${unit}`);
        createdCount++;
      }
    } catch (err) {
      console.error(`❌ [EXCEPTION] ${email}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=============================================================================');
  console.log(' Provisioning Summary');
  console.log('=============================================================================');
  console.log(`  Total users in plan: ${predefinedUsers.length}`);
  console.log(`  Newly created:       ${createdCount}`);
  console.log(`  Already existing:    ${skippedCount} (preserved without modifying passwords)`);
  console.log(`  Errors / Failures:   ${errorCount}`);
  console.log('=============================================================================\n');

  if (errorCount === 0) {
    console.log('✨ All predefined test users are provisioned and ready for login.');
    console.log('ℹ️  You can log in at http://localhost:5173/login using either the email or username.');
  } else {
    console.log('⚠️ Some accounts could not be provisioned. Check the error log above.');
  }
}

provisionTestUsers();
