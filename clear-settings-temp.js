import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import SiteSettings from './src/models/SiteSettings.js';

async function clearSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete the site settings
    const result = await SiteSettings.deleteOne({ key: 'site' });
    console.log('Deleted site settings:', result);
    
    console.log('Settings cleared! The frontend will now use the new defaults.');
  } catch (error) {
    console.error('Error clearing settings:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearSettings();
