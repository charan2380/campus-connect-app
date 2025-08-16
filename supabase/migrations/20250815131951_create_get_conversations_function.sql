-- This function retrieves a list of conversations for the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
    other_user_id TEXT,
    other_user_name TEXT,
    other_user_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH conversations AS (
        SELECT
            DISTINCT ON (
                CASE
                    WHEN sender_id = public.requesting_user_id() THEN receiver_id
                    ELSE sender_id
                END
            )
            CASE
                WHEN sender_id = public.requesting_user_id() THEN receiver_id
                ELSE sender_id
            END AS other_user_id,
            id,
            content,
            created_at
        FROM
            public.messages
        WHERE
            sender_id = public.requesting_user_id() OR receiver_id = public.requesting_user_id()
        ORDER BY
            other_user_id, created_at DESC
    )
    SELECT
        c.other_user_id,
        p.full_name AS other_user_name,
        p.avatar_url AS other_user_avatar,
        c.content AS last_message,
        c.created_at AS last_message_time
    FROM
        conversations c
    JOIN
        public.profiles p ON c.other_user_id = p.user_id
    ORDER BY
        c.created_at DESC;
$$;