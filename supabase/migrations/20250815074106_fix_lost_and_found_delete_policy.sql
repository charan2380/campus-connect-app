-- 1. DROP the old, flawed policies to avoid conflicts.
DROP POLICY IF EXISTS "Allow users to delete their own items" ON public.lost_and_found_items;
DROP POLICY IF EXISTS "Allow Super Admins to delete any item" ON public.lost_and_found_items; -- In case a similar one was added

-- 2. CREATE the new, single, correct policy for DELETE.
CREATE POLICY "Allow deletion by owner or Super Admin"
ON public.lost_and_found_items
FOR DELETE
TO authenticated
USING (
  -- Condition 1: The user is the owner of the item.
  (requesting_user_id() = user_id) 
  OR 
  -- Condition 2: The user's role in their JWT is 'super_admin'.
  ((current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'super_admin')
);