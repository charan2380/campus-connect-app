import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Bell, MessageSquare, BookOpen, MapPin } from 'lucide-react';

// --- FEATURE CARD WITH VERY SUBTLE ANIMATIONS ---
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      // Simplified hover effect: just a gentle lift
      whileHover={{ y: -4 }}
      transition={{ ease: "easeInOut", duration: 0.2 }}
      className="bg-white p-8 rounded-xl shadow-md h-full" // Reduced shadow
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 mb-5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};
// --- END OF MODIFIED COMPONENT ---


function HomePage() {
  const features = [
    { icon: Zap, title: "Centralized Hub", description: "One platform for all campus communication, replacing disparate systems and email chains." },
    { icon: Bell, title: "Instant Alerts", description: "Receive campus-wide alerts and important notifications directly on your portal." },
    { icon: Users, title: "Club & Event Hub", description: "Discover clubs, register for events, and stay connected with campus life." },
    { icon: BookOpen, title: "Shared Knowledge", description: "Access and share notes, past papers, and academic resources with fellow students." },
    { icon: MessageSquare, title: "Direct Chat", description: "Initiate one-on-one chats with any user on the platform for quick communication." },
    { icon: MapPin, title: "Campus Services", description: "Find lost items, request medication, and discover local room rentals all in one place." },
  ];

  return (
    <div className="space-y-24 md:space-y-32 pb-20">
      
      {/* --- NEW SIMPLE, CENTERED HERO SECTION (NO PHOTO) --- */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center container mx-auto pt-16"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900">
          The Unified Campus
          <span className="block text-indigo-600 mt-2">Operating System</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto leading-8 text-gray-600">
          CampusConnect integrates every aspect of student life into a single, streamlined digital hub. Say goodbye to confusion and hello to efficiency.
        </p>
        <div className="mt-10 flex items-center justify-center">
            <Link
              to="/sign-up"
              className="rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors duration-300"
            >
              Get Started
            </Link>
        </div>
      </motion.section>
      {/* --- END OF HERO SECTION --- */}


      {/* Features Section */}
      <section className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">Everything You Need, All In One Place</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            From academics to social life, CampusConnect has you covered with a suite of powerful, integrated tools.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} index={index} {...feature} />
          ))}
        </div>
      </section>

    </div>
  );
}

export default HomePage;