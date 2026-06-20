const mongoose = require('mongoose');

const VerdictDetailSchema = new mongoose.Schema({
  category:   String,
  result:     String,       // 'clean' or 'violation'
  confidence: Number,       // 0–100
  reasoning:  String
});

const ImageSchema = new mongoose.Schema({
  filename:       String,
  outcome:        { type: String, enum: ['approved','flagged','blocked'], default: 'approved' },
  verdictDetails: [VerdictDetailSchema],
  policySnapshot: mongoose.Schema.Types.Mixed   // copy of policies at time of scan
});

const SubmissionSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [ImageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);