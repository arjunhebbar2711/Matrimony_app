import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import Navbar from './Navbar';

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Fetch data from backend on load ---
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return; // If not logged in, stop.
        
        const token = await user.getIdToken();

        const response = await fetch('http://localhost:5000/api/user/matches', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setMatches(data.matches);
        } else {
          console.error("Failed to fetch matches:", data.message);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    // Firebase takes a moment to initialize the user, so we wait for it
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) fetchMatches();
    });

    return () => unsubscribe();
  }, []);

  // Helper function to turn "1997-01-01" into an actual Age
  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getFilteredMatches = () => {
    // Note: interactions are hardcoded to false for now since we haven't built the backend for it yet!
    switch(activeFilter) {
      case 'shortlistedByMe': return matches.filter(m => m.interactions?.shortlistedByMe);
      case 'viewedMe': return matches.filter(m => m.interactions?.viewedMe);
      case 'shortlistedMe': return matches.filter(m => m.interactions?.shortlistedMe);
      case 'viewedByMe': return matches.filter(m => m.interactions?.viewedByMe);
      default: return matches;
    }
  };

  const displayedMatches = getFilteredMatches();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
            <div className="bg-teal-50 p-4 border-b border-gray-200 border-l-4 border-l-teal-500">
              <h3 className="font-bold text-gray-900">Your Matches</h3>
              <p className="text-xs text-gray-600 mt-1">View all the profiles that match your preferences</p>
            </div>
            
            <div className="p-4 space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Based on activity</h4>
              <ul className="text-sm space-y-3 font-medium">
                <li onClick={() => setActiveFilter('all')} className={`cursor-pointer transition-colors ${activeFilter === 'all' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-400'}`}>❖ All Matches</li>
                <li onClick={() => setActiveFilter('shortlistedByMe')} className={`cursor-pointer transition-colors ${activeFilter === 'shortlistedByMe' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-400'}`}>★ Shortlisted by you</li>
                <li onClick={() => setActiveFilter('viewedMe')} className={`cursor-pointer transition-colors ${activeFilter === 'viewedMe' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-400'}`}>👁 Viewed you</li>
                <li onClick={() => setActiveFilter('shortlistedMe')} className={`cursor-pointer transition-colors ${activeFilter === 'shortlistedMe' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-400'}`}>👤 Shortlisted you</li>
                <li onClick={() => setActiveFilter('viewedByMe')} className={`cursor-pointer transition-colors ${activeFilter === 'viewedByMe' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-400'}`}>🔍 Viewed by you</li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-xl text-gray-800">
              <span className="font-bold">{displayedMatches.length} Matches</span> based on your <span className="text-orange-500 hover:underline cursor-pointer">preferences</span>
            </h1>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1">Filter</button>
              <button className="whitespace-nowrap px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50">Sort by ⌄</button>
            </div>
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center p-12 text-gray-500">Loading your matches...</div>
            ) : displayedMatches.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                No profiles found right now. Invite some friends to join!
              </div>
            ) : (
              displayedMatches.map((match) => (
                <div key={match._id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                  
                  <div className="relative w-full sm:w-56 shrink-0 h-64 sm:h-auto">
                    {/* Placeholder image since we don't have photo uploads yet! */}
                    <img 
                      src={match.gender === "Female" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop" : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"} 
                      alt={match.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-blue-600 text-sm font-semibold mb-1"><span className="mr-1">✓</span> Phone verified</div>
                      <h2 className="text-xl font-bold text-gray-900">{match.name}</h2>
                      <p className="text-xs text-gray-500 mt-1">ID: {match._id.substring(0,8).toUpperCase()} | Joined Recently</p>
                      
                      <p className="text-sm text-gray-700 mt-4 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                        {calculateAge(match.dob)} yrs • {match.height || "Height N/A"} • {match.gotra || "Gotra N/A"} • {match.rashi || "Rashi N/A"} • {match.profession || "Profession N/A"} • {match.salary || "Income N/A"}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 sm:justify-end border-t border-gray-100 pt-4">
                      <button className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">✕ Don't Show</button>
                      <button className="flex-1 sm:flex-none px-8 py-2 bg-[#f26522] text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">♡ Send Interest</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;