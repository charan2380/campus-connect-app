export const HodProfileFields = ({ formData, handleInputChange }) => {
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
      {/* Department is on its own line for better grid flow */}
      <div className="sm:col-span-2">
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
        <input type="text" name="department" id="department" value={formData.department} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea name="bio" id="bio" rows="4" value={formData.bio} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"></textarea>
      </div>
    </div>
  );
};