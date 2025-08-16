import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Loader2, Calendar, MapPin, Edit, Trash2, Inbox, ArrowLeft, Users } from 'lucide-react';

function ManageEventsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    
    // This query now also fetches a COUNT of registrations for each post.
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        club_posts (
          *,
          event_registrations ( count )
        )
      `)
      .eq('club_admin_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching events:", error);
    } else if (data && data.club_posts) {
      setPosts(data.club_posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    setLoading(false);
  }, [user, getToken]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this event?")) return;
    const toastId = toast.loading("Deleting event...");
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase.from('club_posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
      toast.success("Event deleted successfully!", { id: toastId });
    } catch (error) {
      toast.error(`Failed to delete event: ${error.message}`, { id: toastId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Manage Club Events</h1>
          <p className="mt-2 text-lg text-gray-600">Create, edit, and delete your club's posts and events.</p>
        </div>
        <Link to="/club-admin/create-event">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Create New Event
          </motion.button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : posts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg">
          <ul role="list" className="divide-y divide-gray-200">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.li key={post.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
                  className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900">{post.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(post.event_date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {post.venue}</div>
                        {/* --- THIS IS THE NEW REGISTRATION COUNT --- */}
                        <div className="flex items-center gap-1.5 font-medium text-indigo-600">
                          <Users className="h-4 w-4" /> {post.event_registrations[0].count} Registered
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* --- THIS IS THE NEW "VIEW REGISTRATIONS" BUTTON --- */}
                       <button onClick={() => navigate(`/club-admin/event-registrations/${post.id}`)}
                        className="px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors">
                        View Registrations
                      </button>
                       <button onClick={() => navigate(`/club-admin/edit-event/${post.id}`)}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <Inbox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-700">No Events Created Yet</h3>
          <p className="mt-1 text-gray-500">Click the button above to create your first event post.</p>
        </div>
      )}
    </motion.div>
  );
}

export default ManageEventsPage;