import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Bell, MessageSquare, BookOpen, MapPin } from 'lucide-react';

// Import your images
import heroImage from '../assets/hero-image.jpg';
import campusOverviewImage from '../assets/campus-overview.jpg';


// --- Feature Card with Border and Shadow ---
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.1, duration: 0.4 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)",
        borderColor: "rgba(99,102,241,0.4)",
      }}
      transition={{ ease: "easeInOut", duration: 0.2 }}
      className="bg-white p-8 rounded-xl shadow-md border border-gray-200 h-full transition-all duration-300"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mb-5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};


// --- Main Home Page Component ---
function HomePage() {
  const features = [
    { icon: Zap, title: "Centralized Hub", description: "One platform for all campus communication and activities." },
    { icon: Bell, title: "Instant Alerts", description: "Receive important campus-wide notifications directly to your portal." },
    { icon: Users, title: "Club & Event Hub", description: "Discover clubs, register for events, and stay connected." },
    { icon: BookOpen, title: "Shared Knowledge", description: "Access and share academic resources with fellow students." },
    { icon: MessageSquare, title: "Direct Chat", description: "Initiate one-on-one chats for quick and private communication." },
    { icon: MapPin, title: "Campus Services", description: "Find lost items, request medication, and discover local room rentals." },
  ];

  return (
    <div className="bg-gray-50">
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center text-center text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Campus Central Library"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 px-4"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to <span className="text-indigo-400">CampusConnect</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-indigo-100 sm:text-xl">
            The Unified Operating System for our campus. All your college needs, integrated into a single, streamlined hub.
          </p>
          <motion.div
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="mt-10 inline-block"
          >
            <Link
              to="/sign-up"
              className="rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors duration-300"
            >
              Get Started Now
            </Link>
          </motion.div>
        </motion.div>
      </section>
      {/* --- END OF HERO SECTION --- */}

      <section className="container mx-auto py-20 px-4 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Everything You Need, <span className="text-indigo-600">All In One Place</span>
          </h2>
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

      {/* --- SECTION WITH SECOND IMAGE --- */}
       <section className="bg-white">
        <div className="mx-auto max-w-7xl py-20 sm:py-24 px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                A More Connected Campus Awaits
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Join your peers in a digital-first community. Streamline your day, connect with clubs, and never miss an important update. It's campus life, simplified.
              </p>
              <div className="mt-8">
                <Link
                  to="/sign-up"
                  className="inline-flex rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Create Your Account
                </Link>
              </div>
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7 }}
                className="w-full h-80"
            >
                <img src={campusOverviewImage} alt="Campus Overview" className="w-full h-full object-cover rounded-2xl shadow-xl"/>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;
