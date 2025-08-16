-- Enable Row Level Security on the feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-----------------------------
-- POLICIES FOR STUDENTS --
-----------------------------

-- 1. Any authenticated user can submit feedback.
CREATE POLICY "Allow authenticated users to insert feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Students can ONLY view the feedback they have personally submitted.
CREATE POLICY "Allow users to view their own submitted feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING ( submitter_id = public.requesting_user_id() );


-------------------------
-- POLICCIES FOR ADMINS --
-------------------------

-- 3. HODs can view feedback submitted to the 'hod' channel for their specific department.
CREATE POLICY "Allow HODs to view feedback for their department"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  channel = 'hod' AND
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'hod' AND
  target_id = (SELECT department FROM public.profiles WHERE user_id = public.requesting_user_id())
);

-- 4. Club Admins can view feedback submitted to the 'club' channel for their specific club.
CREATE POLICY "Allow Club Admins to view feedback for their club"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  channel = 'club' AND
  target_id::bigint IN (SELECT id FROM public.clubs WHERE club_admin_id = public.requesting_user_id())
);


-- 5. --- THIS IS THE CORRECTED SECTION ---
--    Policy for Super Admin SELECT (read) operations.
CREATE POLICY "Allow Super Admins to view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );

-- 6. Policy for Super Admin DELETE operations.
CREATE POLICY "Allow Super Admins to delete any feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );
-- --- END OF CORRECTION ---