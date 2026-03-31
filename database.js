const mongoose = require('mongoose');
const Bayan = require('./models/Bayan');
const Video = require('./models/Video');
const Question = require('./models/Question');
const Notification = require('./models/Notification');
const Course = require('./models/Course');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khanqah';

async function initDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB');

    // ─── SEEDING (NEW FEATURES ONLY) ───
    
    // Seed Courses (Initial set for new feature)
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.insertMany([
        { title: 'Tasawwuf & Sulook', arabicTitle: 'تصوف و سلوک', description: 'A comprehensive course on the science of spiritual purification, Tazkiyah-e-Nafs, and the path of Sulook under qualified guidance.', icon: '📿', status: 'Ongoing', duration: '6 Months', location: 'Online & Onsite' },
        { title: 'Quran Tafsir Program', arabicTitle: 'تفسیر قرآن', description: 'In-depth Quranic study including Tajweed, Tafsir, and understanding the deeper meanings and wisdoms of the Holy Quran.', icon: '📖', status: 'Weekly', duration: '1 Year', location: 'Onsite' },
        { title: 'Akhlaq & Tarbiyat', arabicTitle: 'اصلاح اخلاق', description: 'A course focused on Islamic character development, good manners (Adab), and spiritual etiquettes of daily life according to Sunnah.', icon: '🌙', status: 'Monthly', duration: '3 Months', location: 'Online' },
        { title: 'Fiqh of Worship', arabicTitle: 'فقہ العبادات', description: 'Detailed study of the rulings and wisdom of Islamic worship — Salah, Zakat, Sawm, Hajj — according to the Hanafi Madhab.', icon: '✨', status: 'Weekly', duration: '4 Months', location: 'Online & Onsite' },
        { title: 'Hadith Studies', arabicTitle: 'احادیث نبوی', description: 'Study of selected Hadith collections with focus on their relevance to spiritual life, practical implementation, and wisdom.', icon: '🌿', status: 'Bi-weekly', duration: '6 Months', location: 'Onsite' },
        { title: 'Dhikr & Muraqaba', arabicTitle: 'ذکر و مراقبہ', description: 'Practical training in the methods of Dhikr, Muraqaba, and Shaghl under the supervision of an experienced Sheikh.', icon: '💎', status: 'Daily', duration: 'Ongoing', location: 'Onsite' }
      ]);
      console.log('Courses seeded');
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
  Course
};
