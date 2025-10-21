import { useState, useEffect, Fragment } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeft, Loader2, UploadCloud, Plus, Home, Trash2, X, MapPin, Phone
} from 'lucide-react';

// The AddListingModal component is unchanged.
const AddListingModal = ({ isOpen, onClose, onAddSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({ address: '', contact_info: '' });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFileChange = (e) => { if (e.target.files) setFiles(Array.from(e.target.files)); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !formData.address || !formData.contact_info) { toast.error("Please fill all fields and upload at least one photo."); return; }
    setIsSubmitting(true);
    const toastId = toast.loading('Uploading your listing...');
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const uploadPromises = files.map(file => {
        const filePath = `${user.id}/rooms/${Date.now()}-${file.name}`;
        return supabase.storage.from('room-photos').upload(filePath, file);
      });
      const uploadResults = await Promise.all(uploadPromises);
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) throw new Error(`Failed to upload ${failedUploads.length} photo(s).`);
      const photoUrls = uploadResults.map(result => {
        const { data } = supabase.storage.from('room-photos').getPublicUrl(result.data.path);
        return data.publicUrl;
      });
      const { error: insertError } = await supabase.from('room_rentals').insert({ ...formData, photos_urls: photoUrls, user_id: user.id });
      if (insertError) throw insertError;
      toast.success("Listing added successfully!", { id: toastId });
      onAddSuccess();
      handleClose();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => { setFormData({ address: '', contact_info: '' }); setFiles([]); onClose(); };
  return (
     <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">Add a New Room Listing</Dialog.Title>
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div><label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label><textarea name="address" id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required rows="2" className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"/></div>
              <div><label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">Contact Info</label><input type="text" name="contact_info" id="contact_info" value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} required className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"/></div>
              <div><label className="block text-sm font-medium text-gray-700">Photos (select multiple)</label><div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"><div className="text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-300" /><div className="mt-4 flex text-sm text-gray-600"><label htmlFor="file-upload-rooms" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600"><p>Select files</p><input id="file-upload-rooms" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple accept="image/*"/></label></div><p className="text-xs text-gray-600">{files.length > 0 ? `${files.length} photo(s) selected` : "PNG, JPG up to 10MB each"}</p></div></div></div>
              <div className="mt-6 flex justify-end"><motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }} className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm disabled:bg-indigo-300">{isSubmitting && <Loader2 className="animate-spin" />}Add Listing</motion.button></div>
            </form>
          </Dialog.Panel>
        </Transition.Child></div></div>
      </Dialog>
    </Transition>
  );
};


function RoomRentalsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);

    // --- THIS IS THE MODIFIED QUERY ---
    // We now select 'full_name', 'avatar_url', AND 'roll_no'
    const { data, error } = await supabase
      .from('room_rentals')
      .select(`*, profile:profiles(full_name, avatar_url, roll_no)`)
      .order('created_at', { ascending: false });
    // --- END OF MODIFICATION ---

    if (error) {
      toast.error("Failed to load listings.");
    } else {
      setListings(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [getToken]);

  const handleDelete = async (listingId) => {
    if (!window.confirm("Are you sure?")) return;
    const toastId = toast.loading('Deleting listing...');
    try {
        const supabase = await createClerkSupabaseClient(getToken);
        const { error } = await supabase.from('room_rentals').delete().eq('id', listingId);
        if (error) throw error;
        toast.success('Listing deleted!', { id: toastId });
        setListings(currentListings => currentListings.filter(l => l.id !== listingId));
    } catch(error) {
        toast.error(`Failed to delete: ${error.message}`, { id: toastId });
    }
  };

  return (
    <>
      <AddListingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddSuccess={fetchListings} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Room Rentals</h1>
            <p className="mt-2 text-lg text-gray-600">Find or list available PG/room rentals near campus.</p>
          </div>
          <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Add Your Listing
          </motion.button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {listings.map((listing) => (
                <motion.div key={listing.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
                  <div className="relative">
                    <img src={listing.photos_urls[0]} alt="Room" className="h-56 w-full object-cover"/>
                    {(user?.id === listing.user_id || user?.publicMetadata?.role === 'super_admin') && (
                        <motion.button whileHover={{scale: 1.1}} onClick={() => handleDelete(listing.id)} className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors">
                            <Trash2 className="h-5 w-5" />
                        </motion.button>
                    )}
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex-grow">
                        <p className="flex items-start gap-2 text-sm text-gray-600 mb-2"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0"/> {listing.address}</p>
                        <p className="flex items-center gap-2 text-sm text-gray-800 font-semibold"><Phone className="h-4 w-4"/> {listing.contact_info}</p>
                    </div>
                    <div className="border-t mt-4 pt-4 flex items-center gap-3">
                        <img src={listing.profile?.avatar_url || `https://ui-avatars.com/api/?name=${listing.profile?.full_name || 'U'}`} className="h-10 w-10 rounded-full object-cover bg-gray-200"/>
                        <div>
                            {/* --- THIS IS THE MODIFIED DISPLAY LOGIC --- */}
                            <p className="text-sm font-semibold text-gray-900">{listing.profile?.full_name}</p>
                            {listing.profile?.roll_no && <p className="text-xs text-gray-500">{listing.profile.roll_no}</p>}
                            {/* --- END OF MODIFICATION --- */}
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-semibold text-gray-700">No Listings Available</h3>
            <p className="mt-1 text-gray-500">Be the first to add a room or PG listing!</p>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default RoomRentalsPage;