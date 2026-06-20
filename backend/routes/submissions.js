// routes/submissions.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createSubmission, getSubmissions, getSubmissionById } = require('../controllers/submissionController');

router.post('/', protect, upload.array('images', 10), createSubmission);
router.get('/', protect, getSubmissions);
router.get('/:id', protect, getSubmissionById);

module.exports = router;