-- ==============================================================================
-- Intellistrata Community Portal — Predefined Dummy/Test Users Seed Script
-- File: supabase/seed/seed_dummy_users.sql
--
-- CAUTION:
--   - This script is strictly for LOCAL DEVELOPMENT and DEV Supabase environments.
--   - DO NOT run this script in production environments.
--   - Default development password for all test accounts: "TestPass123!"
-- ==============================================================================

-- 1. Ensure pgcrypto is enabled for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Clean up any existing instances of test users to ensure a clean insert
DELETE FROM auth.identities WHERE user_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
) OR identity_data->>'email' IN (
  'resident.owner@intellistrata.test',
  'committee.member@intellistrata.test',
  'strata.manager@intellistrata.test'
);

DELETE FROM auth.users WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
) OR email IN (
  'resident.owner@intellistrata.test',
  'committee.member@intellistrata.test',
  'strata.manager@intellistrata.test'
);

-- 3. Provision test users
DO $$
DECLARE
  v_default_password_hash text := extensions.crypt('TestPass123!', extensions.gen_salt('bf'));
BEGIN
  -- 1. Resident Owner Test User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'resident.owner@intellistrata.test',
    v_default_password_hash,
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Pasan Udara", "name": "Pasan Udara", "role": "Resident Owner", "unit": "101"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 2. Strata Committee Member Test User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'committee.member@intellistrata.test',
    v_default_password_hash,
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Alice Smith", "name": "Alice Smith", "role": "Strata Committee Member", "unit": "205"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 3. Strata Manager Test User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a3333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'strata.manager@intellistrata.test',
    v_default_password_hash,
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Admin Manager", "name": "Admin Manager", "role": "Strata Manager", "unit": "100"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 4. Corresponding identities entries (required by Supabase GoTrue for email sign-in)
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{"sub":"a1111111-1111-1111-1111-111111111111","email":"resident.owner@intellistrata.test"}'::jsonb, 'email', NOW(), NOW(), NOW()),
    ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '{"sub":"a2222222-2222-2222-2222-222222222222","email":"committee.member@intellistrata.test"}'::jsonb, 'email', NOW(), NOW(), NOW()),
    ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '{"sub":"a3333333-3333-3333-3333-333333333333","email":"strata.manager@intellistrata.test"}'::jsonb, 'email', NOW(), NOW(), NOW());

END $$;
