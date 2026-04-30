const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Authentication & Internal
  phoneNumber: { type: String, required: true, unique: true },
  isProfileComplete: { type: Boolean, default: false },

 // Basic Details
  name: { type: String },
  profileImage: { type: String, default: "" }, 
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date },
  age: { type: Number }, 
  maritalStatus: { type: String, enum: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'] },
  bloodGroup: { type: String },
  height: { type: String }, 
  weight: { type: Number },

  // Astrology & Background
  pob: { type: String }, // Place of Birth
  tob: { type: String }, // Time of Birth
  casteSect: { type: String }, // Filter: Sub caste
  parentsOrigin: { type: String },
  gotra: { type: String }, // Filter: Gothra
  rashi: { type: String }, // Filter: Rashi
  nakshatra: { type: String }, // Filter: Nakshathra
  residencyStatus: { type: String, enum: ['Indian', 'NRI'] }, // Filter: Indian, NRI

  // Professional & Education
  education: { type: String }, // Filter: Education
  profession: { type: String }, // Filter: Profession
  salary: { type: String, enum: ['0-5 LPA', '5-10 LPA', '10-20 LPA', '20+ LPA'] }, // Filter: Income
  languagesKnown: [{ type: String }], // Array for multiple languages

  // Family Details
  familyDetails: {
    fatherName: { type: String },
    fatherContact: { type: String },
    motherName: { type: String },
    motherContact: { type: String },
    noOfBrothers: { type: Number, default: 0 },
    noOfSisters: { type: Number, default: 0 }
  },

  // Contact & Preferences
  contactInfo: {
    primaryContact: { type: String },
    address: { type: String },
    region: { type: String } // Filter: Region/Place
  },
  
  otherInformation: { type: String },
  expectationPreference: { type: String },

  // --- Interaction Tracking (Option A) ---
  shortlistedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  interestedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { 
  timestamps: true // Automatically adds createdAt and updatedAt dates
});

module.exports = mongoose.model('User', userSchema);