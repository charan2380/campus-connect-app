import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, AlertCircle, FileText, MapPin } from 'lucide-react';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

function MedicationRequestPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // --- STATE HAS BEEN UPDATED FOR NEW FIELDS ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  // --- END OF STATE UPDATE ---

  const [studentDepartment, setStudentDepartment] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase
        .from('profiles')
        .select('department')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        toast.error("Could not fetch your profile details.");
        console.error(error);
      } else if (data && data.department) {
        setStudentDepartment(data.department);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user, getToken]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please fill in the title and description.');
      return;
    }
    if (!studentDepartment) {
      toast.error('Your department is not set in your profile. Please update it first.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting request...');

    try {
      const supabase = await createClerkSupabaseClient(getToken);

      // --- SUBMISSION LOGIC UPDATED WITH NEW FIELDS ---
      const { error } = await supabase.from('medication_requests').insert({
        student_id: user.id,
        title: title,
        description: description,
        location: location,
        hod_department: studentDepartment,
      });
      // --- END OF SUBMISSION UPDATE ---

      if (error) throw error;
      
      toast.success('Request submitted successfully!', { id: toastId });
      navigate('/my-requests');

    } catch (error) {
      console.error("Medication Request Error:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loadingProfile) {
      return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication Request</h1>
        <p className="text-gray-500 mb-8">This request will be sent securely to the Head of your department ({studentDepartment || 'N/A'}).</p>
        
        {!studentDepartment && (
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-r-lg mb-6" role="alert">
                <div className="flex items-center">
                    <AlertCircle className="h-6 w-6 mr-3" />
                    <div>
                        <p className="font-bold">Department Not Set</p>
                        <p>Please <Link to="/profile" className="underline font-semibold">update your profile</Link> with your department to submit a request.</p>
                    </div>
                </div>
            </div>
        )}

        {/* --- FORM HAS BEEN UPDATED WITH NEW FIELDS --- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title / Medication Name</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base p-3"
              placeholder="e.g., Paracetamol for Headache"
              disabled={!studentDepartment || submitting}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description of Symptoms</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base p-3"
              placeholder="Please describe your symptoms in detail..."
              disabled={!studentDepartment || submitting}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Your Current Location (Optional)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MapPin className="h-5 w-5 text-gray-400" /></div>
              <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-base p-3"
                placeholder="e.g., Library, First Floor"
                disabled={!studentDepartment || submitting}
              />
            </div>
          </div>
        {/* --- END OF FORM UPDATE --- */}

          <div className="pt-4 flex justify-end">
            <motion.button type="submit" disabled={!studentDepartment || submitting}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="inline-flex justify-center items-center gap-2 py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {submitting ? <Spinner /> : <Send className="h-5 w-5" />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default MedicationRequestPage;