const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { protect, requireRoles } = require('../middlewares/authMiddleware');
const { checkUserOwnership } = require('../middlewares/ownershipCheck');

// Admin-only routes
router.get('/', protect, requireRoles('ADMIN'), userController.getAllUsers);
router.get('/:id', protect, userController.getUser);

// Protected routes
router.put('/:id', protect, checkUserOwnership, userController.updateUser);
router.delete('/:id', protect, checkUserOwnership, userController.deleteUser);

module.exports = router;