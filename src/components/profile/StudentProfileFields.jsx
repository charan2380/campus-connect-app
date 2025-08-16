import { FileInputCard } from '../../pages/Profile';
import { Sparkles, Loader2 } from 'lucide-react'; // Import icons

export const StudentProfileFields = ({ formData, handleInputChange, handleFileChange, setCollegeIdFile, setCollegeIdPreview, setBusIdFile, setBusIdPreview, collegeIdPreview, busIdPreview, handleGenerateBio, isGeneratingBio }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ... (other fields are unchanged) ... */}
        <div><label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
        <div><label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">Contact Number</label><input type="text" name="contact_info" id="contact_info" value={formData.contact_info} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
        <div><label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label><input type="text" name="department" id="department" value={formData.department} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
        <div><label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label><input type="number" name="year" id="year" value={formData.year} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
        
        {/* --- THIS IS THE MODIFIED BIO SECTION --- */}
        <div className="sm:col-span-2">
          <div className="flex justify-between items-center">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400">
                {isGeneratingBio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {formData.bio.trim() ? 'Improve with AI' : 'Auto-generate'}
            </button>
          </div>
          <textarea name="bio" id="bio" rows="4" value={formData.bio} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"></textarea>
        </div>
        {/* --- END OF MODIFICATION --- */}
      </div>
      <div className="pt-6 border-t">
        <label className="block text-base font-medium text-gray-900">ID Cards</label>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileInputCard id="college-id-upload" label="College ID" previewUrl={collegeIdPreview} onFileChange={handleFileChange(setCollegeIdFile, setCollegeIdPreview)} />
          <FileInputCard id="bus-id-upload" label="Bus ID" previewUrl={busIdPreview} onFileChange={handleFileChange(setBusIdFile, setBusIdPreview)} />
        </div>
      </div>
    </div>
  );
};