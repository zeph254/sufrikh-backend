// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const dbConnection = require('../middlewares/dbConnection');
const { protect } = require('../middlewares/authMiddleware');
const { otpRateLimiter } = require('../middlewares/rateLimit');
const otpController = require('../controllers/otpController');

router.post('/request', dbConnection, protect, otpRateLimiter, otpController.requestOTP);
router.post('/verify', dbConnection, protect, otpController.verifyOTP);

module.exports = router;