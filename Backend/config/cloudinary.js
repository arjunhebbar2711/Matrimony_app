const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Log in to Cloudinary using your .env secrets
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure the storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'matrimony_profiles', // It will create this folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // It automatically crops the image to a perfect 4:5 portrait, focused on their face!
    transformation: [{ width: 500, height: 625, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }] 
  }
});

// 3. Create the upload middleware
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };