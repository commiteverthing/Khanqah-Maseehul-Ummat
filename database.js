const mongoose = require('mongoose');
const Bayan = require('./models/Bayan');
const Video = require('./models/Video');
const Question = require('./models/Question');
const Notification = require('./models/Notification');
const Course = require('./models/Course');
const Category = require('./models/Category');


const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khanqah';

async function initDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB');

    // ─── SEEDING (NEW FEATURES ONLY) ───
    
    // Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany([
        { name: 'Tasawwuf', icon: '✨', order: 1, type: 'bayan' },
        { name: 'Ibaadat', icon: '🕌', order: 2, type: 'bayan' },
        { name: 'Akhlaq', icon: '🌿', order: 3, type: 'bayan' },
        { name: 'Quran', icon: '📖', order: 4, type: 'bayan' },
        { name: 'Ramadan', icon: '🌙', order: 5, type: 'bayan' },
        { name: 'Islah', icon: '💫', order: 6, type: 'bayan' },
        { name: 'General', icon: '❓', order: 7, type: 'bayan' }
      ]);
      console.log('Initial categories seeded');
    }


    // Note: Other collections (Bayans, Videos, etc.) are managed by admin panel or migrated from SQLite.
    // No hardcoded seeding here to prevent duplication or overwriting user data.

  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { 
  initDb, 
  Bayan, 
  Video, 
  Question, 
  Notification,
  Course,
  Category
};

