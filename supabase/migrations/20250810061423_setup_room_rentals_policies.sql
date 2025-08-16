-- Enable Row Level Security on the room_rentals table
ALTER TABLE public.room_rentals ENABLE ROW LEVEL SECURITY;

-- 1. Any authenticated user can create a listing for themselves.
--    We are assuming all authenticated users for now are students.
--    We can tighten this to check the 'student' role if needed later.
CREATE POLICY "Allow authenticated users to insert listings"
ON public.room_rentals
FOR INSERT
TO authenticated
WITH CHECK ( user_id = public.requesting_user_id() );

-- 2. Any authenticated user can view all listings.
CREATE POLICY "Allow authenticated users to view all listings"
ON public.room_rentals
FOR SELECT
TO authenticated
USING (true);

-- 3. Users can ONLY delete listings they have personally created.
CREATE POLICY "Allow users to delete their own listings"
ON public.room_rentals
FOR DELETE
TO authenticated
USING ( user_id = public.requesting_user_id() );

-- 4. Super Admins can delete any listing for moderation purposes.
--    (This is a good safety net to include for any user-generated content)
CREATE POLICY "Allow super admins to delete any listing"
ON public.room_rentals
FOR DELETE
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );