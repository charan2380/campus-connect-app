import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';

function AlertBanner() {
  const { getToken } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const fetchActiveAlert = async () => {
      // We don't need to be authenticated to create the client for a public read,
      // but it's good practice to use our helper.
      const supabase = await createClerkSupabaseClient(getToken);
      
      // Our RLS policy allows any authenticated user to read active alerts.
      // We fetch the most recent active alert.
      const { data, error } = await supabase
        .from('alerts')
        .select('message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(); // .single() will return null if no rows are found, instead of an empty array

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
        console.error("Error fetching active alert:", error);
      } else if (data) {
        setActiveAlert(data);
      }
    };

    fetchActiveAlert();
  }, [getToken]);

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg mb-8 overflow-hidden"
          role="alert"
        >
          <div className="flex items-center">
            <Megaphone className="h-6 w-6 mr-3 flex-shrink-0" />
            <div>
              <p className="font-bold">Campus Alert</p>
              <p>{activeAlert.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AlertBanner;