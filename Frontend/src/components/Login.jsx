import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  // Initialize the invisible Firebase reCAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        }
      });
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    // 1. Check if they actually typed 10 digits
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // 2. Secretly attach the +91 country code
    const formattedPhoneNumber = "+91" + phoneNumber;

    try {
      const appVerifier = window.recaptchaVerifier;
      // 3. Pass the formatted number to Firebase
      const confirmation = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      
      setConfirmationResult(confirmation);
      alert("OTP Sent!");
      
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await confirmationResult.confirm(otp);
      alert("Login successful!");
      navigate('/setup-profile'); 
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-20 items-center font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200 shadow-sm mt-10">
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Welcome to Vadhu Vara Kendra
        </h2>

        {/* If OTP hasn't been sent, show Phone Number form */}
        {!confirmationResult ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              
              {/* --- HERE IS THE UPDATED UI INPUT --- */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                <span className="bg-gray-50 px-4 py-2 text-gray-500 border-r border-gray-300 font-medium flex items-center">
                  +91
                </span>
                <input 
                  type="tel" 
                  maxLength="10"
                  placeholder="9876543210"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} // Strips out non-numbers
                  className="w-full px-4 py-2 focus:outline-none" 
                  required
                />
              </div>
              {/* ---------------------------------- */}
              
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#f26522] text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              Send OTP
            </button>
          </form>
        ) : (
          
          /* If OTP HAS been sent, show Verification form */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input 
                type="text" 
                maxLength="6"
                placeholder="123456"
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Sent to +91 {phoneNumber}</p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
            >
              Verify & Login
            </button>
          </form>
        )}

        {/* Required for Firebase to block bots */}
        <div id="recaptcha-container"></div>

      </div>
    </div>
  );
};

export default Login;