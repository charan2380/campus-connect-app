-- This policy allows any user with the 'hod' role to view all event registrations.
-- This is necessary for them to fulfill their oversight duties.
CREATE POLICY "Allow HODs to view all event registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'hod' );