const Submission = require('../models/Submission');
const PolicyConfig = require('../models/PolicyConfig');
const { analyzeImage } = require('../services/moderationService');


const computeOutcome = (aiResults, policies) => {
  let outcome = 'approved';

  for (const result of aiResults) {
    const policy = policies.find(p => p.category === result.category);
    if (!policy || !policy.enabled) continue; // disabled category skip ho jata hai

    if (result.confidence >= policy.threshold) {
      if (policy.enforcement === 'auto_block') {
        return 'blocked';
      }
      if (policy.enforcement === 'flag_review') {
        outcome = 'flagged';       }
    }
  }
  return outcome;
};

exports.createSubmission = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

  
    const policies = await PolicyConfig.find();

    const images = [];

    for (const file of req.files) {
      const base64 = file.buffer.toString('base64');
      const aiResults = await analyzeImage(base64, file.mimetype);
      const outcome = computeOutcome(aiResults, policies);

      images.push({
        filename: file.originalname,
        outcome,
        verdictDetails: aiResults,
        policySnapshot: policies
      });
    }

    const submission = await Submission.create({
      user: req.user._id,
      images
    });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { outcome, category, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    let submissions = await Submission.find(query).sort({ createdAt: -1 });

    
    if (outcome) {
      submissions = submissions.filter(s => s.images.some(img => img.outcome === outcome));
    }
    if (category) {
      submissions = submissions.filter(s =>
        s.images.some(img => img.verdictDetails.some(v => v.category === category))
      );
    }
    if (startDate) {
      submissions = submissions.filter(s => s.createdAt >= new Date(startDate));
    }
    if (endDate) {
      submissions = submissions.filter(s => s.createdAt <= new Date(endDate));
    }

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};