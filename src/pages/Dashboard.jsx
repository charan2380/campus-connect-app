// 📂 src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import createClerkSupabaseClient from '../supabaseClient';
import { Loader2 } from 'lucide-react';

function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const loadAndCreateProfile = useCallback(async () => {
    if (!user || !getToken) return;

    try {
      setLoading(true);
      const supabase = await createClerkSupabaseClient(getToken);

      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        console.log("No profile found. Creating a new one...");
        const roleFromMeta = user.publicMetadata?.role || 'student';

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            role: roleFromMeta,
            full_name: user.fullName,
            email: user.primaryEmailAddress.emailAddress
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          setProfile(null);
        } else {
          setProfile(newProfile);
        }
      } else if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        setProfile(null);
      } else {
        setProfile(profileData);
      }
    } catch (e) {
      console.error("Unexpected error:", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadAndCreateProfile();
  }, [loadAndCreateProfile]);

useEffect(() => {
  if (!loading && profile) {
    let requiredFields = [];

    switch (profile.role) {
      case 'student':
      case 'club_admin':
        requiredFields = ['full_name', 'department', 'year', 'roll_no'];
        break;
      case 'hod':
        requiredFields = ['full_name', 'department'];  // HOD doesn’t need year or roll_no
        break;
      case 'super_admin':
        requiredFields = ['full_name'];  // Super Admin may need even fewer fields
        break;
      default:
        requiredFields = ['full_name'];
    }

    const isComplete = requiredFields.every(
      (field) => profile[field] && profile[field].toString().trim() !== ''
    );

    if (!isComplete) {
      navigate('/profile');
      return;
    }

    // ✅ Route based on role after profile completion
    switch (profile.role) {
      case 'student':
        navigate('/student-dashboard');
        break;
      case 'hod':
        navigate('/hod-dashboard');
        break;
      case 'club_admin':
        navigate('/club-admin-dashboard');
        break;
      case 'super_admin':
        navigate('/super-admin-dashboard');
        break;
      default:
        console.error('Unknown role:', profile.role);
        navigate('/');
    }
  }

  if (!loading && !profile) {
    console.error("Could not load or create profile.");
    navigate('/');
  }
}, [profile, loading, navigate]);


  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="mt-4 text-lg text-gray-700">Signing in & Verifying Profile...</p>
    </div>
  );
}

export default Dashboard;
