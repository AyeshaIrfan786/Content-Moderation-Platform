const PolicyConfig = require('../models/PolicyConfig');
const Submission = require('../models/Submission');
const Appeal = require('../models/Appeal');
const User = require('../models/User');


exports.getPolicies = async (req, res) => {
  try {
    const policies = await PolicyConfig.find();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updatePolicy = async (req, res) => {
  try {
    const { enabled, threshold, enforcement } = req.body;
    const policy = await PolicyConfig.findOneAndUpdate(
      { category: req.params.category },
      { enabled, threshold, enforcement },
      { new: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.overrideVerdict = async (req, res) => {
  try {
    const { submissionId, imageIndex, newOutcome } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.images[imageIndex].outcome = newOutcome;
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Analytics dashboard data
exports.getAnalytics = async (req, res) => {
  try {
    const submissions = await Submission.find();
    const appeals = await Appeal.find();

    // total volume
    const totalSubmissions = submissions.length;
    const totalImages = submissions.reduce((sum, s) => sum + s.images.length, 0);

    // outcome distribution
    const outcomeCount = { approved: 0, flagged: 0, blocked: 0 };
    const categoryViolationCount = {};

    submissions.forEach(s => {
      s.images.forEach(img => {
        outcomeCount[img.outcome] = (outcomeCount[img.outcome] || 0) + 1;
        img.verdictDetails.forEach(v => {
          if (v.result === 'violation') {
            categoryViolationCount[v.category] = (categoryViolationCount[v.category] || 0) + 1;
          }
        });
      });
    });

    // appeal stats
    const appealStats = {
      total: appeals.length,
      pending: appeals.filter(a => a.status === 'pending').length,
      accepted: appeals.filter(a => a.status === 'accepted').length,
      rejected: appeals.filter(a => a.status === 'rejected').length
    };

    // ranked users by submission count
    const userSubmissionCount = {};
    submissions.forEach(s => {
      const uid = s.user.toString();
      userSubmissionCount[uid] = (userSubmissionCount[uid] || 0) + 1;
    });
    const topUsers = await User.find({ _id: { $in: Object.keys(userSubmissionCount) } }).select('name email');
    const rankedUsers = topUsers
      .map(u => ({ user: u, submissionCount: userSubmissionCount[u._id.toString()] }))
      .sort((a, b) => b.submissionCount - a.submissionCount);

    res.json({
      totalSubmissions,
      totalImages,
      outcomeCount,
      categoryViolationCount,
      appealStats,
      rankedUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};