-- Migration: Create profiles table and setup auth syncing trigger + seed initial accounts
-- Location: supabase/migrations/20260520222500_auth_schema.sql

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies on profiles
-- Admins can read/write all profiles
CREATE POLICY "Admins have full access on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'email') = 'ramiro@clienthub.com'
);

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Create Trigger Function to sync auth.users with public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id TEXT;
    v_role TEXT;
BEGIN
    -- Check if it matches an existing client email
    SELECT id INTO v_client_id 
    FROM public.clients 
    WHERE LOWER(email) = LOWER(NEW.email) 
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
        v_role := 'client';
    ELSIF LOWER(NEW.email) = 'ramirotecnologia@gmail.com' THEN
        v_role := 'admin';
    ELSE
        v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
        v_client_id := NEW.raw_user_meta_data->>'client_id';
    END IF;

    INSERT INTO public.profiles (id, email, role, client_id)
    VALUES (
        NEW.id,
        NEW.email,
        v_role,
        v_client_id
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        client_id = EXCLUDED.client_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Seed initial accounts in auth.users and let the trigger handle profiles
-- We use pg_crypto to hash the password 'password123' which is '$2a$06$bCjCgV4s6Nn8kR2G55e/be70XF9M37cR29ZqTqg7ePeh3r9a23YhS' (crypt('password123', gen_salt('bf', 6)))

-- Insert Admin: Ramiro
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, recovery_sent_at, last_sign_in_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
    confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'authenticated',
    'authenticated',
    'ramiro@clienthub.com',
    crypt('password123', gen_salt('bf', 6)),
    now(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Force update/creation of profiles for these exact seeded users to ensure they are synchronized 
-- even if the database has pre-existing triggers or if there was any conflict.
INSERT INTO public.profiles (id, email, role, client_id)
VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ramiro@clienthub.com', 'admin', NULL)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, 
    role = EXCLUDED.role, 
    client_id = EXCLUDED.client_id;
