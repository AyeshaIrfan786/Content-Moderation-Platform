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

    // per-user counters (built in the same pass as everything else)
    const userSubmissionCount = {};
    const userViolationCount = {};

    // submission volume over time, bucketed by day (YYYY-MM-DD)
    const volumeByDate = {};

    submissions.forEach(s => {
      const uid = s.user.toString();
      userSubmissionCount[uid] = (userSubmissionCount[uid] || 0) + 1;

      const dateKey = s.createdAt.toISOString().slice(0, 10);
      volumeByDate[dateKey] = (volumeByDate[dateKey] || 0) + 1;

      s.images.forEach(img => {
        outcomeCount[img.outcome] = (outcomeCount[img.outcome] || 0) + 1;

        // an image that didn't come out clean counts as a violation against the user
        if (img.outcome !== 'approved') {
          userViolationCount[uid] = (userViolationCount[uid] || 0) + 1;
        }

        img.verdictDetails.forEach(v => {
          if (v.result === 'violation') {
            categoryViolationCount[v.category] = (categoryViolationCount[v.category] || 0) + 1;
          }
        });
      });
    });

    // sort ascending so the trend chart reads left-to-right chronologically
    const submissionsOverTime = Object.entries(volumeByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // appeal stats
    const appealStats = {
      total: appeals.length,
      pending: appeals.filter(a => a.status === 'pending').length,
      accepted: appeals.filter(a => a.status === 'accepted').length,
      rejected: appeals.filter(a => a.status === 'rejected').length
    };

    // fetch every user who shows up in either ranking
    const allUserIds = new Set([
      ...Object.keys(userSubmissionCount),
      ...Object.keys(userViolationCount)
    ]);
    const users = await User.find({ _id: { $in: [...allUserIds] } }).select('name email');

    const rankedUsersBySubmissions = users
      .map(u => ({ user: u, submissionCount: userSubmissionCount[u._id.toString()] || 0 }))
      .sort((a, b) => b.submissionCount - a.submissionCount);

    const rankedUsersByViolations = users
      .map(u => ({ user: u, violationCount: userViolationCount[u._id.toString()] || 0 }))
      .filter(u => u.violationCount > 0)
      .sort((a, b) => b.violationCount - a.violationCount);

    res.json({
      totalSubmissions,
      totalImages,
      outcomeCount,
      categoryViolationCount,
      submissionsOverTime,
      appealStats,
      rankedUsersBySubmissions,
      rankedUsersByViolations
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
