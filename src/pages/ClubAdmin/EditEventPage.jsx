import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Loader2 } from 'lucide-react';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

function EditEventPage() {
  const { eventId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch the existing event data to pre-fill the form
  const loadEventData = useCallback(async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    const { data, error } = await supabase
      .from('club_posts')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      toast.error("Could not load event data.");
      console.error("Fetch Error:", error);
      navigate('/club-admin/manage-events');
    } else {
      // Format the date for the datetime-local input
      const eventDate = new Date(data.event_date);
      // Adjust for timezone offset before formatting
      eventDate.setMinutes(eventDate.getMinutes() - eventDate.getTimezoneOffset());
      const formattedDate = eventDate.toISOString().slice(0, 16);

      setFormData({
        title: data.title,
        description: data.description,
        event_date: formattedDate,
        venue: data.venue,
      });
      setPosterPreview(data.poster_image_url);
    }
    setLoading(false);
  }, [eventId, getToken, navigate]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    setSubmitting(true);
    const toastId = toast.loading('Updating event post...');

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      let posterUrl = posterPreview; // Start with the existing URL

      // 1. If a new file was selected, upload it
      if (posterFile) {
        // We need the user id for the file path
        const { data: { user } } = await supabase.auth.getUser();
        const filePath = `${user.id}/${Date.now()}-${posterFile.name}`;
        const { error: uploadError } = await supabase.storage.from('event-posters').upload(filePath, posterFile, { upsert: true });
        if (uploadError) throw new Error(`Poster Upload Failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('event-posters').getPublicUrl(filePath);
        posterUrl = urlData.publicUrl;
      }

      // 2. Prepare the data and UPDATE the record in the database
      const { error: updateError } = await supabase
        .from('club_posts')
        .update({
          ...formData,
          poster_image_url: posterUrl,
        })
        .eq('id', eventId);
      
      if (updateError) throw new Error(`Event Update Failed: ${updateError.message}`);
      
      toast.success('Event updated successfully!', { id: toastId });
      navigate('/club-admin/manage-events');

    } catch (error) {
      console.error("Event Update Error:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Management
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event/Post</h1>
        <p className="text-gray-500 mb-8">Modify the details for your event below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">Date & Time</label>
              <input type="datetime-local" name="event_date" id="event_date" value={formData.event_date} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">Venue</label>
              <input type="text" name="venue" id="venue" value={formData.venue} onChange={handleInputChange} required className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} required rows="6" className="mt-1 block w-full p-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Event Poster</label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  {posterPreview ? <img src={posterPreview} alt="Poster preview" className="mx-auto h-40 w-auto object-contain rounded-md" /> : <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />}
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none hover:text-indigo-500">
                      <span>Upload a new file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handlePosterChange} accept="image/*"/>
                    </label>
                  </div>
                   <p className="text-xs leading-5 text-gray-600">Replaces the existing poster.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="inline-flex justify-center items-center gap-2 py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300">
              {submitting ? <Spinner /> : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default EditEventPage;