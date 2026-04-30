import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import Navbar from './Navbar';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  // Sidebar State
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Top Pill Quick Filter States
  const [showWithPhoto, setShowWithPhoto] = useState(false);
  const [showNotSeen, setShowNotSeen] = useState(false);
  const [showNewlyJoined, setShowNewlyJoined] = useState(false);
  
  // Sort State
  const [sortBy, setSortBy] = useState('default');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) fetchMatches();
    });

    return () => unsubscribe();
  }, []);

  const handleInteraction = async (actionType, targetUserId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();

      const response = await fetch('http://localhost:5000/api/user/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ actionType, targetUserId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Instantly update React state so the "Not seen" filter updates immediately
        setMatches(prevMatches => prevMatches.map(m => {
          if (m._id === targetUserId) {
            const key = actionType === 'shortlist' ? 'shortlistedByMe' : 
                        actionType === 'view' ? 'viewedByMe' : 'interestedByMe';
            return { ...m, interactions: { ...m.interactions, [key]: true } };
          }
          return m;
        }));
        alert(`Successfully sent: ${actionType}`);
      } else {
        alert("Action failed: " + data.message);
      }
    } catch (error) {
      console.error("Error sending interaction:", error);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // --- THE ADVANCED FILTER ENGINE ---
  const getFilteredMatches = () => {
    let filtered = [...matches];

    // 1. Apply Left Sidebar Activity Filter
    if (activeFilter === 'shortlistedByMe') filtered = filtered.filter(m => m.interactions?.shortlistedByMe);
    else if (activeFilter === 'viewedMe') filtered = filtered.filter(m => m.interactions?.viewedMe);
    else if (activeFilter === 'shortlistedMe') filtered = filtered.filter(m => m.interactions?.shortlistedMe);
    else if (activeFilter === 'viewedByMe') filtered = filtered.filter(m => m.interactions?.viewedByMe);

    // 2. Apply Top Pill Quick Filters
    if (showWithPhoto) {
      filtered = filtered.filter(m => m.profileImage && m.profileImage.trim() !== '');
    }
    
    if (showNotSeen) {
      filtered = filtered.filter(m => !m.interactions?.viewedByMe);
    }

    if (showNewlyJoined) {
      // Show users whose account was created in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(m => new Date(m.createdAt) > sevenDaysAgo);
    }

    // 3. Apply Sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'age-asc') {
      filtered.sort((a, b) => calculateAge(a.dob) - calculateAge(b.dob)); // Youngest first
    } else if (sortBy === 'age-desc') {
      filtered.sort((a, b) => calculateAge(b.dob) - calculateAge(a.dob)); // Oldest first
    }

    return filtered;
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
            
            {/* --- NEW: Link to Edit Profile Page --- */}
            <div className="p-4 border-b border-gray-100">
              <Link to="/edit-profile" className="w-full flex items-center justify-center gap-2 py-2 border border-teal-500 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors">
                <span>⚙️</span> Edit My Profile
              </Link>
            </div>
            {/* ------------------------------------- */}
            
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
            
            {/* --- INTERACTIVE TOP PILL FILTERS --- */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 items-center">
              
              <button onClick={() => alert("Advanced Deep Filter Modal coming soon!")} className="whitespace-nowrap px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Filter
              </button>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)} 
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-sm transition-colors flex items-center gap-1 ${sortBy !== 'default' ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  {sortBy === 'default' ? 'Sort by' : sortBy === 'newest' ? 'Newest' : sortBy === 'age-asc' ? 'Youngest First' : 'Oldest First'} ⌄
                </button>
                
                {isSortOpen && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 shadow-xl rounded-lg py-2 z-10">
                    <button onClick={() => { setSortBy('default'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50">Default</button>
                    <button onClick={() => { setSortBy('newest'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50">Newest Joined</button>
                    <button onClick={() => { setSortBy('age-asc'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50">Age: Low to High</button>
                    <button onClick={() => { setSortBy('age-desc'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50">Age: High to Low</button>
                  </div>
                )}
              </div>

              {/* Quick Toggle Pills */}
              <button 
                onClick={() => setShowNewlyJoined(!showNewlyJoined)} 
                className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-sm transition-colors ${showNewlyJoined ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                Newly joined
              </button>

              <button 
                onClick={() => setShowNotSeen(!showNotSeen)} 
                className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-sm transition-colors ${showNotSeen ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                Not seen
              </button>

              <button 
                onClick={() => setShowWithPhoto(!showWithPhoto)} 
                className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-sm transition-colors ${showWithPhoto ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                Profiles with photo
              </button>
            </div>
          </div>

          <div className="space-y-5 mt-2">
            {loading ? (
              <div className="flex justify-center p-12 text-gray-500">Loading your matches...</div>
            ) : displayedMatches.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                No profiles match these exact filters right now. Try turning a few off!
              </div>
            ) : (
              displayedMatches.map((match) => (
                <div key={match._id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                  
                  <div className="relative w-full sm:w-56 shrink-0 h-64 sm:h-auto">
                    {match.profileImage ? (
                      <img src={match.profileImage} alt={match.name} className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400">
                        <div className="text-center">
                          <span className="text-4xl">👤</span>
                          <p className="text-xs mt-1 font-medium">No Photo</p>
                        </div>
                      </div>
                    )}
                    
                    <div onClick={() => handleInteraction('shortlist', match._id)} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded backdrop-blur-sm cursor-pointer hover:bg-black/80 flex items-center gap-1">
                      <span className="text-sm">⚑</span> Shortlist
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-blue-600 text-sm font-semibold mb-1"><span className="mr-1">✓</span> Phone verified</div>
                      <Link to={`/profile/${match._id}`} className="hover:text-blue-600 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900">{match.name}</h2>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">ID: {match._id.substring(0,8).toUpperCase()} | Joined Recently</p>
                      
                      <p className="text-sm text-gray-700 mt-4 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                        {calculateAge(match.dob)} yrs • {match.height || "Height N/A"} • {match.gotra || "Gotra N/A"} • {match.rashi || "Rashi N/A"} • {match.profession || "Profession N/A"} • {match.salary || "Income N/A"}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 sm:justify-end border-t border-gray-100 pt-4">
                      <button className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                        ✕ Don't Show
                      </button>
                      
                      <button onClick={() => handleInteraction('interest', match._id)} className="flex-1 sm:flex-none px-8 py-2 bg-[#f26522] text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">
                        ♡ Send Interest
                      </button>
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