const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: String,
  arabicTitle: String,
  description: String,
  icon: String, // e.g., '📿', '📖'
  status: String, // e.g., 'Ongoing', 'Weekly'
  duration: String, // e.g., '6 Months'
  location: String  // e.g., 'Online & Onsite'
});

module.exports = mongoose.model('Course', courseSchema);
