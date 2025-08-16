-- Enable Row Level Security on the lost_and_found_items table
ALTER TABLE public.lost_and_found_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow any authenticated user to view all items.
-- This is a public feed, so anyone who is logged in can see everything.
CREATE POLICY "Allow authenticated users to view all items"
ON public.lost_and_found_items
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow any authenticated user to report a new item.
-- The user_id for the new item will be set automatically by our frontend code.
CREATE POLICY "Allow authenticated users to insert items"
ON public.lost_and_found_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow a user to delete ONLY their own items.
-- This is a critical security rule. It checks if the user's ID matches the user_id of the row they are trying to delete.
CREATE POLICY "Allow users to delete their own items"
ON public.lost_and_found_items
FOR DELETE
TO authenticated
USING ( requesting_user_id() = user_id );