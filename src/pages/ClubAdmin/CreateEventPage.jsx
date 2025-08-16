import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../../supabaseClient'; // Note the path change ../../
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Loader2, Calendar, MapPin, FileText, Type } from 'lucide-react';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

function CreateEventPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    venue: '',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminClubId, setAdminClubId] = useState(null);

  // Fetch the club ID associated with the logged-in Club Admin
  useEffect(() => {
    const fetchAdminClub = async () => {
      if (!user) return;
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase
        .from('clubs')
        .select('id')
        .eq('club_admin_id', user.id)
        .single();
      
      if (error) {
        toast.error("You are not assigned to a club. Contact a super admin.");
        navigate('/club-admin-dashboard'); // Redirect if not an admin of any club
      } else {
        setAdminClubId(data.id);
      }
    };
    fetchAdminClub();
  }, [user, getToken, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePosterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminClubId) {
      toast.error("Club information is missing. Cannot create event.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Creating event post...');

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      let posterUrl = null;

      // 1. Upload poster image
      if (posterFile) {
        const filePath = `${user.id}/${Date.now()}-${posterFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(filePath, posterFile);
        if (uploadError) throw new Error(`Poster Upload Failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('event-posters').getPublicUrl(filePath);
        posterUrl = urlData.publicUrl;
      }

      // 2. Insert the new post into the database
      const { error: insertError } = await supabase
        .from('club_posts')
        .insert({
          ...formData,
          club_id: adminClubId,
          poster_image_url: posterUrl,
        });
      
      if (insertError) throw new Error(`Event Creation Failed: ${insertError.message}`);
      
      toast.success('Event created successfully!', { id: toastId });
      navigate('/club-admin/manage-events'); // Redirect to the management page

    } catch (error) {
      console.error("Event Creation Error:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Management
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event/Post</h1>
        <p className="text-gray-500 mb-8">This post will be visible to all students on the Club Feed.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Annual Tech Fest 2025" />
            </div>
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">Date & Time</label>
              <input type="datetime-local" name="event_date" id="event_date" value={formData.event_date} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">Venue</label>
              <input type="text" name="venue" id="venue" value={formData.venue} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., College Auditorium" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} required rows="6" className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Describe the event, rules, schedule, etc." />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Event Poster</label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  {posterPreview ? <img src={posterPreview} alt="Poster preview" className="mx-auto h-40 w-auto object-contain rounded-md" /> : <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />}
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handlePosterChange} accept="image/*"/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                   <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <motion.button type="submit" disabled={submitting || !adminClubId} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="inline-flex justify-center items-center gap-2 py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300">
              {submitting ? <Spinner /> : 'Create Post'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default CreateEventPage;