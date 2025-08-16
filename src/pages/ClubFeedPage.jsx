import { useState, useEffect, Fragment } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../supabaseClient';
// 1. --- THIS IS THE FIX: Added 'motion' to the import ---
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, X, UploadCloud, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { EventCard } from '../components/EventCard';

// The RegistrationModal component
const RegistrationModal = ({ isOpen, onClose, post, user, getToken }) => {
    const [formData, setFormData] = useState({ roll_no: '', department: '', year: '', student_name: '' });
    const [resumeFile, setResumeFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            const fetchProfile = async () => {
                const supabase = await createClerkSupabaseClient(getToken);
                const { data } = await supabase.from('profiles').select('full_name, department, year').eq('user_id', user.id).single();
                if (data) {
                    setFormData(prev => ({ ...prev, student_name: data.full_name || '', department: data.department || '', year: data.year || '' }));
                }
            };
            fetchProfile();
        }
    }, [isOpen, user, getToken]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading('Submitting your registration...');
        try {
            const supabase = await createClerkSupabaseClient(getToken);
            let resumeUrl = null;
            if (resumeFile) {
                const filePath = `${user.id}/resumes/${Date.now()}-${resumeFile.name}`;
                const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, resumeFile);
                if (uploadError) throw new Error(`Resume Upload Failed: ${uploadError.message}`);
                const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
                resumeUrl = urlData.publicUrl;
            }
            const { error: insertError } = await supabase.from('event_registrations').insert({
                post_id: post.id,
                student_id: user.id,
                roll_no: formData.roll_no,
                department: formData.department,
                year: parseInt(formData.year, 10),
                student_name: formData.student_name,
                resume_url: resumeUrl,
            });

            // --- THIS IS THE CRITICAL CHANGE ---
            if (insertError) {
                // Check if the error is the specific 'unique constraint violation'
                if (insertError.code === '23505') {
                    // If so, throw a new, user-friendly error message
                    throw new Error("You are already registered for this event.");
                } else {
                    // Otherwise, throw the original database error
                    throw new Error(insertError.message);
                }
            }
            // --- END OF CHANGE ---

            toast.success('Registration successful!', { id: toastId });
            onClose(true);
        } catch (error) {
            // The catch block will now receive our user-friendly message
            toast.error(`Registration failed: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 pr-10">
                      Register for: {post?.title}
                    </Dialog.Title>
                    <button onClick={() => onClose(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="student_name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="student_name" id="student_name" value={formData.student_name} readOnly
                          className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed focus:ring-0"/>
                      </div>
                      <div>
                        <label htmlFor="roll_no" className="block text-sm font-medium text-gray-700">Roll Number</label>
                        <input type="text" name="roll_no" id="roll_no" value={formData.roll_no} onChange={handleInputChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                          <input type="text" name="department" id="department" value={formData.department} onChange={handleInputChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                        </div>
                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                          <input type="number" name="year" id="year" value={formData.year} onChange={handleInputChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
                        </div>
                      </div>
                       <div>
                          <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Resume (Optional)</label>
                          <div className="mt-1 flex items-center justify-center w-full">
                            <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-gray-500"/>
                                <p className="mb-2 text-sm text-gray-500">{resumeFile ? resumeFile.name : <><span className="font-semibold">Click to upload</span> or drag and drop</>}</p>
                              </div>
                              <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf"/>
                            </label>
                          </div>
                       </div>
                      <div className="mt-6 flex justify-end">
                        {/* This motion.button will now work correctly */}
                        <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Registration'}
                        </motion.button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
    );
};

// The main ClubFeedPage component
function ClubFeedPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const handleOpenModal = (post) => {
    if (registeredEventIds.has(post.id)) {
      toast.success("You are already registered for this event!");
      return;
    }
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = (didRegister) => {
    setIsModalOpen(false);
    if (didRegister) {
      setRegisteredEventIds(prev => new Set(prev).add(selectedPost.id));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this event post?")) return;
    const toastId = toast.loading("Deleting post...");
    try {
        const supabase = await createClerkSupabaseClient(getToken);
        const { error } = await supabase.from('club_posts').delete().eq('id', postId);
        if (error) throw error;
        setPosts(current => current.filter(p => p.id !== postId));
        toast.success("Post deleted successfully!", { id: toastId });
    } catch (error) {
        toast.error(`Failed to delete post: ${error.message}`, { id: toastId });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      
      const [postsResponse, registrationsResponse] = await Promise.all([
        supabase.from('club_posts').select(`*, clubs ( club_name, club_admin_id )`).order('event_date', { ascending: true }),
        user?.publicMetadata?.role === 'student' 
            ? supabase.from('event_registrations').select('post_id').eq('student_id', user.id)
            : Promise.resolve({ data: [], error: null })
      ]);

      if (postsResponse.error) {
        toast.error("Failed to load the club feed.");
      } else {
        setPosts(postsResponse.data);
      }

      if (registrationsResponse.error) {
        toast.error("Could not check your registration status.");
      } else {
        setRegisteredEventIds(new Set(registrationsResponse.data.map(r => r.post_id)));
      }

      setLoading(false);
    };
    if (user) {
        fetchData();
    }
  }, [getToken, user]);

  return (
    <>
      <RegistrationModal isOpen={isModalOpen} onClose={handleCloseModal} post={selectedPost} user={user} getToken={getToken} />
      <div className="space-y-8">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Club Feed & Events</h1>
          <p className="mt-2 text-lg text-gray-600">Discover what's happening on campus.</p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => 
                <EventCard 
                    key={post.id} 
                    post={post} 
                    onRegisterClick={handleOpenModal} 
                    isRegistered={registeredEventIds.has(post.id)} 
                    currentUser={user} 
                    onDelete={handleDeletePost} 
                />
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-semibold text-gray-700">It's Quiet Right Now...</h3>
            <p className="mt-1 text-gray-500">There are no upcoming events posted. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}

export default ClubFeedPage;