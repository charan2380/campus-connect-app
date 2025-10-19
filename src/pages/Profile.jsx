import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../supabaseClient';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Camera, Loader2 } from 'lucide-react';
import { StudentProfileFields } from '../components/profile/StudentProfileFields';
import { HodProfileFields } from '../components/profile/HodProfileFields';
import { SuperAdminProfileFields } from '../components/profile/SuperAdminProfileFields';

const Spinner = () => <Loader2 className="animate-spin h-5 w-5 text-white" />;

// We export this so child components can use it without re-importing.
export const FileInputCard = ({ id, label, previewUrl, onFileChange }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center border border-dashed hover:border-indigo-400 transition-colors">
        <label htmlFor={id} className="cursor-pointer flex flex-col items-center">
            {previewUrl ? (
                <img src={previewUrl} alt={`${label} Preview`} className="w-full h-32 object-contain rounded-md mb-2" />
            ) : (
                <div className="w-full h-32 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                </div>
            )}
            <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">{label}</span>
            <span className="text-xs text-gray-500 mt-1">Click to upload</span>
            <input id={id} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </label>
    </div>
);

function ProfilePage() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '', department: '', year: '', contact_info: '',
        bio: '', avatar_url: '', college_id_url: '', bus_id_url: '',
        roll_no: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [collegeIdFile, setCollegeIdFile] = useState(null);
    const [collegeIdPreview, setCollegeIdPreview] = useState('');
    const [busIdFile, setBusIdFile] = useState(null);
    const [busIdPreview, setBusIdPreview] = useState('');

    const userRole = user?.publicMetadata?.role;
    const departmentOptions = ["CAI", "CSE", "CST", "ECE", "ECT", "MECH", "CIVIL", "AIML", "CDS", "EEE"];
    const yearOptions = [1, 2, 3, 4];

    const sanitizeData = (data) => {
        const sanitized = {};
        for (const key in formData) {
            sanitized[key] = data[key] || '';
        }
        return sanitized;
    };

    const loadProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const supabase = await createClerkSupabaseClient(getToken);
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (data) {
            const sanitized = sanitizeData(data);
            setFormData(sanitized);
            setAvatarPreview(sanitized.avatar_url);
            setCollegeIdPreview(sanitized.college_id_url);
            setBusIdPreview(sanitized.bus_id_url);
        }
        setLoading(false);
    }, [user, getToken]); // Correct dependency array

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleFileChange = (setter, previewSetter) => (e) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setter(file);
            previewSetter(URL.createObjectURL(file));
        }
    };

    const uploadFile = async (supabase, file, bucket, userId) => {
        if (!file) return { data: null, error: null };
        const filePath = `${userId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
        if (error) return { data: null, error };
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { data: { publicUrl: urlData.publicUrl }, error: null };
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerateBio = async () => {
        setIsGeneratingBio(true);
        const toastId = toast.loading('Generating with AI...');
        try {
            let prompt;
            if (formData.bio.trim()) {
                prompt = `Rewrite this student profile bio to be more professional and engaging, keeping the core meaning: "${formData.bio}"`;
            } else {
                prompt = `Generate a short, professional student profile bio for ${formData.full_name}, who is in Year ${formData.year} of the ${formData.department} department.`;
            }
            const token = await getToken({ template: 'supabase' });
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to get a response.');
            setFormData({ ...formData, bio: data.text });
            toast.success("Bio updated with AI!", { id: toastId });
        } catch (error) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setIsGeneratingBio(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        const requiredFieldsByRole = {
            student: ['full_name', 'department', 'year', 'roll_no'],
            club_admin: ['full_name', 'department', 'year', 'roll_no'],
            hod: ['full_name', 'department'],
            super_admin: ['full_name'],
        };
        const requiredFields = requiredFieldsByRole[userRole] || ['full_name'];
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].toString().trim() === '') {
                toast.error(`Please fill the required '${field.replace('_', ' ')}' field.`);
                return;
            }
        }
        setSaving(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const supabase = await createClerkSupabaseClient(getToken);
                const [avatarRes, collegeIdRes, busIdRes] = await Promise.all([
                    uploadFile(supabase, avatarFile, 'avatars', user.id),
                    uploadFile(supabase, collegeIdFile, 'college-ids', user.id),
                    uploadFile(supabase, busIdFile, 'bus-ids', user.id)
                ]);
                if (avatarRes.error || collegeIdRes.error || busIdRes.error) {
                    reject(new Error('Image upload failed.'));
                    return;
                }
                const payload = { ...formData };
                payload.year = payload.year === '' || payload.year === null ? null : parseInt(payload.year, 10);
                const updateData = {
                    ...payload,
                    avatar_url: avatarRes.data?.publicUrl || formData.avatar_url,
                    college_id_url: collegeIdRes.data?.publicUrl || formData.college_id_url,
                    bus_id_url: busIdRes.data?.publicUrl || formData.bus_id_url,
                    updated_at: new Date().toISOString(),
                };
                const { error: updateError } = await supabase.from('profiles').update(updateData).eq('user_id', user.id);
                if (updateError) {
                    reject(updateError);
                } else {
                    resolve("Profile updated!");
                    loadProfile();
                }
            } catch (error) {
                reject(error);
            }
        });
        toast.promise(promise, {
            loading: 'Saving changes...',
            success: 'Profile updated!',
            error: (err) => `Error: ${err.message}`
        });
        try {
            await promise;
            // On success, redirect to the correct dashboard
            switch (userRole) {
                case 'student': navigate('/student-dashboard'); break;
                case 'hod': navigate('/hod-dashboard'); break;
                case 'club_admin': navigate('/club-admin-dashboard'); break;
                case 'super_admin': navigate('/super-admin-dashboard'); break;
                default: navigate('/');
            }
        } catch (error) {
            console.error("Submit Error:", error);
        } finally {
            setSaving(false);
        }
    };

    const renderFieldsByRole = () => {
        const props = {
            formData,
            handleInputChange,
            departmentOptions,
            yearOptions,
            handleFileChange,
            setCollegeIdFile,
            setCollegeIdPreview,
            setBusIdFile,
            setBusIdPreview,
            collegeIdPreview,
            busIdPreview,
            handleGenerateBio,
            isGeneratingBio
        };
        switch (userRole) {
            case 'hod':
                return <HodProfileFields {...props} />;
            case 'super_admin':
                return <SuperAdminProfileFields {...props} />;
            case 'student':
            case 'club_admin':
            default:
                return <StudentProfileFields {...props} />;
        }
    };

    if (loading) return <div className="text-center mt-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 sm:p-10">
                        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-5">
                                <motion.div whileHover={{ scale: 1.05 }} className="relative flex-shrink-0">
                                    {/* Made avatar slightly smaller for better balance */}
                                    <img
                                        className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-white shadow-md"
                                        src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.full_name || 'U'}&background=818cf8&color=fff&size=128`}
                                        alt="Avatar"
                                    />
                                    <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110">
                                        <Camera className="h-5 w-5" />
                                        <span className="sr-only">Change photo</span>
                                    </label>
                                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange(setAvatarFile, setAvatarPreview)} />
                                </motion.div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Your Profile</h1>
                                    <p className="text-md text-gray-500 mt-1">Update your photo and personal details.</p>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto">
                                <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.05 }}
                                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 py-2 px-6 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                                    {saving && <Spinner />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </motion.button>
                            </div>
                        </div>
                        <div className="mt-10 pt-8 border-t border-gray-200">
                            {renderFieldsByRole()}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ProfilePage;