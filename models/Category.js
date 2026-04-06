const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: 'bayan' }, // 'bayan', 'video', 'question', 'course'
  icon: { type: String, default: '▪' },
  order: { type: Number, default: 0 }
});

// Compound index to allow same name in different types
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
