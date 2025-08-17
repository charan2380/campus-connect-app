import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Mail, Phone, User, BookOpen, Hash, Calendar, School, Bus } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, value }) => (
    <div>
        <dt className="flex items-center text-sm font-medium text-gray-500">
            <Icon className="h-4 w-4 text-gray-400 mr-2" />
            <span>{label}</span>
        </dt>
        <dd className="mt-1 text-base text-gray-900">{value || 'N/A'}</dd>
    </div>
);

const ImageDisplay = ({ label, url }) => (
    <div className="text-center">
        <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
        {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={`${label} preview`} className="w-full h-40 object-contain rounded-lg border bg-gray-50 hover:opacity-80 transition-opacity" />
            </a>
        ) : (
            <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-400">
                Not Uploaded
            </div>
        )}
    </div>
);

export function StudentProfileCard({ student, isOpen, onClose }) {
  if (!student) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.full_name}`} alt="Avatar" className="h-20 w-20 rounded-full object-cover"/>
                        <div>
                            <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900">
                                {student.full_name}
                            </Dialog.Title>
                            <p className="mt-1 text-gray-500">{student.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="h-5 w-5"/></button>
                </div>

                <div className="mt-6 border-t pt-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                        <DetailItem icon={Hash} label="Roll Number" value={student.roll_no} />
                        <DetailItem icon={School} label="Department" value={student.department} />
                        <DetailItem icon={Calendar} label="Year" value={student.year} />
                        <DetailItem icon={Phone} label="Contact Number" value={student.contact_info} />
                        <div className="sm:col-span-2">
                             <DetailItem icon={User} label="Bio" value={student.bio} />
                        </div>
                    </dl>
                </div>
                
                <div className="mt-6 border-t pt-6">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ImageDisplay label="College ID" url={student.college_id_url} />
                        <ImageDisplay label="Bus ID" url={student.bus_id_url} />
                     </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}