import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Navbar from './Navbar';

const ProfileDetail = () => {
  const { id } = useParams(); // Grabs the user ID from the URL
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:5000/api/user/profile/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setProfile(data.profile);
        } else {
          alert("Could not load profile");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchProfile();
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 pt-20 text-center text-xl text-gray-600">Loading Profile...</div>;
  if (!profile) return <div className="min-h-screen bg-gray-50 pt-20 text-center text-xl text-gray-600">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline mb-6 flex items-center gap-2">
          <span>←</span> Back to Matches
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Top Header Section */}
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-100 h-80 md:h-auto relative">
              <img 
                src={profile.gender === "Female" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop" : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"} 
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-8 md:w-2/3 flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
              <p className="text-lg text-gray-600 mb-6">{profile.profession || "Profession N/A"} • {profile.location || "Location N/A"}</p>
              
              <div className="flex gap-4">
                <button className="flex-1 bg-[#f26522] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition shadow-sm">
                  ♡ Send Interest
                </button>
                <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                  ⚑ Shortlist
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left Column */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">About & Basics</h3>
                  <div className="space-y-3 text-gray-800">
                    <p><span className="font-medium w-32 inline-block">Age:</span> {profile.age || "N/A"}</p>
                    <p><span className="font-medium w-32 inline-block">Height:</span> {profile.height || "N/A"}</p>
                    <p><span className="font-medium w-32 inline-block">Marital Status:</span> {profile.maritalStatus || "N/A"}</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Astrology</h3>
                  <div className="space-y-3 text-gray-800">
                    <p><span className="font-medium w-32 inline-block">Gotra:</span> {profile.gotra || "N/A"}</p>
                    <p><span className="font-medium w-32 inline-block">Rashi:</span> {profile.rashi || "N/A"}</p>
                  </div>
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Career & Education</h3>
                  <div className="space-y-3 text-gray-800">
                    <p><span className="font-medium w-32 inline-block">Profession:</span> {profile.profession || "N/A"}</p>
                    <p><span className="font-medium w-32 inline-block">Income:</span> {profile.salary || "N/A"}</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Family Background</h3>
                  <div className="space-y-3 text-gray-800">
                    <p><span className="font-medium w-32 inline-block">Father's Name:</span> {profile.familyDetails?.fatherName || "N/A"}</p>
                    <p><span className="font-medium w-32 inline-block">Mother's Name:</span> {profile.familyDetails?.motherName || "N/A"}</p>
                  </div>
                </section>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfileDetail;