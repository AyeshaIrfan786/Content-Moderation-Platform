// routes/appeals.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createAppeal, getMyAppeals, getAllAppeals, resolveAppeal
} = require('../controllers/appealController');

router.post('/', protect, createAppeal);
router.get('/my', protect, getMyAppeals);
router.get('/', protect, adminOnly, getAllAppeals);
router.patch('/:id', protect, adminOnly, resolveAppeal);

module.exports = router;