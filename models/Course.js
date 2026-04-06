const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: String,
  arabicTitle: String,
  description: String,
  category: { type: String, default: 'General' },
  status: String, // e.g., 'Ongoing', 'Weekly'
  duration: String, // e.g., '6 Months'
  location: String, // e.g., 'Online & Onsite'
  thumbnail: String // URL to uploaded image

});

module.exports = mongoose.model('Course', courseSchema);
