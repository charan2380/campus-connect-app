-- Enable Row Level Security on the medication_requests table
ALTER TABLE public.medication_requests ENABLE ROW LEVEL SECURITY;

-----------------------------
-- POLICIES FOR STUDENTS --
-----------------------------

-- 1. Students can create requests for themselves.
CREATE POLICY "Allow students to insert their own medication requests"
ON public.medication_requests
FOR INSERT
TO authenticated
WITH CHECK ( student_id = public.requesting_user_id() );

-- 2. Students can ONLY view their own past requests.
CREATE POLICY "Allow students to view their own medication requests"
ON public.medication_requests
FOR SELECT
TO authenticated
USING ( student_id = public.requesting_user_id() );


-------------------------
-- POLICIES FOR HODs --
-------------------------

-- 3. HODs can view requests from students in their own department.
--    This policy uses a subquery to check the HOD's department from their profile.
CREATE POLICY "Allow HODs to view requests for their department"
ON public.medication_requests
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'hod'
  AND
  hod_department = (SELECT department FROM public.profiles WHERE user_id = public.requesting_user_id())
);

-- 4. HODs can update the status of requests for their department.
CREATE POLICY "Allow HODs to update requests for their department"
ON public.medication_requests
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'hod'
  AND
  hod_department = (SELECT department FROM public.profiles WHERE user_id = public.requesting_user_id())
);


--------------------------------
-- POLICIES FOR SUPER ADMINS --
--------------------------------

-- 5. Super Admins have unrestricted access for moderation.
CREATE POLICY "Allow Super Admins full access"
ON public.medication_requests
FOR ALL -- This applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );