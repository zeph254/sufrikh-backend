const express = require('express');
const router = express.Router();
const { protect, requireRoles } = require('../middlewares/authMiddleware');
const { checkUserOwnership } = require('../middlewares/ownershipCheck');
const userController = require('../controllers/user');
const upload = require('../middlewares/cloudinaryMiddleware');

// Protected profile picture upload route
// userRoutes.js
router.post(
    '/upload-profile',
    protect, // This must set req.user
    upload.single('image'), 
    userController.updateProfilePicture
  );
  
  
  // Keep existing ID-based route for compatibility
  router.post(
    '/:id/upload-profile',
    protect,
    checkUserOwnership,
    upload.single('image'),
    userController.updateProfilePicture
  );

// Admin-only routes
router.get('/', protect, requireRoles('ADMIN'), userController.getAllUsers);
// routes/userRoutes.js

router.get(
    '/:id', 
    protect, 
    (req, res, next) => {
      // Add cache control headers
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      next();
    }, 
    userController.getUser
  );

// Protected routes
router.put('/:id', protect, checkUserOwnership, userController.updateUser);
router.delete('/:id', protect, checkUserOwnership, userController.deleteUser);

module.exports = router;