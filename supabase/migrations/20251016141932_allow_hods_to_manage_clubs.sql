-- 1. Drop the old policy that was exclusive to Super Admins.
DROP POLICY IF EXISTS "Allow Super Admins full control over clubs" ON public.clubs;

-- 2. Create the new, more inclusive policy.
--    This allows both Super Admins AND HODs to have full control (Create, Update, Delete) over clubs.
CREATE POLICY "Allow Admins and HODs to manage clubs"
ON public.clubs
FOR ALL -- Applies to INSERT, UPDATE, DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) IN ('super_admin', 'hod')
);