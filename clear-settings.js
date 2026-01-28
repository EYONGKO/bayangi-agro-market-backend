import 'dotenv/config';
import mongoose from 'mongoose';
import SiteSettings from './src/models/SiteSettings.js';

async function clearSiteSettings() {
  try {
    // Connect to database
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localroots';
    await mongoose.connect(uri);
    
    console.log('Connected to database');
    
    // Delete the site settings document
    const result = await SiteSettings.deleteOne({ key: 'site' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Site settings cleared successfully!');
      console.log('The app will now use the updated defaults without the HOME link.');
    } else {
      console.log('ℹ️ No site settings found in database (will use defaults)');
    }
    
  } catch (error) {
    console.error('❌ Error clearing settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit(0);
  }
}

clearSiteSettings();
