import { Sparkles, Loader2, User, Phone } from 'lucide-react';

const InputField = ({ id, label, value, onChange, placeholder, icon: Icon, required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon className="h-5 w-5 text-gray-400" /></div>
            <input type="text" name={id} id={id} value={value} onChange={onChange} className="block w-full rounded-md border-gray-300 pl-10 py-3 px-4 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder={placeholder} />
        </div>
    </div>
);

export const SuperAdminProfileFields = ({ formData, handleInputChange, handleGenerateBio, isGeneratingBio }) => {
  return (
    <div>
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InputField id="full_name" label="Full Name" value={formData.full_name} onChange={handleInputChange} icon={User} required />
            <InputField id="contact_info" label="Contact Number" value={formData.contact_info} onChange={handleInputChange} icon={Phone} />
            
            {/* --- THIS IS THE CORRECTED BIO SECTION --- */}
            <div className="sm:col-span-2 relative">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea name="bio" id="bio" rows="4" value={formData.bio} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm pr-10"></textarea>
                <button
                  type="button"
                  onClick={handleGenerateBio}
                  disabled={isGeneratingBio}
                  className="absolute top-8 right-2 p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:text-gray-300"
                  title={formData.bio.trim() ? 'Improve with AI' : 'Auto-generate Bio'}
                >
                  {isGeneratingBio ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                </button>
            </div>
            {/* --- END OF CORRECTION --- */}
        </div>
    </div>
  );
};