import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Loader2, Bell, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
// --- THE INCORRECT IMPORT OF A DELETED FILE HAS BEEN REMOVED FROM HERE ---

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

// --- THIS IS THE NEW, SELF-CONTAINED CREATE ALERT FORM LOGIC ---
const CreateAlertForm = ({ onAlertCreated }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error("Alert message cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Posting new alert...");

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase.from('alerts').insert({
        message: newMessage,
        creator_id: user.id,
        is_active: true,
      });
      if (error) throw error;
      
      toast.success("New alert posted successfully!", { id: toastId });
      setNewMessage('');
      if (onAlertCreated) {
        onAlertCreated();
      }

    } catch (error) {
      toast.error(`Failed to post alert: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-yellow-100 p-3 rounded-full">
            <Bell className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Create New Alert</h2>
            <p className="text-gray-500">This message will be broadcast to all users.</p>
        </div>
      </div>
      <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row items-start gap-4">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter your alert message here..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-3"
          rows="3"
          required
        />
        <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
          {isSubmitting ? <Spinner /> : <Plus className="h-5 w-5" />}
          Post Alert
        </motion.button>
      </form>
    </div>
  );
};


// --- Main AlertManagement Component ---
function AlertManagement({ isAdminView = false }) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    
    let query = supabase.from('alerts').select('*, profile:profiles(full_name)');
    
    if (!isAdminView) {
      query = query.eq('creator_id', user.id);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      toast.error("Failed to load alerts.");
    } else {
      setAlerts(data);
    }
    setLoading(false);
  }, [getToken, user, isAdminView]);

  useEffect(() => {
    if (user) {
        fetchAlerts();
    }
  }, [fetchAlerts, user]);

  const handleToggleAlertStatus = async (alertId, currentStatus) => {
    const action = currentStatus ? "Deactivating" : "Activating";
    const toastId = toast.loading(`${action} alert...`);
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: !currentStatus })
        .eq('id', alertId);
      if (error) throw error;
      
      toast.success(`Alert has been updated.`, { id: toastId });
      fetchAlerts();
    } catch (error) {
       toast.error(`Failed to update alert: ${error.message}`, { id: toastId });
    }
  };

  const handleDeleteAlert = async (alertId) => {
      if (!window.confirm("Are you sure?")) return;
      
      const toastId = toast.loading("Deleting alert...");
      try {
          const supabase = await createClerkSupabaseClient(getToken);
          const { error } = await supabase.from('alerts').delete().eq('id', alertId);
          if (error) throw error;
          
          toast.success("Alert deleted!", {id: toastId });
          setAlerts(current => current.filter(a => a.id !== alertId));

      } catch (error) {
          toast.error(`Failed to delete: ${error.message}`, {id: toastId});
      }
  }

  return (
    <div className="space-y-8">
      <CreateAlertForm onAlertCreated={fetchAlerts} />
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Alert History</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : alerts.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              <AnimatePresence>
                {alerts.map(alert => (
                  <motion.li key={alert.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">Posted by {alert.profile?.full_name || 'Admin'} on {new Date(alert.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
                        {alert.is_active ? (<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"><CheckCircle className="h-3.5 w-3.5" />Active</span>) : (<span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"><XCircle className="h-3.5 w-3.5" />Inactive</span>)}
                        <button onClick={() => handleToggleAlertStatus(alert.id, alert.is_active)} className={`px-3 py-1.5 text-sm font-semibold text-white rounded-full shadow-sm transition-colors ${alert.is_active ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'}`}>{alert.is_active ? 'Deactivate' : 'Activate'}</button>
                         <button onClick={() => handleDeleteAlert(alert.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <Bell className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-xl font-semibold text-gray-700">No Alerts Found</h3><p className="mt-1 text-gray-500">Create the first campus-wide alert using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertManagement;