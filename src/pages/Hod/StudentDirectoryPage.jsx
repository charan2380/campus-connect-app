import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import createClerkSupabaseClient from '../../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Search, User } from 'lucide-react';

function StudentDirectoryPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ department: 'All', year: 'All' });

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (error) {
        toast.error("Failed to load student directory.");
      } else {
        setStudents(data);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [getToken]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const departmentMatch = filters.department === 'All' || student.department === filters.department;
      const yearMatch = filters.year === 'All' || student.year?.toString() === filters.year;
      return nameMatch && departmentMatch && yearMatch;
    });
  }, [students, searchTerm, filters]);

  const departments = useMemo(() => ['All', ...new Set(students.map(s => s.department).filter(Boolean))], [students]);
  const years = useMemo(() => ['All', ...new Set(students.map(s => s.year).filter(Boolean).sort((a,b) => a-b))], [students]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="mb-6"><button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button></div>
      
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Student Directory</h1>
        <p className="mt-2 text-lg text-gray-600">Browse, search, and filter student profiles.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 py-2 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-4 sm:ml-4">
          <select value={filters.department} onChange={(e) => setFilters(f => ({...f, department: e.target.value}))} className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          <select value={filters.year} onChange={(e) => setFilters(f => ({...f, year: e.target.value}))} className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
            {years.map(year => <option key={year} value={year}>{year === 'All' ? 'All Years' : `Year ${year}`}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.contact_info || 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                       No students found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredStudents.length > 0 ? filteredStudents.map(student => (
              <div key={student.user_id} className="p-4 space-y-2">
                <p className="font-bold text-gray-900">{student.full_name}</p>
                <p className="text-sm text-gray-500">{student.email}</p>
                <p className="text-sm text-gray-500">{student.department} - Year {student.year}</p>
                <p className="text-sm text-gray-500">Contact: {student.contact_info || 'N/A'}</p>
              </div>
            )) : 
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                <User className="h-10 w-10 text-gray-400 mb-2"/>
                No students found.
            </div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
export default StudentDirectoryPage;