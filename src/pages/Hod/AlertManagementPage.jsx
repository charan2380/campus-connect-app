import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AlertManagement from '../../components/AlertManagement'; // Adjust path

function HodAlertManagementPage() {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
      
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Manage Your Alerts</h1>
        <p className="mt-2 text-lg text-gray-600">Create new alerts and manage the ones you have posted.</p>
      </div>

      {/* 
        We render the reusable component here.
        The default `isAdminView` prop is `false`, which correctly
        filters the list to show only the alerts created by the current HOD.
      */}
      <AlertManagement />
    </motion.div>
  );
}

export default HodAlertManagementPage;