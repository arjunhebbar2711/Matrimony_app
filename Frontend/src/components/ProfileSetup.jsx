import { useState } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ProfileSetup = () => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '', gender: 'Male', dob: '', maritalStatus: 'Never Married',
    height: '', gotra: '', rashi: '', casteSect: '',
    education: '', profession: '', salary: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const prevStep = () => setStep(step - 1);

  // THE FIX: We created one "Smart" Submit function
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading
    
    // If we are on Step 1 or 2, just go to the next page and stop.
    if (step < 3) {
        setStep(step + 1);
        return; 
    }

    // If we made it here, we are on Step 3! Time to send to MongoDB.
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You are not logged in!");
        return;
      }
      
      const token = await user.getIdToken();

      const response = await fetch('https://matrimony-api-prod.onrender.com/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Profile saved successfully!");
        navigate('/dashboard'); 
      } else {
        alert("Failed to save profile: " + data.message);
      }
      
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while saving. Check the console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            {step === 1 && "Step 1: Basic Details"}
            {step === 2 && "Step 2: Astrology & Background"}
            {step === 3 && "Step 3: Professional Details"}
          </h2>
          <div className="w-full bg-gray-200 h-2 rounded mt-4">
            <div 
              className="bg-blue-600 h-2 rounded transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* THE FIX: The form now ALWAYS uses our smart function */}
        <form onSubmit={handleFormSubmit}>
          
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required
                    className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gotra</label>
                <input type="text" name="gotra" value={formData.gotra} onChange={handleChange} placeholder="e.g. Kashyapa"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rashi</label>
                <input type="text" name="rashi" value={formData.rashi} onChange={handleChange} placeholder="e.g. Mesha"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700">Profession</label>
                <input type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="e.g. Software Engineer"
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Annual Income</label>
                <select name="salary" value={formData.salary} onChange={handleChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border">
                  <option value="">Select Range</option>
                  <option value="0-5 LPA">0 - 5 LPA</option>
                  <option value="5-10 LPA">5 - 10 LPA</option>
                  <option value="10-20 LPA">10 - 20 LPA</option>
                  <option value="20+ LPA">20+ LPA</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition">
                Back
              </button>
            )}
            
            {/* THE FIX: Notice both buttons are now type="submit". The form handles the logic! */}
            {step < 3 ? (
              <button type="submit"
                className="ml-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                Next
              </button>
            ) : (
              <button type="submit"
                className="ml-auto bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">
                Complete Profile
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;