const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Make sure these routes are properly mounted in your main app.js/server.js
router.post('/forgot', passwordController.forgotPassword);
router.post('/reset-password/:token', passwordController.resetPassword);

module.exports = router;