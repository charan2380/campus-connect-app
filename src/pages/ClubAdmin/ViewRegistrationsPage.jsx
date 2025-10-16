import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Download, User, Inbox } from 'lucide-react';

function ViewRegistrationsPage() {
  const { eventId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    const { data, error } = await supabase
      .from('club_posts')
      .select(`title, event_registrations (*)`)
      .eq('id', eventId)
      .single();

    if (error) {
      toast.error("Could not load event registrations.");
      navigate('/club-admin/manage-events');
    } else {
      setEventName(data.title);
      setRegistrations(data.event_registrations);
    }
    setLoading(false);
  }, [eventId, getToken, navigate]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Event Management</button></div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Event Registrations</h1>
        <p className="mt-2 text-lg text-gray-600">Showing registrations for: <span className="font-semibold text-indigo-600">{eventName}</span></p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : registrations.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* --- RESPONSIVE TABLE IMPLEMENTATION --- */}
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department & Year</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reg.student_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.roll_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.department} - Year {reg.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reg.resume_url ? (<a href={reg.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold"><Download className="h-4 w-4" /> Download</a>) : (<span className="text-gray-400">Not Submitted</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-gray-200">
            <AnimatePresence>
                {registrations.map(reg => (
                    <motion.div key={reg.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-2">
                        <p className="font-bold text-gray-900">{reg.student_name || 'N/A'}</p>
                        <p className="text-sm text-gray-600"><strong>Roll No:</strong> {reg.roll_no}</p>
                        <p className="text-sm text-gray-600"><strong>Dept:</strong> {reg.department} - Year {reg.year}</p>
                        <div>
                            {reg.resume_url ? (<a href={reg.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold"><Download className="h-4 w-4" /> Download Resume</a>) : (<span className="text-sm text-gray-400">No Resume Submitted</span>)}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
          </div>
          {/* --- END OF RESPONSIVE IMPLEMENTATION --- */}
        </div>
      ) : (
         <div className="text-center py-20 bg-white rounded-lg shadow-md"><User className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-xl font-semibold text-gray-700">No Registrations Yet</h3><p className="mt-1 text-gray-500">Check back later to see who has registered for this event.</p></div>
      )}
    </motion.div>
  );
}

export default ViewRegistrationsPage;