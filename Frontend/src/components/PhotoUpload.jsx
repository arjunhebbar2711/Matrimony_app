import { useState } from 'react';
import { auth } from '../firebase';

const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 1. Handle when the user selects a file from their computer
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a temporary local URL so they can preview the image before uploading
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // 2. Handle sending the file to your Node backend
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      // We MUST use FormData when sending files, not standard JSON!
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:5000/api/user/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do NOT set 'Content-Type' manually here! 
          // The browser automatically sets the correct 'multipart/form-data' boundary for us.
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Photo uploaded beautifully!");
        setSelectedFile(null); // Clear the selection
        if (onUploadSuccess) onUploadSuccess(data.imageUrl); // Tell the parent component to refresh!
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
      <h3 className="font-semibold text-gray-800 mb-4">Update Profile Photo</h3>
      
      {/* The Image Preview Area */}
      <div className="mb-4 flex justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-32 h-40 object-cover rounded-lg shadow-md border-2 border-teal-500" />
        ) : (
          <div className="w-32 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400">
            No Photo
          </div>
        )}
      </div>

      {/* The Controls */}
      <div className="space-y-3">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
        />
        
        {selectedFile && (
          <button 
            onClick={handleUpload} 
            disabled={uploading}
            className={`w-full py-2 rounded-full font-medium text-white transition-colors ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {uploading ? 'Optimizing & Uploading...' : 'Confirm Upload'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;