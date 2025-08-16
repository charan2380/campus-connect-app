import { useState, useEffect, Fragment, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Loader2, X, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // We need the standard client for realtime

function ChatModal({ isOpen, onClose, recipientId, recipientName }) {
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      const fetchMessages = async () => {
        setLoading(true);
        const supabase = await createClerkSupabaseClient(getToken);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`(sender_id.eq.${currentUser.id},receiver_id.eq.${recipientId}),(sender_id.eq.${recipientId},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          toast.error("Failed to load messages.");
        } else {
          setMessages(data);
        }
        setLoading(false);
      };

      fetchMessages();

      // --- SET UP REALTIME SUBSCRIPTION ---
      // For realtime, we need a standard client that doesn't expire.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabaseRealtimeClient = createClient(supabaseUrl, supabaseAnonKey);

      const channel = supabaseRealtimeClient
        .channel(`messages-${currentUser.id}-${recipientId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUser.id}`, // Only listen for messages sent TO me
          },
          (payload) => {
            // Add the new message to our state
            setMessages((currentMessages) => [...currentMessages, payload.new]);
          }
        )
        .subscribe();
      
      // Cleanup function to remove the subscription when the modal closes
      return () => {
        supabaseRealtimeClient.removeChannel(channel);
      };
    }
  }, [isOpen, currentUser, recipientId, getToken]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessageContent = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: recipientId,
        content: tempMessageContent,
      });

      if (error) {
        // If there was an error, put the message back in the input box
        setNewMessage(tempMessageContent);
        throw error;
      }
      
      // Add our own message to the list immediately (optimistic update)
      const optimisticMessage = {
          id: Date.now(), // temporary key
          sender_id: currentUser.id,
          receiver_id: recipientId,
          content: tempMessageContent,
          created_at: new Date().toISOString()
      };
      setMessages(current => [...current, optimisticMessage]);

    } catch (error) {
      toast.error("Failed to send message.");
      console.error(error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/50" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg h-[70vh] flex flex-col transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold p-4 border-b text-gray-900">
                  Chat with {recipientName}
                </Dialog.Title>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> :
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))
                  }
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 block w-full p-2 rounded-full border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <motion.button type="submit" whileTap={{ scale: 0.95 }} className="bg-indigo-600 text-white p-3 rounded-full">
                    <Send className="h-5 w-5" />
                  </motion.button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ChatModal;