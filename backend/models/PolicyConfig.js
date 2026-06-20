const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
  category:    {
    type: String,
    enum: ['graphic_violence','hate_symbols','self_harm',
           'extremist_propaganda','weapons_contraband','harassment_humiliation'],
    unique: true
  },
  enabled:     { type: Boolean, default: true },
  threshold:   { type: Number, default: 70 },  // percentage 0–100
  enforcement: { type: String, enum: ['auto_block', 'flag_review'], default: 'flag_review' }
}, { timestamps: true });

module.exports = mongoose.model('PolicyConfig', PolicySchema);