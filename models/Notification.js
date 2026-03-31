const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['important', 'event', 'info'] },
  badge: String,
  arabic: String,
  title: String,
  body: String,
  date: String
});

module.exports = mongoose.model('Notification', notificationSchema);
