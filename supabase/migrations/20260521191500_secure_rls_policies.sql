-- Migration: Secure all tables with strict Row Level Security (RLS) policies
-- Location: supabase/migrations/20260521191500_secure_rls_policies.sql

-- 1. Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to get the current client_id associated with the user profile
CREATE OR REPLACE FUNCTION public.get_client_id()
RETURNS TEXT AS $$
DECLARE
    v_client_id TEXT;
BEGIN
    SELECT client_id INTO v_client_id 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Drop all previous public policies
DROP POLICY IF EXISTS "Public read clients" ON public.clients;
DROP POLICY IF EXISTS "Public insert clients" ON public.clients;
DROP POLICY IF EXISTS "Public update clients" ON public.clients;

DROP POLICY IF EXISTS "Public read works" ON public.works;
DROP POLICY IF EXISTS "Public insert works" ON public.works;
DROP POLICY IF EXISTS "Public update works" ON public.works;
DROP POLICY IF EXISTS "Public delete works" ON public.works;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.work_types;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.work_types;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.work_types;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.work_types;

DROP POLICY IF EXISTS "Allow public read access" ON public.settings;
DROP POLICY IF EXISTS "Allow public insert access" ON public.settings;
DROP POLICY IF EXISTS "Allow public update access" ON public.settings;

DROP POLICY IF EXISTS "Allow all operations for everyone" ON public.comments;
DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;


-- 4. Enable RLS on all tables (to be absolutely sure)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- 5. Create secure policies for "clients"
-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Clients: SELECT (their own details)
CREATE POLICY "Clients can view their own profile details"
ON public.clients
FOR SELECT
TO authenticated
USING (id = public.get_client_id());


-- 6. Create secure policies for "works"
-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on works"
ON public.works
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Clients: SELECT & UPDATE (their own works, e.g., to approve or request changes)
CREATE POLICY "Clients can select their own works"
ON public.works
FOR SELECT
TO authenticated
USING (client_id = public.get_client_id());

CREATE POLICY "Clients can update their own works status and details"
ON public.works
FOR UPDATE
TO authenticated
USING (client_id = public.get_client_id())
WITH CHECK (client_id = public.get_client_id());


-- 7. Create secure policies for "work_types"
-- Everyone Authenticated: SELECT
CREATE POLICY "Authenticated users can select work types"
ON public.work_types
FOR SELECT
TO authenticated
USING (true);

-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on work types"
ON public.work_types
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- 8. Create secure policies for "settings"
-- Everyone Authenticated: SELECT
CREATE POLICY "Authenticated users can read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (true);

-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on settings"
ON public.settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- 9. Create secure policies for "comments"
-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on comments"
ON public.comments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Clients: ALL (for comments associated with their own client's work pieces)
CREATE POLICY "Clients can select comments for their own works"
ON public.comments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.works
        WHERE public.works.id = public.comments.work_id
          AND public.works.client_id = public.get_client_id()
    )
);

CREATE POLICY "Clients can insert comments on their own works"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.works
        WHERE public.works.id = public.comments.work_id
          AND public.works.client_id = public.get_client_id()
    )
);


-- 10. Create secure policies for "notifications"
-- Admins: FULL ACCESS
CREATE POLICY "Admins have full access on notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Clients: SELECT & UPDATE (their own client_id and recipient 'client')
CREATE POLICY "Clients can read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    client_id = public.get_client_id() 
    AND recipient = 'client'
);

CREATE POLICY "Clients can update their own notifications (e.g. read status)"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    client_id = public.get_client_id() 
    AND recipient = 'client'
)
WITH CHECK (
    client_id = public.get_client_id() 
    AND recipient = 'client'
);


-- 11. Update public.profiles policies (Fix admin validation email restriction)
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;

CREATE POLICY "Admins have full access on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin' 
    OR 
    LOWER(auth.jwt() ->> 'email') = 'ramiro@clienthub.com' 
    OR 
    LOWER(auth.jwt() ->> 'email') = 'ramirotecnologia@gmail.com'
);
