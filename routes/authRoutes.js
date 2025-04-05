const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { 
  protect, 
  requireRoles, 
  requireVerified 
} = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protected user routes
router.get('/me', protect, authController.getMe);
router.patch('/update-password', protect, requireVerified, authController.updatePassword);
router.post('/verify-email', protect, authController.verifyEmail);

// Admin routes (protected + role-checked)
router.post('/admins', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.createAdmin);
router.get('/admins', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.listAdmins);

module.exports = router;