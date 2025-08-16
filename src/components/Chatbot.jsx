import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, User, Loader2, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import createClerkSupabaseClient from '../supabaseClient'; // We need this for the upload part

function Chatbot() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me a question or upload a PDF to summarize.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- THIS IS THE UPGRADED FILE UPLOAD HANDLER ---
  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file || file.type !== 'application/pdf') {
          toast.error("Please select a PDF file.");
          return;
      }
      
      const userMessage = { role: 'user', content: `Please summarize this document: ${file.name}` };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const supabase = await createClerkSupabaseClient(getToken);
        const filePath = `${user.id}/pdfs/${Date.now()}-${file.name}`;
        
        // 1. Upload the PDF to our secure, private bucket
        const { error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(filePath, file);
            
        if (uploadError) throw new Error(`PDF Upload Failed: ${uploadError.message}`);

        // 2. Call our new Edge Function with the path to the uploaded file
        const { data, error: summaryError } = await supabase.functions.invoke('summarize-pdf', {
            body: { filePath },
        });

        if (summaryError) throw new Error(summaryError.message);
        if (data.error) throw new Error(data.error);

        const aiResponse = { role: 'assistant', content: data.summary };
        setMessages(prev => [...prev, aiResponse]);

      } catch (error) {
        console.error("PDF Summarization Error:", error);
        toast.error(error.message);
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I was unable to summarize that document." }]);
      } finally {
        setIsLoading(false);
      }

      // Reset file input so the same file can be uploaded again
      event.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await getToken({ template: 'supabase' });
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-ai-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prompt: input }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response.');
      }

      const aiResponse = { role: 'assistant', content: data.text };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      toast.error(error.message);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button onClick={() => setIsOpen(true)} whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-50">
        <Bot className="h-6 w-6" />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-6 w-[90vw] max-w-md h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
            <header className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full"><Bot className="h-6 w-6 text-indigo-600"/></div>
                <h3 className="font-bold text-lg">Campus Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 items-center justify-center flex"><Bot className="h-5 w-5 text-gray-600"/></div>}
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.content}
                  </div>
                   {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 items-center justify-center flex"><User className="h-5 w-5 text-gray-600"/></div>}
                </div>
              ))}
              {isLoading && <div className="flex justify-start gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div><div className="px-4 py-2"><Loader2 className="animate-spin text-gray-500"/></div></div>}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t flex items-center gap-2 bg-gray-50">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
              <button type="button" onClick={() => fileInputRef.current.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-indigo-600 disabled:text-gray-300">
                  <Paperclip className="h-5 w-5" />
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..."
                className="flex-1 block w-full p-2 rounded-full border-gray-300 shadow-sm focus:border-indigo-500" disabled={isLoading}/>
              <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.95 }} className="bg-indigo-600 text-white p-3 rounded-full disabled:bg-indigo-300">
                <Send className="h-5 w-5" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Chatbot;