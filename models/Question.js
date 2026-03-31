const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  name: String,
  question: String,
  category: String,
  date: String,
  answer: String,
  answered: { type: Boolean, default: false }
});

module.exports = mongoose.model('Question', questionSchema);
