const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  ytId: String,
  category: { type: String, default: 'General' },
  date: String,
  thumb: String

});

module.exports = mongoose.model('Video', videoSchema);
