const mongoose = require('mongoose');

const bayanSchema = new mongoose.Schema({
  title: String,
  category: String,
  url: String,
  duration: String,
  date: String
});

module.exports = mongoose.model('Bayan', bayanSchema);
