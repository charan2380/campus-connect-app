import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquare, Building, UserPlus, Mail, Shield, UserCheck, Loader2, Bell, Search, FileText, Rss
} from 'lucide-react';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

// --- Component 1: InviteUserForm (unchanged) ---
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
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 py-3 px-4 text-base focus:border-indigo-500" required /></div></div>
            <div><label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Shield className="h-5 w-5 text-gray-400" /></div><select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="block w-full appearance-none rounded-md border-gray-300 pl-10 pr-10 py-3 text-base focus:border-indigo-500"><option value="hod">HOD</option><option value="club_admin">Club Admin</option></select></div></div>
          </div>
          <div className="flex justify-end pt-4"><motion.button whileHover={{ scale: 1.05 }} type="submit" disabled={loading} className="inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">{loading && <Spinner />} {loading ? 'Sending...' : 'Send Invitation'}</motion.button></div>
        </form>
      </div>
  )
};

// --- Component 2: ClubManagement (unchanged) ---
const ClubManagement = () => {
    const { getToken } = useAuth();
    const [clubName, setClubName] = useState('');
    const [clubAdmins, setClubAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [loading, setLoading] = useState(false);
    const fetchClubAdmins = useCallback(async () => { /* ... unchanged ... */ }, [getToken]);
    useEffect(() => { fetchClubAdmins(); }, [fetchClubAdmins]);
    const handleCreateClub = async (e) => { /* ... unchanged ... */ };
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full"><Building className="h-6 w-6 text-green-600" /></div><div><h2 className="text-2xl font-bold text-gray-800">Create & Assign Club</h2><p className="text-gray-500">Create a new club and assign an admin to manage it.</p></div></div>
            <form onSubmit={handleCreateClub} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-1">Club Name</label><input type="text" id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} className="block w-full rounded-md border-gray-300 py-3 px-4 text-base focus:border-green-500" placeholder="e.g., Tech Club" required /></div>
                    <div><label htmlFor="admin" className="block text-sm font-medium text-gray-700 mb-1">Assign Admin (Optional)</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><UserCheck className="h-5 w-5 text-gray-400" /></div><select id="admin" value={selectedAdmin} onChange={(e) => setSelectedAdmin(e.target.value)} className="block w-full appearance-none rounded-md border-gray-300 pl-10 pr-10 py-3 text-base focus:border-green-500"><option value="">Select an Admin</option>{clubAdmins.map(admin => (<option key={admin.user_id} value={admin.user_id}>{admin.full_name}</option>))}</select></div></div>
                </div>
                <div className="flex justify-end pt-4"><motion.button whileHover={{ scale: 1.05 }} type="submit" disabled={loading} className="inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">{loading && <Spinner />} {loading ? 'Creating...' : 'Create Club'}</motion.button></div>
            </form>
        </div>
    );
};

// --- NEW Reusable ActionCard component for this dashboard ---
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
  const contentOversightActions = [
      { to: "/lost-and-found", icon: Search, title: "Lost & Found", description: "View and moderate all lost and found items.", color: "bg-blue-500" },
      { to: "/notes", icon: FileText, title: "Notes & Papers", description: "View and moderate all shared notes.", color: "bg-yellow-500" },
      { to: "/club-feed", icon: Rss, title: "Club Feed", description: "View all club posts and events for moderation.", color: "bg-purple-500" },
  ];
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div><h1 className="text-4xl font-bold text-gray-900">Super Admin Dashboard</h1><p className="mt-2 text-lg text-gray-600">Manage users, clubs, and oversee the entire CampusConnect system.</p></div>
      
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Core Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ActionCard to="/super-admin/user-management" icon={Users} title="User Management" description="View, edit roles, and manage all users." color="bg-purple-600" index={0}/>
          <ActionCard to="/super-admin/view-feedback" icon={MessageSquare} title="Feedback Inbox" description="View and moderate all platform feedback." color="bg-pink-600" index={1}/>
          <ActionCard to="/super-admin/alert-management" icon={Bell} title="Manage Alerts" description="Create and clear campus-wide alerts." color="bg-yellow-500" index={2}/>
        </div>
      </section>

      <section className="space-y-8">
         <h2 className="text-2xl font-bold text-gray-800">Creation Tools</h2>
        <InviteUserForm />
        <ClubManagement />
      </section>
      
      {/* --- THIS IS THE REDESIGNED SECTION --- */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Oversight</h2>
        <p className="text-gray-600 mb-6 -mt-4">View student-facing pages to moderate content. Your delete permissions are active on these pages.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentOversightActions.map((action, index) => (
            <ActionCard key={action.title} {...action} index={index} />
          ))}
        </div>
      </section>
      {/* --- END OF REDESIGN --- */}
    </motion.div>
  );
}

export default SuperAdminDashboard;