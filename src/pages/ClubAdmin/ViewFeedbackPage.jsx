import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient'; // Adjust path
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Inbox, User } from 'lucide-react';

const FeedbackCard = ({ feedback, index }) => (
    // ... (This component is identical to the one in the HOD file)
  <motion.li initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-3">
        {feedback.is_anonymous ? (<div className="italic text-gray-500 text-sm font-medium">Anonymous Submission</div>) : (<div className="flex items-center gap-2 text-sm font-medium text-gray-800"><User className="h-4 w-4 text-gray-400"/><span>{feedback.profile?.full_name || 'Student'}</span></div>)}
    </div>
    <p className="text-gray-700">{feedback.message}</p>
    <p className="text-xs text-gray-400 mt-4 text-right">Submitted on {new Date(feedback.created_at).toLocaleString()}</p>
  </motion.li>
);

function ClubAdminViewFeedbackPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      // RLS ensures Club Admins only get feedback for their club.
      const { data, error } = await supabase
        .from('feedback')
        .select(`*, profile:profiles!feedback_submitter_id_fkey(full_name)`)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Failed to load feedback.");
      } else {
        setFeedback(data);
      }
      setLoading(false);
    };
    fetchFeedback();
  }, [getToken]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Club Feedback</h1>
        <p className="mt-2 text-lg text-gray-600">Feedback submitted by students for your club.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : feedback.length > 0 ? (
        <ul role="list" className="space-y-4">
          {feedback.map((item, index) => <FeedbackCard key={item.id} feedback={item} index={index} />)}
        </ul>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
           <Inbox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-700">Inbox is Clear</h3>
          <p className="mt-1 text-gray-500">There is no new feedback for your club at this time.</p>
        </div>
      )}
    </motion.div>
  );
}

export default ClubAdminViewFeedbackPage;