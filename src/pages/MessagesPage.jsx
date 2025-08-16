import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Send, MessageSquare, ArrowLeft } from 'lucide-react';

function MessagesPage() {
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const { recipientId: initialRecipientId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // --- FIX 1: Stabilize the Supabase client ---
  const [supabase, setSupabase] = useState(null);
  useEffect(() => {
    const initializeClient = async () => {
        if(getToken) {
            const client = await createClerkSupabaseClient(getToken);
            setSupabase(client);
        }
    };
    initializeClient();
  }, [getToken]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const fetchConversations = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_conversations');
    if (error) {
      toast.error("Failed to load conversations.");
    } else {
      setConversations(data);
      if (initialRecipientId) {
        const matchingConvo = data.find(c => c.other_user_id === initialRecipientId);
        if (matchingConvo) {
            setSelectedConversation(matchingConvo);
        } else {
            const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('user_id', initialRecipientId).single();
            if (profile) {
                setSelectedConversation({ other_user_id: initialRecipientId, other_user_name: profile.full_name, other_user_avatar: profile.avatar_url, last_message: "Start a new conversation..." });
            }
        }
      }
    }
    setLoading(false);
  }, [supabase, initialRecipientId]);

  useEffect(() => {
    if (supabase) {
        fetchConversations();
    }
  }, [fetchConversations, supabase]);

  // --- FIX 2 & 3: Robust Message Fetching and Realtime Subscription ---
  useEffect(() => {
    if (!selectedConversation || !supabase || !currentUser) return;

    // Fetch initial messages for the selected conversation
    const fetchMessages = async () => {
        const recipientId = selectedConversation.other_user_id;
        // This is a much cleaner query
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .in('sender_id', [currentUser.id, recipientId])
            .in('receiver_id', [currentUser.id, recipientId])
            .order('created_at', { ascending: true });

        if (error) {
            toast.error("Failed to load messages.");
        } else {
            setMessages(data);
        }
    };
    fetchMessages();

    // Set up the Realtime subscription
    const channel = supabase
      .channel(`messages-realtime`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Check if the new message is part of the current conversation
          const newMessage = payload.new;
          const isForMe = newMessage.receiver_id === currentUser.id && newMessage.sender_id === selectedConversation.other_user_id;
          const isFromMe = newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedConversation.other_user_id;

          if (isForMe || isFromMe) {
            // Check for duplicates before adding (handles optimistic update)
            setMessages(current => current.find(m => m.id === newMessage.id) ? current : [...current, newMessage]);
          } else if (newMessage.receiver_id === currentUser.id) {
            toast.success(`New message from another user!`);
            fetchConversations(); // Refresh conversation list to show new message
          }
        }
      )
      .subscribe();
    
    // Cleanup function to remove the channel subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, supabase, currentUser, fetchConversations]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !supabase) return;
    setIsSending(true);
    const tempMessageContent = newMessage;
    setNewMessage('');

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedConversation.other_user_id,
        content: tempMessageContent,
      }).select().single(); // select() to get the inserted row back

      if (error) throw error;
      
      // The realtime subscription will now handle adding the message,
      // making optimistic updates unnecessary and preventing duplicates.

      if (messages.length === 0) {
          fetchConversations();
      }
    } catch (error) {
      setNewMessage(tempMessageContent);
      toast.error("Failed to send message.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-lg">
      <div className={`w-full md:w-1/3 border-r ${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
        <div className="p-4 border-b"><h2 className="text-xl font-bold">Conversations</h2></div>
        {loading ? <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin" /></div> :
          <ul className="flex-1 overflow-y-auto">
            {conversations.map(convo => (
              <li key={convo.other_user_id} onClick={() => { setSelectedConversation(convo); navigate(`/messages/${convo.other_user_id}`, { replace: true })}} className={`p-4 cursor-pointer hover:bg-indigo-50 ${selectedConversation?.other_user_id === convo.other_user_id ? 'bg-indigo-100' : ''}`}>
                <div className="flex items-center gap-3"><img src={convo.other_user_avatar || `https://ui-avatars.com/api/?name=${convo.other_user_name}`} className="h-10 w-10 rounded-full object-cover"/><div className="flex-1 overflow-hidden"><p className="font-semibold truncate">{convo.other_user_name}</p><p className="text-sm text-gray-500 truncate">{convo.last_message}</p></div></div>
              </li>
            ))}
          </ul>
        }
      </div>
      <div className={`w-full md:w-2/3 ${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col`}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100"><ArrowLeft /></button>
              <img src={selectedConversation.other_user_avatar || `https://ui-avatars.com/api/?name=${selectedConversation.other_user_name}`} className="h-10 w-10 rounded-full object-cover"/>
              <h2 className="text-xl font-bold">{selectedConversation.other_user_name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2 bg-white">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 block w-full p-2 rounded-full border-gray-300 shadow-sm focus:border-indigo-500"/>
              <motion.button type="submit" disabled={isSending} whileTap={{ scale: 0.95 }} className="bg-indigo-600 text-white p-3 rounded-full disabled:bg-indigo-300"><Send className="h-5 w-5" /></motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-500"><MessageSquare className="h-16 w-16 mb-4"/><p className="text-lg">Select a conversation to start chatting.</p></div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;