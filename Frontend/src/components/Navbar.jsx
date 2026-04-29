import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Tell Firebase to destroy the user's session
      await signOut(auth);
      
      // 2. Kick them back to the login screen
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Brand Logo / Name */}
      <div className="text-2xl font-bold text-blue-600 tracking-tight">
        Match<span className="text-gray-800">Maker</span>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          {/* A generic placeholder avatar */}
          U
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors px-3 py-1 rounded hover:bg-red-50"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;