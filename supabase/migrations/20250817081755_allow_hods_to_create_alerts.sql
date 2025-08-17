-- 1. Drop the old policy that only allowed Super Admins to manage alerts.
DROP POLICY IF EXISTS "Allow Super Admins full control over alerts" ON public.alerts;

-- 2. Create the new, more flexible policy for managing alerts.
--    This allows BOTH Super Admins AND HODs to create, update, and delete alerts.
CREATE POLICY "Allow Admins and HODs to manage alerts"
ON public.alerts
FOR ALL -- Applies to INSERT, UPDATE, DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) IN ('super_admin', 'hod')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) IN ('super_admin', 'hod')
);