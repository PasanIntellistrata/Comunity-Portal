/**
 * Utility script to provision test dummy users using the Supabase Admin API.
 * Useful for development and staging Supabase instances.
 *
 * Usage:
 *   SUPABASE_URL=https://your-dev-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node supabase/seed/create-test-users.js
 *
 * NOTE: NEVER hardcode or commit the SUPABASE_SERVICE_ROLE_KEY into this file or git.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  console.error('Example:');
  console.error('  SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node supabase/seed/create-test-users.js');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = [
  {
    email: 'resident.owner@intellistrata.test',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    user_metadata: {
      full_name: 'Pasan Udara',
      name: 'Pasan Udara',
      unit: '101',
      role: 'Resident Owner',
    },
  },
  {
    email: 'committee.member@intellistrata.test',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    user_metadata: {
      full_name: 'Alice Smith',
      name: 'Alice Smith',
      unit: '205',
      role: 'Strata Committee Member',
    },
  },
  {
    email: 'strata.manager@intellistrata.test',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    user_metadata: {
      full_name: 'Admin Manager',
      name: 'Admin Manager',
      unit: '100',
      role: 'Strata Manager',
    },
  },
];

async function seedUsers() {
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);

  for (const user of TEST_USERS) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata,
      });

      if (error) {
        if (error.message && error.message.includes('already been registered')) {
          console.log(`ℹ️ User ${user.email} already exists. Skipping.`);
        } else {
          console.error(`❌ Failed to create ${user.email}:`, error.message);
        }
      } else {
        console.log(`✅ Created test user: ${user.email} (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Exception creating ${user.email}:`, err.message);
    }
  }

  console.log('Seeding process complete.');
}

seedUsers();
