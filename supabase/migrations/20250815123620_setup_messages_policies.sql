-- Enable Row Level Security on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Allow users to INSERT a message where they are the sender.
CREATE POLICY "Allow users to send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK ( sender_id = public.requesting_user_id() );

-- 2. Allow users to SELECT (read) messages where they are EITHER the sender OR the receiver.
--    This is the core policy that makes conversations private.
CREATE POLICY "Allow users to view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING ( sender_id = public.requesting_user_id() OR receiver_id = public.requesting_user_id() );