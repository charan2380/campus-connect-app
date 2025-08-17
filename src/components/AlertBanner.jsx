import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';

function AlertBanner() {
  const { getToken } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]); // Changed to an array

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      const supabase = await createClerkSupabaseClient(getToken);
      
      // Fetch ALL active alerts, not just one
      const { data, error } = await supabase
        .from('alerts')
        .select('id, message')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching active alerts:", error);
      } else if (data) {
        setActiveAlerts(data);
      }
    };

    if (getToken) {
        fetchActiveAlerts();
    }
  }, [getToken]);

  return (
    <AnimatePresence>
      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4 mb-8"
        >
          {activeAlerts.map((alert) => (
             <div key={alert.id} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg" role="alert">
                <div className="flex items-center">
                  <Megaphone className="h-6 w-6 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Campus Alert</p>
                    <p>{alert.message}</p>
                  </div>
                </div>
              </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AlertBanner;