import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquare, Building, UserPlus, Mail, Shield, UserCheck, Loader2, Bell, Search, FileText, Rss
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

// --- Sub-component 1: InviteUserForm ---
const InviteUserForm = () => {
  const { getToken } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('hod');
  const [loading, setLoading] = useState(false);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending invitation...');
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase.functions.invoke('invite-user', { body: { email, role } });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      toast.success(`Invitation sent successfully to ${email}!`, { id: toastId });
      setEmail('');
    } catch (error) {
      toast.error(`Failed to send invitation: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  return (
     <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full"><UserPlus className="h-6 w-6 text-indigo-600" /></div>
          <div><h2 className="text-2xl font-bold text-gray-800">Invite New User</h2><p className="text-gray-500">Send an invitation to a new HOD or Club Admin.</p></div>
        </div>
        <form onSubmit={handleInviteUser} className="mt-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="email-invite" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" id="email-invite" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 py-3 px-4 text-base" required /></div></div>
            <div><label htmlFor="role-invite" className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Shield className="h-5 w-5 text-gray-400" /></div><select id="role-invite" value={role} onChange={(e) => setRole(e.target.value)} className="block w-full appearance-none rounded-md border-gray-300 pl-10 pr-10 py-3 text-base"><option value="hod">HOD</option><option value="club_admin">Club Admin</option></select></div></div>
          </div>
          <div className="flex justify-end pt-4"><motion.button whileHover={{ scale: 1.05 }} type="submit" disabled={loading} className="inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">{loading && <Spinner />} {loading ? 'Sending...' : 'Send Invitation'}</motion.button></div>
        </form>
      </div>
  )
};

// --- Sub-component 2: ClubManagement (for re-assigning) ---
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
                           <label htmlFor={`admin-select-${club.id}`} className="text-sm font-medium text-gray-600">Admin:</label>
                           <select id={`admin-select-${club.id}`} value={club.club_admin_id || "null"} onChange={(e) => handleAdminChange(club.id, e.target.value)}
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

// --- Sub-component 3: CreateClubForm ---
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
            onClubCreated(); // Trigger a refresh in the parent component
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

// --- Main Dashboard Component ---
function SuperAdminDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [clubUpdateTrigger, setClubUpdateTrigger] = useState(0); // State to trigger re-renders

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const supabase = await createClerkSupabaseClient(getToken);
        const { data, error } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
        if (!error) { setUserProfile(data); }
      }
    };
    fetchProfile();
  }, [user, getToken]);

  const handleClubUpdate = () => {
      setClubUpdateTrigger(count => count + 1); // Increment to trigger effect
  };

  const contentOversightActions = [
      { to: "/lost-and-found", icon: Search, title: "Lost & Found", color: "bg-blue-500" },
      { to: "/notes", icon: FileText, title: "Notes & Papers", color: "bg-yellow-500" },
      { to: "/club-feed", icon: Rss, title: "Club Feed", color: "bg-purple-500" },
  ];
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <AlertBanner />
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome, {userProfile?.full_name || user?.firstName}.</p>
      </div>
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Core Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ActionCard to="/super-admin/user-management" icon={Users} title="User Management" description="View, edit roles, and manage all users." color="bg-purple-600" index={0}/>
          <ActionCard to="/super-admin/view-feedback" icon={MessageSquare} title="Feedback Inbox" description="View and moderate all platform feedback." color="bg-pink-600" index={1}/>
          <ActionCard to="/super-admin/alert-management" icon={Bell} title="Manage Alerts" description="View history and manage campus alerts." color="bg-yellow-500" index={2}/>
        </div>
      </section>
      <section className="space-y-8">
         <h2 className="text-2xl font-bold text-gray-800">Administrative Tools</h2>
        <InviteUserForm />
        <ClubManagement onClubUpdate={handleClubUpdate} />
        <CreateClubForm onClubCreated={handleClubUpdate} />
      </section>
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Oversight</h2>
        <p className="text-gray-600 mb-6 -mt-4">View student-facing pages for moderation.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentOversightActions.map((action, index) => (
            <ActionCard key={action.title} {...action} index={index} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export default SuperAdminDashboard;