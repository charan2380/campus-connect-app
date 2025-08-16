import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, CheckCircle, XCircle, HelpCircle, FileText } from 'lucide-react';

const getStatusPill = (status) => {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </span>
      );
  }
};


// --- THIS IS THE MODIFIED COMPONENT ---
const RequestCard = ({ request, index }) => (
  <motion.li
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6"
  >
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      {/* Left side: Details */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <span className="font-bold text-gray-800 text-lg">{request.title}</span>
        </div>
        <p className="text-gray-600 sm:pl-8">{request.description}</p>
      </div>

      {/* Right side: Status and Date */}
      <div className="flex sm:flex-col items-end justify-between sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
         {getStatusPill(request.status)}
         <p className="text-xs text-gray-500 mt-1">
            Requested on {new Date(request.created_at).toLocaleDateString()}
         </p>
      </div>
    </div>
  </motion.li>
);
// --- END OF MODIFIED COMPONENT ---


function MyRequestsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase
        .from('medication_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [getToken]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-900">My Medication Requests</h1>
        <p className="mt-2 text-lg text-gray-600">Here is the history and status of all your past requests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : requests.length > 0 ? (
        <ul role="list" className="space-y-4">
          {requests.map((request, index) => (
            <RequestCard key={request.id} request={request} index={index} />
          ))}
        </ul>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
           <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-700">No Requests Found</h3>
          <p className="mt-1 text-gray-500">You haven't submitted any medication requests yet.</p>
           <div className="mt-6">
            <Link to="/medication-request"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Make a New Request
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default MyRequestsPage;