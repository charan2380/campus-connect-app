import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Inbox, User } from 'lucide-react';

const FeedbackCard = ({ feedback, index }) => (
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
  const { user } = useUser();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState(''); // New state for club name

  const fetchFeedback = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);

    try {
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('id, club_name')
            .eq('club_admin_id', user.id)
            .single();

        if (clubError) {
            if (clubError.code === 'PGRST116') {
                toast.error("You are not assigned to a club.");
                setFeedback([]);
            } else {
               throw clubError;
            }
            return;
        }

        setClubName(clubData.club_name);

        const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select(`*, profile:profiles!feedback_submitter_id_fkey(full_name)`)
            .eq('channel', 'club')
            .eq('target_id', clubData.id)
            .order('created_at', { ascending: false });
        
        if (feedbackError) throw feedbackError;

        setFeedback(feedbackData);

    } catch (error) {
        toast.error("Failed to load feedback.");
        console.error("Fetch Feedback Error:", error);
    } finally {
        setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Club Feedback</h1>
        <p className="mt-2 text-lg text-gray-600">
            Feedback submitted by students for <span className="font-semibold text-indigo-600">{clubName}</span>.
        </p>
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