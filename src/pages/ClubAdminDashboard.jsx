import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, MessageSquare } from 'lucide-react';
import AlertBanner from '../components/AlertBanner'; // <-- IMPORT THE NEW COMPONENT

// Reusable ActionCard component for a consistent dashboard look and feel
const ActionCard = ({ to, icon: Icon, title, description, color, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.05, duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Link to={to} className="block p-6 bg-white rounded-xl shadow-md h-full">
        <div className={`mb-4 inline-block p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </Link>
    </motion.div>
  );
};

function ClubAdminDashboard() {
  const { user } = useUser();

  const adminActions = [
    {
      to: "/club-admin/manage-events",
      icon: ClipboardList,
      title: "Manage Events",
      description: "View, edit, delete events, and see who has registered.",
      color: "bg-blue-500"
    },
    {
      to: "/club-admin/create-event",
      icon: PlusCircle,
      title: "Create New Event",
      description: "Post a new event or announcement for all students to see.",
      color: "bg-green-500"
    },
    {
      to: "/club-admin/view-feedback",
      icon: MessageSquare,
      title: "View Feedback",
      description: "Read feedback submitted by students specifically for your club.",
      color: "bg-pink-500"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* --- ADD THE ALERT BANNER COMPONENT HERE --- */}
      <AlertBanner />

      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Club Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Welcome, {user?.firstName}. Manage your club's presence on CampusConnect.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminActions.map((action, index) => (
            <ActionCard key={action.title} {...action} index={index} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export default ClubAdminDashboard;