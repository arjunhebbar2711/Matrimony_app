import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import PhotoUpload from './PhotoUpload'; 

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: '',
    profession: '',
    salary: '',
    height: '',
    location: '' // Mapping to region/address based on your schema
  });

  // 1. Fetch current data to pre-fill the form
  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const token = await user.getIdToken();
        const response = await fetch('https://matrimony-api-prod.onrender.com/api/user/my-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          // Pre-fill the state with existing data
          setFormData({
            name: data.profile.name || '',
            profession: data.profile.profession || '',
            salary: data.profile.salary || '',
            height: data.profile.height || '',
            location: data.profile.contactInfo?.region || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchMyProfile();
    });
    return () => unsubscribe();
  }, []);

  // Handle standard text inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Save edits back to MongoDB
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      // We reuse the update-profile route you already built!
      const response = await fetch('https://matrimony-api-prod.onrender.com/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: formData.name,
            profession: formData.profession,
            salary: formData.salary,
            height: formData.height,
            contactInfo: { region: formData.location }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("Profile updated successfully!");
        navigate('/dashboard'); // Send them back to the feed
      } else {
        alert("Update failed: " + data.message);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 pt-20 text-center text-gray-600">Loading your profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline mb-6 flex items-center gap-2">
          <span>←</span> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit My Profile</h1>

        <div className="space-y-6">
          {/* Photo Upload Section */}
          <PhotoUpload onUploadSuccess={() => window.location.reload()} />

          {/* Details Form Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Basic Details</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                  <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Bracket</label>
                  <select name="salary" value={formData.salary} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">
                    <option value="">Select Income</option>
                    <option value="0-5 LPA">0-5 LPA</option>
                    <option value="5-10 LPA">5-10 LPA</option>
                    <option value="10-20 LPA">10-20 LPA</option>
                    <option value="20+ LPA">20+ LPA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 5'8&quot;" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City/Region</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving} className={`w-full py-3 rounded-lg font-medium text-white transition shadow-sm ${saving ? 'bg-orange-400 cursor-not-allowed' : 'bg-[#f26522] hover:bg-orange-600'}`}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;