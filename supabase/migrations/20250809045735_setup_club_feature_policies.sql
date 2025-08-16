-- Enable RLS for all three tables
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-----------------------
-- POLICIES for 'clubs'
-----------------------
-- 1. Anyone logged in can see the list of clubs.
CREATE POLICY "Allow authenticated users to view clubs"
ON public.clubs FOR SELECT TO authenticated USING (true);

-- 2. Only Super Admins can create, update, or delete clubs.
CREATE POLICY "Allow Super Admins full control over clubs"
ON public.clubs FOR ALL TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );


---------------------------
-- POLICIES for 'club_posts'
---------------------------
-- 1. Anyone logged in can see all club posts and events.
CREATE POLICY "Allow authenticated users to view club posts"
ON public.club_posts FOR SELECT TO authenticated USING (true);

-- 2. Allow Club Admins to insert posts FOR THEIR OWN CLUB.
CREATE POLICY "Allow Club Admins to insert posts for their club"
ON public.club_posts FOR INSERT TO authenticated
WITH CHECK (
  (SELECT club_admin_id FROM public.clubs WHERE id = club_id) = public.requesting_user_id()
);

-- 3. --- THIS IS THE CORRECTED SECTION ---
--    Policy for UPDATE operations.
CREATE POLICY "Allow Club Admins to update their own club posts"
ON public.club_posts FOR UPDATE TO authenticated
USING (
  (SELECT club_admin_id FROM public.clubs WHERE id = club_id) = public.requesting_user_id()
);

-- 4. Policy for DELETE operations.
CREATE POLICY "Allow Club Admins to delete their own club posts"
ON public.club_posts FOR DELETE TO authenticated
USING (
  (SELECT club_admin_id FROM public.clubs WHERE id = club_id) = public.requesting_user_id()
);
-- --- END OF CORRECTION ---


------------------------------------
-- POLICIES for 'event_registrations'
------------------------------------
-- 1. Students can insert a registration FOR THEMSELVES.
CREATE POLICY "Allow students to register for events"
ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK ( student_id = public.requesting_user_id() );

-- 2. Students can view (and delete) THEIR OWN registrations.
--    (Corrected to be two separate policies for clarity and correctness)
CREATE POLICY "Allow students to view their own registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING ( student_id = public.requesting_user_id() );

CREATE POLICY "Allow students to delete their own registrations"
ON public.event_registrations FOR DELETE TO authenticated
USING ( student_id = public.requesting_user_id() );


-- 3. Club Admins can view registrations for events BELONGING TO THEIR CLUB.
CREATE POLICY "Allow Club Admins to view their event registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM club_posts p
    JOIN clubs c ON p.club_id = c.id
    WHERE p.id = event_registrations.post_id AND c.club_admin_id = public.requesting_user_id()
  )
);