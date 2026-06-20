// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPolicies, updatePolicy, getAllSubmissions, overrideVerdict, getAnalytics
} = require('../controllers/adminController');

router.use(protect, adminOnly); // is poori route file mein sab admin-only hai

router.get('/policies', getPolicies);
router.put('/policies/:category', updatePolicy);
router.get('/submissions', getAllSubmissions);
router.patch('/submissions/override', overrideVerdict);
router.get('/analytics', getAnalytics);

module.exports = router;