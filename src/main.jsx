import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key from .env");
}

// Create a new component that can use the useNavigate hook
const ClerkProviderWithRoutes = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)} // This is the magic line
    >
      <App />
    </ClerkProvider>
  );
};

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      The BrowserRouter needs to be the parent of our new component
      so that the useNavigate hook can work correctly.
    */}
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  </React.StrictMode>
);