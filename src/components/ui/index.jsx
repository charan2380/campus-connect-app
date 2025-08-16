// src/components/ui/index.jsx
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Input = (props) => (
  <input
    className="block w-full rounded-md border-gray-300 py-3 px-4 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
    {...props}
  />
);

export const Button = ({ isLoading, children, ...props }) => (
  <motion.button
    whileHover={{ scale: !isLoading ? 1.03 : 1 }}
    whileTap={{ scale: !isLoading ? 0.98 : 1 }}
    className="w-full inline-flex justify-center items-center gap-2 py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
    disabled={isLoading}
    {...props}
  >
    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
    {children}
  </motion.button>
);