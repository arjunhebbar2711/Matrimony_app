const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/User'); 
const router = express.Router();
const { upload } = require('../config/cloudinary');

// Security Checkpoint: Verify the Firebase Token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        // Ask Google to verify the token is real
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.userPhone = decodedToken.phone_number; // Attach the phone number to the request
        next(); // Let them pass to the route below
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// The PUT Route to save the profile data
router.put('/update-profile', verifyToken, async (req, res) => {
    try {
        const updateData = req.body;
        
        // 1. Flip the flag so they never have to see the setup screen again!
        updateData.isProfileComplete = true; 

        // 2. Find the user by their phone number and update their document
        const updatedUser = await User.findOneAndUpdate(
            { phoneNumber: req.userPhone },
            { $set: updateData },
            { 
                new: true, 
                upsert: true,              
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({ success: true, user: updatedUser });
        console.log(`Profile completed for: ${req.userPhone}`);

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
    
// GET Route to fetch matches (NOW WITH DEEP FILTERING)
router.get('/matches', verifyToken, async (req, res) => {
    try {
        const loggedInUser = await User.findOne({ phoneNumber: req.userPhone });
        if (!loggedInUser) return res.status(404).json({ message: 'User not found' });

        const oppositeGender = loggedInUser.gender === 'Male' ? 'Female' : 'Male';
        let query = { gender: oppositeGender, isProfileComplete: true };

        // --- 1. QUICK FILTERS ---
        if (req.query.hasPhoto === 'true') {
            query.profileImage = { $exists: true, $ne: "" }; 
        }

        // --- 2. DEEP FILTERS (From the Modal) ---
        // Marital Status
        if (req.query.maritalStatus && req.query.maritalStatus !== 'All') {
            query.maritalStatus = req.query.maritalStatus;
        }
        // Salary
        if (req.query.salary && req.query.salary !== 'All') {
            query.salary = req.query.salary;
        }
        // Gotra (Case-insensitive search)
        if (req.query.gotra) {
            query.gotra = { $regex: new RegExp(req.query.gotra, 'i') };
        }
        // Age Range (Translating Age to Date of Birth for MongoDB)
        if (req.query.minAge || req.query.maxAge) {
            query.dob = {};
            const today = new Date();
            if (req.query.minAge) {
                const maxDate = new Date();
                maxDate.setFullYear(today.getFullYear() - parseInt(req.query.minAge));
                query.dob.$lte = maxDate; // Must be born BEFORE this date
            }
            if (req.query.maxAge) {
                const minDate = new Date();
                minDate.setFullYear(today.getFullYear() - parseInt(req.query.maxAge) - 1);
                query.dob.$gt = minDate; // Must be born AFTER this date
            }
        }

        // --- 3. SORTING ---
        let sortQuery = { createdAt: -1 }; 
        if (req.query.sort === 'oldest') sortQuery = { createdAt: 1 };

        const matches = await User.find(query).sort(sortQuery);
        res.status(200).json(matches);

    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// POST Route: Handle Interactions (Shortlist, Interest, View)
router.post('/interact', verifyToken, async (req, res) => {
    try {
        // actionType will be 'shortlist', 'interest', or 'view'
        // targetUserId is the _id of the person they clicked on
        const { actionType, targetUserId } = req.body;

        // 1. Find the user making the request
        const currentUser = await User.findOne({ phoneNumber: req.userPhone });
        
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // 2. Determine which array to update based on the action
        let updateQuery = {};
        
        if (actionType === 'shortlist') {
            // $addToSet adds to the array ONLY if it's not already there (prevents duplicates)
            updateQuery = { $addToSet: { shortlistedProfiles: targetUserId } };
        } else if (actionType === 'interest') {
            updateQuery = { $addToSet: { interestedProfiles: targetUserId } };
        } else if (actionType === 'view') {
            updateQuery = { $addToSet: { viewedProfiles: targetUserId } };
        } else {
            return res.status(400).json({ message: "Invalid action type" });
        }

        // 3. Update the database
        await User.findByIdAndUpdate(currentUser._id, updateQuery);

        res.status(200).json({ success: true, message: `Successfully tracked: ${actionType}` });

    } catch (error) {
        console.error("Interaction error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET Route: Fetch a single user's full profile by ID
router.get('/profile/:id', verifyToken, async (req, res) => {
    try {
        // .select('-phoneNumber') ensures we don't send their private number to the frontend
        const userProfile = await User.findById(req.params.id).select('-phoneNumber'); 
        
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.status(200).json({ success: true, profile: userProfile });
    } catch (error) {
        console.error("Error fetching full profile:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// POST Route: Upload Profile Picture
// Notice we inject 'upload.single('image')' into the middle of the route!
router.post('/upload-photo', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // Cloudinary successfully saved the file and gave us this secure URL back
        const imageUrl = req.file.path;

        // Save that URL to the user's MongoDB document
        await User.findOneAndUpdate(
            { phoneNumber: req.userPhone },
            { profileImage: imageUrl }
        );

        res.status(200).json({ 
            success: true, 
            imageUrl: imageUrl, 
            message: "Photo uploaded successfully!" 
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Server Error during upload' });
    }
});

// GET Route: Fetch the logged-in user's own profile data
router.get('/my-profile', verifyToken, async (req, res) => {
    try {
        const userProfile = await User.findOne({ phoneNumber: req.userPhone });
        
        if (!userProfile) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ success: true, profile: userProfile });
    } catch (error) {
        console.error("Error fetching own profile:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;