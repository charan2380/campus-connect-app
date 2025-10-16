import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse, MessageSquare, Users, Search, FileText, Rss, Bell, Building, UserCheck, Loader2
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

// --- Sub-component 1: ClubManagement ---
const ClubManagement = ({ onClubUpdate }) => {
    const { getToken } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [clubAdmins, setClubAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!getToken) return;
        setLoading(true);
        const supabase = await createClerkSupabaseClient(getToken);
        const [clubsRes, adminsRes] = await Promise.all([
            supabase.from('clubs').select('id, club_name, club_admin_id').order('club_name'),
            supabase.from('profiles').select('user_id, full_name').eq('role', 'club_admin')
        ]);
        if (clubsRes.error || adminsRes.error) {
            toast.error("Failed to load club management data.");
        } else {
            setClubs(clubsRes.data);
            setClubAdmins(adminsRes.data);
        }
        setLoading(false);
    }, [getToken]);

    useEffect(() => { fetchData(); }, [fetchData, onClubUpdate]);

    const handleAdminChange = async (clubId, newAdminId) => {
        const toastId = toast.loading("Updating club admin...");
        try {
            const supabase = await createClerkSupabaseClient(getToken);
            const { error } = await supabase
                .from('clubs')
                .update({ club_admin_id: newAdminId === "null" ? null : newAdminId })
                .eq('id', clubId);
            if (error) throw error;
            toast.success("Club admin updated successfully!", { id: toastId });
            fetchData();
        } catch (error) {
            toast.error(`Update failed: ${error.message}`, { id: toastId });
        }
    };
    
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full"><Building className="h-6 w-6 text-green-600" /></div><div><h2 className="text-2xl font-bold text-gray-800">Manage Club Admins</h2><p className="text-gray-500">Assign or re-assign admins to existing clubs.</p></div></div>
            {loading ? <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600"/></div> :
            <div className="mt-6 space-y-4">
                {clubs.length > 0 ? clubs.map(club => (
                    <div key={club.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <span className="font-bold text-gray-800">{club.club_name}</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                           <label htmlFor={`admin-select-hod-${club.id}`} className="text-sm font-medium text-gray-600">Admin:</label>
                           <select id={`admin-select-hod-${club.id}`} value={club.club_admin_id || "null"} onChange={(e) => handleAdminChange(club.id, e.target.value)}
                                className="block w-full sm:w-auto appearance-none rounded-md border-gray-300 pl-3 pr-8 py-2 text-base focus:border-green-500">
                                <option value="null">-- Unassigned --</option>
                                {clubAdmins.map(admin => (<option key={admin.user_id} value={admin.user_id}>{admin.full_name}</option>))}
                           </select>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">No clubs have been created yet.</p>}
            </div>}
        </div>
    );
};

// --- Sub-component 2: CreateClubForm ---
const CreateClubForm = ({ onClubCreated }) => {
    const { getToken } = useAuth();
    const [clubName, setClubName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateClub = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Creating club...');
        try {
            const supabase = await createClerkSupabaseClient(getToken);
            const { error } = await supabase.from('clubs').insert({ club_name: clubName });
            if (error) throw error;
            toast.success(`Club "${clubName}" created!`, { id: toastId });
            setClubName('');
            onClubCreated();
        } catch (error) {
            toast.error(`Failed to create club: ${error.message}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">Create a New Club</h2>
            <form onSubmit={handleCreateClub} className="mt-4 flex items-center gap-4">
                <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} className="flex-grow block w-full rounded-md border-gray-300 py-2 px-3" placeholder="New Club Name" required />
                <motion.button whileHover={{ scale: 1.05 }} type="submit" disabled={loading} className="inline-flex items-center gap-2 py-2 px-6 rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
                    {loading && <Spinner />} Create
                </motion.button>
            </form>
        </div>
    )
};

// Reusable ActionCard component
const ActionCard = ({ to, icon: Icon, title, description, color, index }) => {
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.3 }}};
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -5, boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)" }} transition={{ duration: 0.2 }}>
      <Link to={to} className="block p-6 bg-white rounded-xl shadow-md h-full">
        <div className={`mb-4 inline-block p-3 rounded-full ${color}`}><Icon className="h-6 w-6 text-white" /></div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </Link>
    </motion.div>
  );
};


// --- Main HOD Dashboard Component ---
function HodDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [clubUpdateTrigger, setClubUpdateTrigger] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const supabase = await createClerkSupabaseClient(getToken);
        const { data, error } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') { console.error("Error fetching HOD profile:", error); } 
        else { setUserProfile(data); }
      }
    };
    fetchProfile();
  }, [user, getToken]);
  
  const handleClubUpdate = () => {
      setClubUpdateTrigger(count => count + 1);
  };

  const hodActions = [
    { to: "/hod/medication-requests", icon: HeartPulse, title: "Medication Requests", description: "Manage student medication requests.", color: "bg-red-500" },
    { to: "/hod/view-feedback", icon: MessageSquare, title: "View Feedback", description: "Read feedback from your students.", color: "bg-blue-500" },
    { to: "/hod/student-directory", icon: Users, title: "Student Directory", description: "Browse and filter all student profiles.", color: "bg-purple-500" },
    { to: "/lost-and-found", icon: Search, title: "Lost & Found", description: "View all lost and found items on campus.", color: "bg-green-500" },
    { to: "/notes", icon: FileText, title: "Notes & Papers", description: "View and contribute to the knowledge base.", color: "bg-yellow-500" },
    { to: "/club-feed", icon: Rss, title: "Club Feed & Events", description: "View all club activities on campus.", color: "bg-pink-500" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <AlertBanner />
      <div>
        <h1 className="text-4xl font-bold text-gray-900">HOD Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Welcome, {userProfile?.full_name || user?.firstName}. Manage student requests and view department-specific information.
        </p>
      </div>

       <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Management Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hodActions.map((action, index) => (
            <ActionCard key={action.title} {...action} index={index} />
          ))}
        </div>
      </section>
      
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Administrative Tools</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-yellow-100 p-3 rounded-full"><Bell className="h-6 w-6 text-yellow-600" /></div>
                <div><h3 className="text-2xl font-bold text-gray-800">Manage Campus Alerts</h3><p className="text-gray-500">Create new alerts or manage the ones you have posted.</p></div>
            </div>
            <div className="mt-4 text-right"><button onClick={() => navigate('/hod/alert-management')} className="font-semibold text-indigo-600 hover:text-indigo-800">Go to Alert Management Page &rarr;</button></div>
        </div>
        <ClubManagement onClubUpdate={handleClubUpdate} />
        <CreateClubForm onClubCreated={handleClubUpdate} />
      </section>
    </motion.div>
  );
}

export default HodDashboard;