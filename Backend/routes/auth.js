const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/User'); // Importing the schema we built earlier
const router = express.Router();

// 1. Initialize Firebase Admin using your secret JSON file
const serviceAccount = require('../firebaseServiceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// 2. The Verification Endpoint
router.post('/login', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    try {
        // Ask Firebase to cryptographically verify the token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const phoneNumber = decodedToken.phone_number;

        // Check if this phone number already exists in MongoDB
        let user = await User.findOne({ phoneNumber });
        let isNewUser = false;

        if (!user) {
            // If they don't exist, create a new blank profile!
            user = new User({
                phoneNumber: phoneNumber,
                isProfileComplete: false
            });
            await user.save();
            isNewUser = true;
            console.log(`New user created for: ${phoneNumber}`);
        } else {
            console.log(`Existing user logged in: ${phoneNumber}`);
        }

        // Send the MongoDB user data back to the React frontend
        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            user: user,
            isNewUser: isNewUser
        });

    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
});

module.exports = router;