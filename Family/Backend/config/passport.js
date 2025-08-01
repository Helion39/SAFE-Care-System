const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FamilyMember = require('../models/FamilyMember');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if family member exists with this Google ID
    let familyMember = await FamilyMember.findOne({ 
      googleId: profile.id 
    }).populate('residentId');

    if (familyMember) {
      // Update profile information if it changed
      familyMember.name = profile.displayName;
      familyMember.email = profile.emails[0].value.toLowerCase();
      familyMember.profilePicture = profile.photos[0]?.value || null;
      familyMember.refreshToken = refreshToken;
      await familyMember.save();
      
      return done(null, familyMember);
    }

    // If not found by Google ID, check by email
    familyMember = await FamilyMember.findOne({ 
      email: profile.emails[0].value.toLowerCase() 
    }).populate('residentId');

    if (familyMember) {
      // Link Google ID to existing family member
      familyMember.googleId = profile.id;
      familyMember.name = profile.displayName;
      familyMember.profilePicture = profile.photos[0]?.value || null;
      familyMember.refreshToken = refreshToken;
      await familyMember.save();
      
      return done(null, familyMember);
    }

    // Family member not found - they need to be added by admin
    return done(null, false, { 
      message: 'Family member not found. Please contact the care facility to be added to the system.',
      email: profile.emails[0].value,
      name: profile.displayName
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((familyMember, done) => {
  done(null, familyMember._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const familyMember = await FamilyMember.findById(id).populate('residentId');
    done(null, familyMember);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;