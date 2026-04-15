// Update existing user to admin role
require('dotenv').config();
const mongoose = require('mongoose');

async function updateToAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import User model
    const User = require('./models/User');

    const adminEmail = 'char.wilsons@gmail.com';

    // Find and update the user
    const result = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        $set: { 
          role: 'admin',
          verified: true,
          fullName: 'Administrator',
          pseudo: 'admin'
        }
      },
      { new: true }
    );

    if (result) {
      console.log('✅ User updated to ADMIN:', adminEmail);
      console.log('Updated user:', {
        email: result.email,
        role: result.role,
        verified: result.verified,
        fullName: result.fullName,
        pseudo: result.pseudo
      });
    } else {
      console.log('❌ User not found:', adminEmail);
      console.log('Creating new admin user...');
      
      // If user doesn't exist, create one
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Bayen1asse', salt);
      
      const newAdmin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        verified: true,
        fullName: 'Administrator',
        pseudo: 'admin',
        createdAt: new Date()
      });
      
      await newAdmin.save();
      console.log('✅ New ADMIN user created:', adminEmail);
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
updateToAdmin();