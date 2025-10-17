import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// --- 1. IMPORT useClerk HOOK ---
import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageSquare, LogOut, User } from 'lucide-react'; // Added LogOut and User icons

// --- THIS IS THE UPGRADED MobileNav COMPONENT ---
const MobileNav = ({ closeMenu }) => {
  const { signOut } = useClerk(); // Get the signOut function
  const navigate = useNavigate();

  // Create a custom sign out handler
  const handleSignOut = () => {
    signOut(() => navigate('/')); // Sign out and then navigate to the home page
    closeMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-full left-0 w-full bg-white shadow-lg lg:hidden"
    >
      <div className="flex flex-col items-stretch space-y-2 p-4">
        <SignedIn>
          <Link to="/dashboard" onClick={closeMenu} className="text-gray-700 hover:bg-gray-100 block px-4 py-3 rounded-md text-base font-medium">Dashboard</Link>
          <Link to="/messages" onClick={closeMenu} className="text-gray-700 hover:bg-gray-100 block px-4 py-3 rounded-md text-base font-medium">Messages</Link>
          <Link to="/profile" onClick={closeMenu} className="text-gray-700 hover:bg-gray-100 block px-4 py-3 rounded-md text-base font-medium flex items-center gap-2"><User className="h-5 w-5"/>Manage Account</Link>
          <hr className="my-2 border-gray-200" />
          {/* --- 2. REPLACE UserButton WITH A CUSTOM SIGNOUT BUTTON --- */}
          <button
            onClick={handleSignOut}
            className="w-full text-left text-red-600 hover:bg-red-50 block px-4 py-3 rounded-md text-base font-medium flex items-center gap-2"
          >
            <LogOut className="h-5 w-5"/>
            Sign out
          </button>
        </SignedIn>

        <SignedOut>
          <Link to="/sign-in" onClick={closeMenu} className="w-full text-center px-4 py-2 rounded-full text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">Sign In</Link>
          <Link to="/sign-up" onClick={closeMenu} className="w-full text-center mt-2 px-4 py-2 rounded-full text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">Sign Up</Link>
        </SignedOut>
      </div>
    </motion.div>
  );
};
// --- END OF UPGRADE ---


function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleCloseMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <nav className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="text-2xl font-bold text-indigo-600" onClick={handleCloseMenu}>CampusConnect</Link>

        {/* Desktop Navigation (Unchanged) */}
        <div className="hidden lg:flex items-center gap-4">
          <SignedIn>
            <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
            <Link to="/messages" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4" />Messages</Link>
            <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
          </SignedIn>
          <SignedOut>
            <Link to="/sign-in" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">Sign In</Link>
            <Link to="/sign-up" className="px-4 py-2 rounded-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Sign Up</Link>
          </SignedOut>
        </div>

        <div className="lg:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-gray-700 hover:bg-gray-100">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {mobileMenuOpen && <MobileNav closeMenu={handleCloseMenu} />}
      </AnimatePresence>
    </header>
  );
}
export default Header;