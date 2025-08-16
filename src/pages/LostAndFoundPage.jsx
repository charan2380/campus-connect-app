import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Loader2, Tag, Info, Clock, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';

const ItemCard = ({ item, currentUserId, currentUserRole, onDelete, onContact }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    await onDelete(item.id);
  };

  // --- THIS IS THE CORRECT, COMBINED LOGIC ---
  const isOwner = currentUserId === item.user_id;
  const isSuperAdmin = currentUserRole === 'super_admin';
  const canDelete = isOwner || isSuperAdmin;
  
  // The "Contact Owner" button should appear if the item is 'lost' AND the viewer is NOT the owner.
  const canContact = item.status === 'lost' && !isOwner;
  // --- END OF CORRECTION ---

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
      className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
    >
      <div className="relative">
        <img className="h-48 w-full object-cover" src={item.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} alt={item.item_name} />
        
        {canDelete && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-2 shadow-lg backdrop-blur-sm disabled:bg-red-400"
            aria-label="Delete item"
          >
            {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
          </motion.button>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex-grow">
          <div className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${item.status === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <Tag className="inline h-3 w-3 mr-1" />
            {item.status.toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{item.item_name}</h3>
          <p className="text-gray-600 mt-2 flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 mt-1 flex-shrink-0" />
            <span>{item.description}</span>
          </p>
        </div>
        <div className="border-t pt-4 mt-4 text-xs text-gray-500">
           Posted by {item.profile?.full_name || 'a user'} on {new Date(item.created_at).toLocaleDateString()}
        </div>
      </div>
      
      {/* --- THE "CONTACT OWNER" BUTTON IS NOW RESTORED --- */}
      {canContact && (
        <div className="p-4 bg-gray-50 border-t">
            <motion.button 
                onClick={() => onContact(item.user_id)}
                whileHover={{ scale: 1.05 }}
                className="w-full inline-flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-indigo-700"
            >
                <MessageCircle className="h-5 w-5"/>
                Contact Owner
            </motion.button>
        </div>
      )}
      {/* --- END OF RESTORATION --- */}
    </motion.div>
  );
};

function LostAndFoundPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading]  = useState(true);

  // The handler to navigate to the messages page
  const handleContactOwner = (recipientId) => {
    navigate(`/messages/${recipientId}`);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    const toastId = toast.loading('Deleting item...');
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const { error } = await supabase.from('lost_and_found_items').delete().eq('id', itemId);
      if (error) throw error;
      setItems(currentItems => currentItems.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!', { id: toastId });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error('Failed to delete item.', { id: toastId });
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      // Ensure we are fetching the profile for the owner's name
      const { data, error } = await supabase.from('lost_and_found_items').select('*, profile:profiles(full_name)').order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data);
      }
      setLoading(false);
    };
    fetchItems();
  }, [getToken]);

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
          <h1 className="text-4xl font-bold text-gray-900">Lost & Found</h1>
          <p className="mt-2 text-lg text-gray-600">Browse items reported across campus. Click to report a new item.</p>
        </div>
        <Link to="/report-item">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Report New Item
          </motion.button>
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : items.length > 0 ? (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                currentUserId={user?.id}
                currentUserRole={user?.publicMetadata?.role}
                onDelete={handleDeleteItem}
                onContact={handleContactOwner} // Pass the contact handler
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">No Items Found</h3>
          <p className="text-gray-500 mt-2">Be the first to report a lost or found item!</p>
        </div>
      )}
    </motion.div>
  );
}

export default LostAndFoundPage;