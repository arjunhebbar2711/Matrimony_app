const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/User'); 
const router = express.Router();

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
            { new: true } // This tells MongoDB to return the newly updated profile
        );

        res.status(200).json({ success: true, user: updatedUser });
        console.log(`Profile completed for: ${req.userPhone}`);

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET Route to fetch all matches
router.get('/matches', verifyToken, async (req, res) => {
    try {
        // Find all users EXCEPT the one currently logged in, and only if their profile is complete
        const matches = await User.find({ 
            phoneNumber: { $ne: req.userPhone },
            isProfileComplete: true 
        });

        res.status(200).json({ success: true, matches });
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;