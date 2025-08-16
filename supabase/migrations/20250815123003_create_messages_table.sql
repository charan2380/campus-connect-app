-- Create the messages table to store one-on-one chat messages
CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  receiver_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- A conversation is uniquely identified by the pair of participants.
  -- This constraint helps with indexing and data integrity.
  CONSTRAINT conversation_pair CHECK (sender_id IS NOT NULL AND receiver_id IS NOT NULL)
);

-- Create an index for quickly fetching conversations between two users
CREATE INDEX idx_messages_conversation ON public.messages (sender_id, receiver_id);