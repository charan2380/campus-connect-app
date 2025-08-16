import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket, CheckCircle, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const EventCard = ({ post, currentUser, isRegistered, onRegisterClick, onDelete, isManagementView = false }) => {
  const navigate = useNavigate();

  const isClubAdminOwner = currentUser?.id === post.clubs?.club_admin_id;
  const isSuperAdmin = currentUser?.publicMetadata?.role === 'super_admin';
  const isHod = currentUser?.publicMetadata?.role === 'hod';
  
  // --- THIS IS THE CORRECTED LOGIC ---
  // A user is considered a 'student' for this component's purpose if they are not an admin.
  const isStudent = currentUser?.publicMetadata?.role === 'student' || !currentUser?.publicMetadata?.role;
  
  const canDelete = isClubAdminOwner || isSuperAdmin;

  const handleRegister = () => {
    if (isRegistered) {
      toast.success("You are already registered for this event!");
      return;
    }
    onRegisterClick(post);
  };

  const renderAction = () => {
    // If this card is on the Club Admin's "Manage" page, show nothing.
    if (isManagementView) {
        return null;
    }

    if (isStudent) {
      if (isRegistered) {
        return (
          <div className="w-full inline-flex justify-center items-center gap-2 bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-full">
            <CheckCircle className="h-5 w-5" /> Registered
          </div>
        );
      }
      return (
        <motion.button onClick={handleRegister} whileHover={{ scale: 1.05 }}
          className="w-full inline-flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-indigo-700">
          <Ticket className="h-5 w-5" /> Register Now
        </motion.button>
      );
    }

    if (isHod) {
      return (
        <motion.button onClick={() => navigate(`/club-admin/event-registrations/${post.id}`)} whileHover={{ scale: 1.05 }}
          className="w-full inline-flex justify-center items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-purple-700">
          <Users className="h-5 w-5" /> View Registrations
        </motion.button>
      );
    }
    
    // Default case for Super Admins viewing the feed
    return <div className="h-10"></div>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="relative">
        <img className="h-56 w-full object-cover" src={post.poster_image_url || 'https://via.placeholder.com/600x400?text=Event+Poster'} alt={post.title} />
        {canDelete && (
            <motion.button onClick={() => onDelete(post.id)} whileHover={{ scale: 1.1 }}
                className="absolute top-3 right-3 bg-red-600/80 text-white p-2 rounded-full shadow-lg">
                <Trash2 className="h-5 w-5" />
            </motion.button>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-sm font-semibold text-indigo-600">{post.clubs?.club_name || 'Campus Club'}</p>
        <h3 className="mt-2 text-xl font-bold text-gray-900">{post.title}</h3>
        <p className="mt-3 text-gray-600 text-sm flex-grow">{post.description}</p>
        <div className="mt-6 border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-gray-400" /><span>{new Date(post.event_date).toLocaleString()}</span></div>
          <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-gray-400" /><span>{post.venue}</span></div>
        </div>
      </div>
      {/* Conditionally render the action section container only if it's not the management view */}
      {!isManagementView && (
        <div className="p-6 bg-gray-50">
            {renderAction()}
        </div>
      )}
    </motion.div>
  );
};