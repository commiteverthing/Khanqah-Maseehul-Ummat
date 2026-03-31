const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  ytId: String,
  date: String,
  thumb: String
});

module.exports = mongoose.model('Video', videoSchema);
