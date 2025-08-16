import { useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Search, User, Edit, Trash2 } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

// --- Component 1: EditUserModal (Unchanged) ---
const EditUserModal = ({ isOpen, onClose, user, onUpdateSuccess }) => {
    const { getToken } = useAuth();
    const [newRole, setNewRole] = useState(user?.role || 'student');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setNewRole(user.role);
        }
    }, [user]);

    const handleRoleUpdate = async () => {
        setIsSaving(true);
        const toastId = toast.loading('Updating user role...');
        try {
            const supabase = await createClerkSupabaseClient(getToken);
            const { data, error } = await supabase.functions.invoke('update-user-role', {
                body: { userId: user.user_id, newRole },
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            toast.success("User role updated successfully! The user has been signed out and will need to log in again.", { id: toastId, duration: 6000 });
            onUpdateSuccess();
            onClose();
        } catch (error) {
            toast.error(`Failed to update role: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!user) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={onClose}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">Edit User: {user.full_name}</Dialog.Title>
                    <div className="mt-4">
                        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">Change Role</label>
                        <select id="role-select" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500">
                            <option value="student">Student</option>
                            <option value="hod">HOD</option>
                            <option value="club_admin">Club Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                        <button type="button" onClick={handleRoleUpdate} disabled={isSaving} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300">
                           {isSaving && <Loader2 className="animate-spin h-4 w-4" />} Save Changes
                        </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
    );
};

// --- Component 2: Reusable RolePill ---
const RolePill = ({ role }) => {
    const roleStyles = {
        student: 'bg-green-100 text-green-800',
        hod: 'bg-blue-100 text-blue-800',
        club_admin: 'bg-yellow-100 text-yellow-800',
        super_admin: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles[role] || 'bg-gray-100 text-gray-800'}`}>{role}</span>
};

// --- Component 3: The Main UserManagementPage ---
function UserManagementPage() {
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) { toast.error("Failed to load users."); } else { setUsers(data); }
      setLoading(false);
  }, [getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);
  
  const handleOpenEditModal = (user) => {
      setSelectedUser(user);
      setIsModalOpen(true);
  };
  
  const handleDeleteUser = async (userToDelete) => {
      if (!window.confirm(`Are you sure you want to permanently delete the user: ${userToDelete.full_name}?`)) return;
      const toastId = toast.loading("Deleting user...");
      try {
          const supabase = await createClerkSupabaseClient(getToken);
          const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId: userToDelete.user_id } });
          if (error) throw new Error(error.message);
          if (data.error) throw new Error(data.error);
          toast.success("User deleted successfully!", { id: toastId });
          setUsers(currentUsers => currentUsers.filter(u => u.user_id !== userToDelete.user_id));
      } catch (error) {
          toast.error(`Failed to delete user: ${error.message}`, { id: toastId });
      }
  };

  return (
    <>
      <EditUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} onUpdateSuccess={fetchUsers} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-lg text-gray-600">View, search, and manage all user accounts.</p>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></div>
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 py-2 focus:border-indigo-500"/>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr key={user.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><RolePill role={user.role} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleOpenEditModal(user)} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100"><Edit className="h-5 w-5" /></button>
                          {currentUser.id !== user.user_id && (
                               <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-full text-red-600 hover:bg-red-100 ml-2"><Trash2 className="h-5 w-5" /></button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-gray-200">
              <AnimatePresence>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <motion.div key={user.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <RolePill role={user.role} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => handleOpenEditModal(user)} className="p-2 rounded-full text-indigo-600 bg-indigo-50"><Edit className="h-5 w-5" /></button>
                        {currentUser.id !== user.user_id && (
                            <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-full text-red-600 bg-red-50"><Trash2 className="h-5 w-5" /></button>
                        )}
                    </div>
                  </motion.div>
                )) : 
                <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                    <User className="h-10 w-10 text-gray-400 mb-2"/>
                    No users found.
                </div>}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default UserManagementPage;