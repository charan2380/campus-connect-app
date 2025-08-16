import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Inbox, User, Sparkles, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

// --- NEW COMPONENT: SummaryModal ---
const SummaryModal = ({ isOpen, onClose, summary, isLoading }) => (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2"><Sparkles className="h-6 w-6 text-indigo-500" />AI-Generated Summary</Dialog.Title>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
                <div className="mt-4 prose max-w-none">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
);


const FeedbackCard = ({ feedback, index }) => (
    <motion.li initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
            {feedback.is_anonymous ? (<div className="italic text-gray-500 text-sm font-medium">Anonymous Submission</div>) : (<div className="flex items-center gap-2 text-sm font-medium text-gray-800"><User className="h-4 w-4 text-gray-400"/><span>{feedback.profile?.full_name || 'Student'}</span></div>)}
        </div>
        <p className="text-gray-700">{feedback.message}</p>
        <p className="text-xs text-gray-400 mt-4 text-right">Submitted on {new Date(feedback.created_at).toLocaleString()}</p>
    </motion.li>
);

function HodViewFeedbackPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR SUMMARY MODAL ---
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase
        .from('feedback')
        .select(`*, profile:profiles!feedback_submitter_id_fkey(full_name)`)
        .order('created_at', { ascending: false });
      if (error) { toast.error("Failed to load feedback."); } else { setFeedback(data); }
      setLoading(false);
    };
    fetchFeedback();
  }, [getToken]);

  // --- NEW FUNCTION TO HANDLE SUMMARIZATION ---
  const handleSummarize = async () => {
      if (feedback.length === 0) {
          toast.error("There is no feedback to summarize.");
          return;
      }
      setIsSummaryModalOpen(true);
      setIsSummarizing(true);
      
      try {
          const allMessages = feedback.map(f => f.message).join("\n---\n");
          const prompt = `Based on the following student feedback entries, please provide a concise summary. Identify the key positive themes, the main points of criticism or concern, and any actionable suggestions. Keep it brief and well-structured:\n\n${allMessages}`;
          
          const token = await getToken({ template: 'supabase' });
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-ai-chat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ prompt }),
            }
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to get summary.');

          setSummary(data.text);

      } catch (error) {
          toast.error(error.message);
          setSummary("Could not generate a summary at this time.");
      } finally {
          setIsSummarizing(false);
      }
  };

  return (
    <>
      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummarizing} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Department Feedback</h1>
              <p className="mt-2 text-lg text-gray-600">Feedback submitted by students in your department.</p>
            </div>
            {/* --- THE NEW SUMMARY BUTTON --- */}
            <motion.button onClick={handleSummarize} disabled={loading || feedback.length === 0}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-5 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300">
              <Sparkles className="h-5 w-5" />
              Summarize Feedback
            </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : feedback.length > 0 ? (
          <ul role="list" className="space-y-4">
            {feedback.map((item, index) => <FeedbackCard key={item.id} feedback={item} index={index} />)}
          </ul>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <Inbox className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-xl font-semibold text-gray-700">Inbox is Clear</h3><p className="mt-1 text-gray-500">No new feedback from students.</p>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default HodViewFeedbackPage;