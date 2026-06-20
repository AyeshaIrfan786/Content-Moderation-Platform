const Appeal = require('../models/Appeal');
const Submission = require('../models/Submission');


exports.createAppeal = async (req, res) => {
  try {
    const { submissionId, imageIndex, justification } = req.body;

    if (!justification || justification.trim() === '') {
      return res.status(400).json({ message: 'Justification is required' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const image = submission.images[imageIndex];
    if (!image) return res.status(404).json({ message: 'Image not found in submission' });

    if (image.outcome === 'approved') {
      return res.status(400).json({ message: 'Cannot appeal an approved submission' });
    }

    const appeal = await Appeal.create({
      user: req.user._id,
      submission: submissionId,
      imageIndex,
      justification
    });

    res.status(201).json(appeal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ user: req.user._id }).populate('submission');
    res.json(appeals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find().populate('submission').populate('user', 'name email');
    res.json(appeals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveAppeal = async (req, res) => {
  try {
    const { decision, adminResponse } = req.body; // decision: 'accepted' or 'rejected'

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ message: 'Appeal not found' });

    appeal.status = decision;
    appeal.adminResponse = adminResponse || '';
    await appeal.save();


    if (decision === 'accepted') {
      const submission = await Submission.findById(appeal.submission);
      submission.images[appeal.imageIndex].outcome = 'approved';
      await submission.save();
    }

    res.json(appeal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};