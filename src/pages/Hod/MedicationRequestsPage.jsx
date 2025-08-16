import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient'; // Adjust path
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, X, Inbox, User, FileText, MapPin, ArrowLeft } from 'lucide-react';

const StatusPill = ({ status }) => {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"><Check className="h-3.5 w-3.5" />Approved</span>;
    case 'rejected':
      return <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"><X className="h-3.5 w-3.5" />Rejected</span>;
    default:
      return <span className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800"><ArrowLeft className="h-3.5 w-3.5" />Pending</span>;
  }
};

function MedicationRequestsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    const { data, error } = await supabase
      .from('medication_requests')
      .select(`id, created_at, title, description, location, status, student_id, profile:profiles ( full_name )`)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch medication requests.");
    } else {
      setRequests(data);
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleUpdateRequest = async (requestId, newStatus) => {
    setUpdatingId(requestId);
    const toastId = toast.loading(`Updating status...`);
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase.from('medication_requests').update({ status: newStatus }).eq('id', requestId).select().single();
      if (error) throw error;
      setRequests(currentRequests => currentRequests.map(req => (req.id === requestId ? { ...req, ...data } : req)));
      toast.success('Request updated successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to update request.', { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
       <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Medication Requests</h1>
        <p className="mt-2 text-lg text-gray-600">Review and manage requests from students in your department.</p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Requests ({pendingRequests.length})</h2>
            {pendingRequests.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg"><ul role="list" className="divide-y divide-gray-200"><AnimatePresence>{pendingRequests.map((req) => (<motion.li key={req.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="p-6 hover:bg-gray-50"><div className="flex flex-col sm:flex-row justify-between gap-4"><div className="flex-1 space-y-3"><div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><span className="font-semibold text-gray-800">{req.profile?.full_name || 'Unknown'}</span></div><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-gray-400"/><span className="font-bold text-gray-800">{req.title}</span></div><p className="text-sm text-gray-600 pl-8">{req.description}</p>{req.location && <p className="text-sm text-gray-500 italic pl-8">Location: {req.location}</p>}</div><div className="flex sm:flex-col justify-end items-end gap-2"><StatusPill status={req.status} /><div className="flex gap-2 mt-2"><button onClick={() => handleUpdateRequest(req.id, 'approved')} disabled={updatingId === req.id} className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 disabled:bg-green-300">{updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve</button><button onClick={() => handleUpdateRequest(req.id, 'rejected')} disabled={updatingId === req.id} className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:bg-red-300">{updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject</button></div></div></div></motion.li>))}</AnimatePresence></ul></div>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow-md"><Inbox className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-xl font-semibold text-gray-700">All Clear!</h3><p className="mt-1 text-gray-500">There are no pending requests.</p></div>
            )}
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Processed Requests ({processedRequests.length})</h2>
             {processedRequests.length > 0 && (<div className="bg-white rounded-xl shadow-lg"><ul role="list" className="divide-y divide-gray-200">{processedRequests.map((req) => (<li key={req.id} className="p-6"><div className="flex flex-col sm:flex-row justify-between gap-4"><div className="flex-1 space-y-2"><div className="flex items-center gap-3 font-semibold text-gray-700"><User className="h-5 w-5 text-gray-400" /><span>{req.profile?.full_name || 'Unknown'}</span></div><p className="text-sm text-gray-600 pl-8">{req.title}</p></div><div className="flex justify-end items-center"><StatusPill status={req.status} /></div></div></li>))}</ul></div>)}
          </section>
        </div>
      )}
    </motion.div>
  );
}

export default MedicationRequestsPage;