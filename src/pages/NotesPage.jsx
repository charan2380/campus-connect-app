import { useState, useEffect, Fragment, useMemo } from 'react'; // Added useMemo
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeft, Loader2, UploadCloud, Plus, FileText, Download, Trash2, X, Search // Added Search icon
} from 'lucide-react';

// The UploadNoteModal component is unchanged and remains as it was.
const UploadNoteModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleFileChange = (e) => { if (e.target.files) setFiles(Array.from(e.target.files)); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !title) { toast.error("Please provide a title and select at least one file."); return; }
    setIsSubmitting(true);
    const toastId = toast.loading('Uploading files...');
    try {
      const supabase = await createClerkSupabaseClient(getToken);
      const uploadPromises = files.map(file => {
        const filePath = `${user.id}/notes/${Date.now()}-${file.name}`;
        return supabase.storage.from('notes').upload(filePath, file);
      });
      const uploadResults = await Promise.all(uploadPromises);
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) throw new Error(`Failed to upload ${failedUploads.length} file(s).`);
      const fileUrls = uploadResults.map(result => {
        const { data } = supabase.storage.from('notes').getPublicUrl(result.data.path);
        return data.publicUrl;
      });
      const { error: insertError } = await supabase.from('notes').insert({ title, description, file_urls: fileUrls, uploader_id: user.id });
      if (insertError) throw insertError;
      toast.success("Note uploaded successfully!", { id: toastId });
      onUploadSuccess();
      handleClose();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => { setTitle(''); setDescription(''); setFiles([]); onClose(); };
  return (
    <Transition appear show={isOpen} as={Fragment}><Dialog as="div" className="relative z-50" onClose={handleClose}><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child><div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
      <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"><Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 pr-10">Upload New Notes</Dialog.Title><button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label><input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"/></div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label><textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Files</label><div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"><div className="text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-300" /><div className="mt-4 flex text-sm leading-6 text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600"><p>Select files</p><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs leading-5 text-gray-600">PDF, PNG, JPG, etc. up to 10MB each</p>{files.length > 0 && <p className="text-sm font-medium text-indigo-600 mt-2">{files.length} file(s) selected</p>}</div></div></div>
            <div className="mt-6 flex justify-end"><motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }} className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm disabled:bg-indigo-300">{isSubmitting && <Loader2 className="animate-spin" />}Upload</motion.button></div>
        </form>
      </Dialog.Panel>
    </Transition.Child></div></div></Dialog></Transition>
  )
};

// --- Main Page Component ---
function NotesPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // <-- NEW STATE FOR SEARCH

  const fetchNotes = async () => {
    setLoading(true);
    const supabase = await createClerkSupabaseClient(getToken);
    const { data, error } = await supabase
      .from('notes')
      .select(`*, profile:profiles(full_name)`)
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast.error("Failed to load notes.");
    } else {
      setNotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [getToken]);

  // --- NEW LOGIC FOR CLIENT-SIDE FILTERING ---
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return notes; // If search is empty, return all notes
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return notes.filter(note => 
        note.title.toLowerCase().includes(lowercasedTerm) ||
        note.description?.toLowerCase().includes(lowercasedTerm) ||
        note.profile?.full_name?.toLowerCase().includes(lowercasedTerm)
    );
  }, [notes, searchTerm]);
  // --- END OF NEW LOGIC ---


  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure?")) return;
    const toastId = toast.loading('Deleting note...');
    try {
        const supabase = await createClerkSupabaseClient(getToken);
        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        if (error) throw error;
        toast.success('Note deleted!', { id: toastId });
        setNotes(currentNotes => currentNotes.filter(n => n.id !== noteId)); // Optimistic UI update
    } catch(error) {
        toast.error(`Failed to delete note: ${error.message}`, { id: toastId });
    }
  };

  return (
    <>
      <UploadNoteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUploadSuccess={fetchNotes} 
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Notes & Papers</h1>
            <p className="mt-2 text-lg text-gray-600">A shared knowledge base for all students and faculty.</p>
          </div>
          <motion.button onClick={() => setIsModalOpen(true)} whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Upload Notes
          </motion.button>
        </div>

        {/* --- NEW SEARCH BAR UI --- */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title, description, or uploader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        {/* --- END OF NEW UI --- */}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredNotes.map((note) => {
                const isOwner = user?.id === note.uploader_id;
                const isSuperAdmin = user?.publicMetadata?.role === 'super_admin';
                const canDelete = isOwner || isSuperAdmin;
                
                return (
                  <motion.div key={note.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-white rounded-xl shadow-lg flex flex-col">
                    <div className="p-6 flex-grow">
                      <div className="flex justify-between items-start">
                        <FileText className="h-10 w-10 text-indigo-500 bg-indigo-100 p-2 rounded-lg" />
                        {canDelete && (
                          <button onClick={() => handleDelete(note.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-gray-900">{note.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 flex-grow">{note.description}</p>
                      <p className="text-xs text-gray-500 mt-4">Uploaded by {note.profile?.full_name || 'a user'}</p>
                    </div>
                    <div className="p-6 bg-gray-50 border-t">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Attachments ({note.file_urls?.length || 0})</h4>
                      <ul className="space-y-2">
                          {note.file_urls?.map((url, index) => (
                              <li key={index}>
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                      <Download className="h-4 w-4" />
                                      Download File {index + 1}
                                  </a>
                              </li>
                          ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-semibold text-gray-700">No Notes Found</h3>
            <p className="mt-1 text-gray-500">
                {searchTerm ? "No notes match your search." : "Be the first to share your study materials!"}
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default NotesPage;