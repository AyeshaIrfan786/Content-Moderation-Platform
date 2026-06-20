const mongoose = require('mongoose');

const AppealSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submission:    { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  imageIndex:    Number,       // which image in the submission
  justification: String,
  status:        { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  adminResponse: String
}, { timestamps: true });

module.exports = mongoose.model('Appeal', AppealSchema);