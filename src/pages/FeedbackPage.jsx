import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';
// 1. --- THIS IS THE FIX: Added AnimatePresence to the import ---
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Users, Building, Shield } from 'lucide-react';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

function FeedbackPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [channel, setChannel] = useState('hod');
  const [targetClub, setTargetClub] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [clubs, setClubs] = useState([]);
  const [studentDepartment, setStudentDepartment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = await createClerkSupabaseClient(getToken);
      
      const [profileRes, clubsRes] = await Promise.all([
        supabase.from('profiles').select('department').eq('user_id', user.id).single(),
        supabase.from('clubs').select('id, club_name')
      ]);

      if (profileRes.data) {
        setStudentDepartment(profileRes.data.department);
      }
      if (clubsRes.data) {
        setClubs(clubsRes.data);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user, getToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) {
      toast.error("Please enter your feedback message.");
      return;
    }

    let target_id = null;
    if (channel === 'hod') {
      if (!studentDepartment) {
        toast.error("Your department is not set in your profile. Cannot submit feedback to HOD.");
        return;
      }
      target_id = studentDepartment;
    } else if (channel === 'club') {
      if (!targetClub) {
        toast.error("Please select a club.");
        return;
      }
      target_id = targetClub;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting feedback...');

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase.from('feedback').insert({
        submitter_id: isAnonymous ? null : user.id,
        is_anonymous: isAnonymous,
        channel: channel,
        target_id: target_id,
        message: message,
      });

      if (error) throw error;
      
      toast.success('Thank you for your feedback!', { id: toastId });
      navigate('/student-dashboard');

    } catch (error) {
      console.error("Feedback Submission Error:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Feedback</h1>
        <p className="text-gray-500 mb-8">Your voice matters. Share your thoughts, suggestions, or concerns securely.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who is this feedback for?</label>
            <div className="flex rounded-lg shadow-sm border border-gray-300">
              <button type="button" onClick={() => setChannel('hod')}
                className={`flex-1 py-3 text-sm font-semibold rounded-l-lg transition-colors flex items-center justify-center gap-2 ${channel === 'hod' ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                <Building className="h-5 w-5"/> My HOD
              </button>
              <button type="button" onClick={() => setChannel('club')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors -ml-px flex items-center justify-center gap-2 ${channel === 'club' ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                <Users className="h-5 w-5"/> A Club
              </button>
              <button type="button" onClick={() => setChannel('super_admin')}
                className={`flex-1 py-3 text-sm font-semibold rounded-r-lg transition-colors -ml-px flex items-center justify-center gap-2 ${channel === 'super_admin' ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                <Shield className="h-5 w-5"/> Admin
              </button>
            </div>
          </div>

          {/* This component will now work correctly */}
          <AnimatePresence>
            {channel === 'club' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label htmlFor="targetClub" className="block text-sm font-medium text-gray-700">Select Club</label>
                <select id="targetClub" value={targetClub} onChange={(e) => setTargetClub(e.target.value)} required
                  className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="" disabled>-- Choose a club --</option>
                  {clubs.map(club => <option key={club.id} value={club.id}>{club.club_name}</option>)}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Your Message</label>
            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows="6"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base p-3"
              placeholder="Please be detailed and constructive..."
            />
          </div>

          {channel === 'super_admin' && (
            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input id="isAnonymous" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="isAnonymous" className="font-medium text-gray-900">Submit Anonymously</label>
                <p className="text-gray-500">Your name will not be attached to this feedback.</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.05 }}
              className="inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
              {submitting ? <Spinner /> : <Send className="h-5 w-5" />}
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default FeedbackPage;