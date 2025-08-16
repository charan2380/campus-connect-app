import { Sparkles, Loader2 } from 'lucide-react'; // Import icons for consistency

export const HodProfileFields = ({ formData, handleInputChange, departmentOptions, handleGenerateBio, isGeneratingBio }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" />
      </div>
      <div>
        <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">Contact Number</label>
        <input type="text" name="contact_info" id="contact_info" value={formData.contact_info} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" />
      </div>
      
      {/* --- THIS IS THE MODIFIED DEPARTMENT FIELD --- */}
      <div className="sm:col-span-2">
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Your Department</label>
        <p className="text-xs text-gray-500 mb-1">This is the department whose requests and feedback you will manage.</p>
        <select
          name="department"
          id="department"
          value={formData.department}
          onChange={handleInputChange}
          className="block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="" disabled>Select your department</option>
          {departmentOptions.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>
      {/* --- END OF MODIFICATION --- */}
      
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
    </div>
  );
};