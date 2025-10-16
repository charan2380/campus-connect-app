import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, Search, PlusCircle, HeartPulse, Building,
  Rss, MessageSquare, ListChecks, History,
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import Chatbot from '../components/Chatbot';
import createClerkSupabaseClient from '../supabaseClient';

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

function StudentDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const supabase = await createClerkSupabaseClient(getToken);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore error if profile not found yet
          console.error("Error fetching user profile for dashboard:", error);
        } else {
          setUserProfile(data);
        }
      }
    };
    fetchProfile();
  }, [user, getToken]);

  const actions = [
    { to: "/lost-and-found", icon: Search, title: "Lost & Found", description: "Browse reported lost and found items.", color: "bg-blue-500" },
    { to: "/medication-request", icon: HeartPulse, title: "Medication Request", description: "Submit a request for medication to your HOD.", color: "bg-red-500" },
    { to: "/my-requests", icon: ListChecks, title: "My Requests", description: "Check the status of your medication requests.", color: "bg-indigo-500" },
    { to: "/club-feed", icon: Rss, title: "Club Feed & Events", description: "See the latest posts and register for events.", color: "bg-purple-500" },
    { to: "/notes", icon: FileText, title: "Notes & Papers", description: "Access and share study materials.", color: "bg-yellow-500" },
    { to: "/room-rentals", icon: Building, title: "Room Rentals", description: "Find or list available PG/room rentals.", color: "bg-teal-500" },
    { to: "/feedback", icon: MessageSquare, title: "Submit Feedback", description: "Share your thoughts with campus authorities.", color: "bg-pink-500" },
    { to: "/my-feedback", icon: History, title: "My Feedback History", description: "View a record of the feedback you have submitted.", color: "bg-gray-500" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <AlertBanner />
        
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {userProfile?.full_name || user?.firstName || 'Student'}!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            This is your command center. What would you like to do today?
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {actions.map((action, index) => (
              <ActionCard key={action.title} {...action} index={index} />
            ))}
          </div>
        </section>
      </motion.div>
      
      <Chatbot />
    </>
  );
}

export default StudentDashboard;