import { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, Loader2, Sparkles } from 'lucide-react'; // Added Sparkles icon

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

function ReportItemPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('found');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false); // New state for AI button

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // --- THIS IS THE NEW AI DESCRIPTION GENERATOR FUNCTION ---
  const handleGenerateDescription = async () => {
    if (!itemName.trim()) {
      toast.error("Please enter an item name first to generate a description.");
      return;
    }

    setIsGeneratingDesc(true);
    const toastId = toast.loading('Generating description with AI...');

    try {
        const prompt = `A student is reporting a ${status} item on a college campus notice board. Based on the item's name/keywords "${itemName}", write a clear, helpful, and brief description for the report. If the item is lost, ask the finder to make contact. If the item is found, state where it can be collected.`;
        
        const token = await getToken({ template: 'supabase' });
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-ai-chat`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt }),
            }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to get a response.');

        setDescription(data.text);
        toast.success("Description generated!", { id: toastId });

    } catch (error) {
        toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
        setIsGeneratingDesc(false);
    }
  };
  // --- END OF NEW FUNCTION ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !itemName || !description) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting your report...');

    try {
      const supabase = await createClerkSupabaseClient(getToken);
      let imageUrl = null;

      if (imageFile) {
        const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('lost-and-found-items').upload(filePath, imageFile);
        if (uploadError) throw new Error(`Image Upload Failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('lost-and-found-items').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('lost_and_found_items').insert({
        user_id: user.id,
        item_name: itemName,
        description: description,
        status: status,
        image_url: imageUrl,
      });
      
      if (insertError) throw new Error(`Database Insert Failed: ${insertError.message}`);

      toast.success('Item reported successfully!', { id: toastId });
      navigate('/lost-and-found');

    } catch (error) {
      console.error("Report Submission Error:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to Lost & Found
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Item</h1>
        <p className="text-gray-500 mb-8">Fill out the details below to report a lost or found item.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Status</label>
            <div className="flex rounded-lg shadow-sm">
              <button type="button" onClick={() => setStatus('found')}
                className={`flex-1 py-3 text-sm font-semibold rounded-l-lg transition-colors ${status === 'found' ? 'bg-indigo-600 text-white z-10' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                I Found Something
              </button>
              <button type="button" onClick={() => setStatus('lost')}
                className={`flex-1 py-3 text-sm font-semibold rounded-r-lg transition-colors -ml-px ${status === 'lost' ? 'bg-indigo-600 text-white z-10' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                I Lost Something
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">Item Name / Keywords</label>
            <input type="text" id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 sm:text-base p-3"
              placeholder="e.g., Black Leather Wallet, Red Water Bottle"
            />
          </div>

          {/* --- THIS IS THE MODIFIED DESCRIPTION SECTION --- */}
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400">
                {isGeneratingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate with AI
              </button>
            </div>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 sm:text-base p-3"
              placeholder="Describe the item, location, etc. Or let AI help you!"
            />
          </div>
          {/* --- END OF MODIFICATION --- */}

          <div>
            <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                {imagePreview ? (<img src={imagePreview} alt="Item preview" className="mx-auto h-32 w-auto object-contain rounded-md" />) : (<UploadCloud className="mx-auto h-12 w-12 text-gray-300" />)}
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600"><p>Upload a file</p><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/></label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.05 }}
              className="inline-flex justify-center items-center gap-2 py-3 px-8 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
              {submitting ? <Spinner /> : 'Submit Report'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default ReportItemPage;