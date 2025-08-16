-- Enable Row Level Security on the alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 1. Allow any authenticated user to VIEW active alerts.
--    This is the rule that lets students, HODs, etc., see the notifications.
CREATE POLICY "Allow authenticated users to view active alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING ( is_active = true );

-- 2. ONLY allow Super Admins to do everything else (create, update, delete).
--    This single policy gives them full control to manage alerts.
CREATE POLICY "Allow Super Admins full control over alerts"
ON public.alerts
FOR ALL -- Applies to INSERT, UPDATE, DELETE
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' )
WITH CHECK ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );