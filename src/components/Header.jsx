import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageSquare } from 'lucide-react'; // Added MessageSquare icon

const MobileNav = ({ closeMenu }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="absolute top-full left-0 w-full bg-white shadow-lg lg:hidden"
    >
      <div className="flex flex-col items-center space-y-4 p-6">
        <SignedIn>
          <Link to="/dashboard" onClick={closeMenu} className="text-gray-600 hover:text-indigo-600 transition-colors w-full text-center py-2">
            Dashboard
          </Link>
          {/* --- ADDED MESSAGES LINK FOR MOBILE --- */}
          <Link to="/messages" onClick={closeMenu} className="text-gray-600 hover:text-indigo-600 transition-colors w-full text-center py-2">
            Messages
          </Link>
          <hr className="w-full border-gray-200" />
          <div className="flex justify-center w-full pt-2">
             <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
          </div>
        </SignedIn>

        <SignedOut>
          <Link to="/sign-in" onClick={closeMenu} className="w-full text-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
            Sign In
          </Link>
          <Link to="/sign-up" onClick={closeMenu} className="w-full text-center px-4 py-2 rounded-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Sign Up
          </Link>
        </SignedOut>
      </div>
    </motion.div>
  );
};


function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <nav className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="text-2xl font-bold text-indigo-600" onClick={handleCloseMenu}>
          CampusConnect
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <SignedIn>
            <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            {/* --- ADDED MESSAGES LINK FOR DESKTOP --- */}
            <Link to="/messages" className="text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
          </SignedIn>

          <SignedOut>
            <Link to="/sign-in" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
              Sign In
            </Link>
             <Link to="/sign-up" className="px-4 py-2 rounded-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Sign Up
            </Link>
          </SignedOut>
        </div>

        {/* Hamburger Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
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