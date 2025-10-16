// 📂 src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// Components & Pages
import Header from './components/Header';
import Home from './pages/Home';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import ProfilePage from './pages/Profile';
import Dashboard from './pages/Dashboard';
import MessagesPage from './pages/MessagesPage';

// Dashboards
import StudentDashboard from './pages/StudentDashboard';
import HodDashboard from './pages/HodDashboard';
import ClubAdminDashboard from './pages/ClubAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Student Feature Pages
import LostAndFoundPage from './pages/LostAndFoundPage';
import ReportItemPage from './pages/ReportItemPage';
import MedicationRequestPage from './pages/MedicationRequestPage';
import MyRequestsPage from './pages/MyRequestsPage';
import ClubFeedPage from './pages/ClubFeedPage';
import NotesPage from './pages/NotesPage';
import RoomRentalsPage from './pages/RoomRentalsPage';
import FeedbackPage from './pages/FeedbackPage';
import MyFeedbackPage from './pages/MyFeedbackPage';

// HOD Pages
import MedicationRequestsPage from './pages/Hod/MedicationRequestsPage';
import HodViewFeedbackPage from './pages/Hod/ViewFeedbackPage';
import StudentDirectoryPage from './pages/Hod/StudentDirectoryPage';
import HodAlertManagementPage from './pages/Hod/AlertManagementPage';

// Club Admin Pages
import ManageEventsPage from './pages/ClubAdmin/ManageEventsPage';
import CreateEventPage from './pages/ClubAdmin/CreateEventPage';
import EditEventPage from './pages/ClubAdmin/EditEventPage';
import ViewRegistrationsPage from './pages/ClubAdmin/ViewRegistrationsPage';
import ClubAdminViewFeedbackPage from './pages/ClubAdmin/ViewFeedbackPage';

// Super Admin Pages
import SuperAdminViewFeedbackPage from './pages/SuperAdmin/ViewFeedbackPage';
import UserManagementPage from './pages/SuperAdmin/UserManagementPage';
import AlertManagementPage from './pages/SuperAdmin/AlertManagementPage';

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
};

function App() {
  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Profile Completion Check Happens in Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Role-Specific Dashboards */}
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/hod-dashboard" element={<ProtectedRoute><HodDashboard /></ProtectedRoute>} />
          <Route path="/club-admin-dashboard" element={<ProtectedRoute><ClubAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin-dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

          {/* Common Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/messages/:recipientId?" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

          {/* Student Feature Routes */}
          <Route path="/lost-and-found" element={<ProtectedRoute><LostAndFoundPage /></ProtectedRoute>} />
          <Route path="/report-item" element={<ProtectedRoute><ReportItemPage /></ProtectedRoute>} />
          <Route path="/medication-request" element={<ProtectedRoute><MedicationRequestPage /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute><MyRequestsPage /></ProtectedRoute>} />
          <Route path="/club-feed" element={<ProtectedRoute><ClubFeedPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/room-rentals" element={<ProtectedRoute><RoomRentalsPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="/my-feedback" element={<ProtectedRoute><MyFeedbackPage /></ProtectedRoute>} />

          {/* HOD Feature Routes */}
          <Route path="/hod/medication-requests" element={<ProtectedRoute><MedicationRequestsPage /></ProtectedRoute>} />
          <Route path="/hod/view-feedback" element={<ProtectedRoute><HodViewFeedbackPage /></ProtectedRoute>} />
          <Route path="/hod/student-directory" element={<ProtectedRoute><StudentDirectoryPage /></ProtectedRoute>} />
          <Route path="/hod/alert-management" element={<ProtectedRoute><HodAlertManagementPage /></ProtectedRoute>} />

          {/* Club Admin Feature Routes */}
          <Route path="/club-admin/manage-events" element={<ProtectedRoute><ManageEventsPage /></ProtectedRoute>} />
          <Route path="/club-admin/create-event" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
          <Route path="/club-admin/edit-event/:eventId" element={<ProtectedRoute><EditEventPage /></ProtectedRoute>} />
          <Route path="/club-admin/event-registrations/:eventId" element={<ProtectedRoute><ViewRegistrationsPage /></ProtectedRoute>} />
          <Route path="/club-admin/view-feedback" element={<ProtectedRoute><ClubAdminViewFeedbackPage /></ProtectedRoute>} />

          {/* Super Admin Feature Routes */}
          <Route path="/super-admin/view-feedback" element={<ProtectedRoute><SuperAdminViewFeedbackPage /></ProtectedRoute>} />
          <Route path="/super-admin/user-management" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
          <Route path="/super-admin/alert-management" element={<ProtectedRoute><AlertManagementPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
