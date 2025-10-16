import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Bell, MessageSquare, BookOpen, MapPin } from 'lucide-react';

// --- FEATURE CARD COMPONENT (Unchanged) ---
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.1, duration: 0.3, ease: 'easeOut' } },
  };
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ ease: "easeInOut", duration: 0.2 }}
      className="bg-white p-8 rounded-xl shadow-md h-full"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 mb-5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

// --- MAIN HOME PAGE COMPONENT ---
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
      {/* --- HERO SECTION WITH CORRECTED RESPONSIVE STYLING --- */}
      <div className="relative bg-slate-900">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
            alt="College campus"
          />
          <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply" aria-hidden="true" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative mx-auto max-w-4xl py-20 px-6 text-center sm:py-24 lg:py-32"
        >
          {/* --- THIS IS THE CORRECTED HEADLINE --- */}
          {/* Default is text-3xl, scales up for sm, md, and lg screens */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Welcome to <span className="text-indigo-400">CampusConnect</span>
          </h1>
          {/* --- END OF CORRECTION --- */}
          <p className="mt-4 max-w-3xl mx-auto text-lg text-indigo-100 sm:mt-6 sm:text-xl">
            Your unified campus operating system. All your college needs, integrated into a single, streamlined digital hub.
          </p>
          <div className="mt-8 sm:mt-10">
            <Link
              to="/sign-up"
              className="rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors duration-300"
            >
              Get Started Now
            </Link>
          </div>
        </motion.div>
      </div>
      {/* --- END OF HERO SECTION --- */}

      <section className="container mx-auto py-20 px-4 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
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

       <section className="bg-white">
        <div className="mx-auto max-w-4xl py-16 px-6 text-center sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to streamline your campus life?
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-600">
            Join your peers and experience a more connected and efficient campus today.
          </p>
          <Link
            to="/sign-up"
            className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;