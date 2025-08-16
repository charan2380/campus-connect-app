import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartPulse, MessageSquare, Users, Search, FileText, Rss } from 'lucide-react'; // Added Rss icon
import AlertBanner from '../components/AlertBanner';

// Reusable ActionCard component
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

function HodDashboard() {
  const { user } = useUser();

  const hodActions = [
    { to: "/hod/medication-requests", icon: HeartPulse, title: "Medication Requests", description: "Manage requests from your department.", color: "bg-red-500" },
    { to: "/hod/view-feedback", icon: MessageSquare, title: "View Feedback", description: "Read feedback submitted by your students.", color: "bg-blue-500" },
    { to: "/hod/student-directory", icon: Users, title: "Student Directory", description: "Browse and filter a directory of all students.", color: "bg-purple-500" },
    { to: "/lost-and-found", icon: Search, title: "Lost & Found", description: "View all lost and found items on campus.", color: "bg-green-500" },
    { to: "/notes", icon: FileText, title: "Notes & Papers", description: "View and contribute to the shared knowledge base.", color: "bg-yellow-500" },
    // --- THIS IS THE NEW CARD, CORRECTLY IMPLEMENTED ---
    { to: "/club-feed", icon: Rss, title: "Club Feed & Events", description: "View all club activities and event details across campus.", color: "bg-pink-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <AlertBanner />
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          HOD Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Welcome, {user?.firstName}. Manage student requests and view department-specific information.
        </p>
      </div>

       <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hodActions.map((action, index) => (
            <ActionCard key={action.title} {...action} index={index} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export default HodDashboard;