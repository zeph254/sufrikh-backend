const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRoles } = require('../middlewares/authMiddleware');


// Add this verification
console.log('Admin Controller Methods:', {
  createAdmin: typeof adminController.createAdmin,
  getAdmins: typeof adminController.getAdmins,
  createWorker: typeof adminController.createWorker,
  getWorkers: typeof adminController.getWorkers,
  updateWorker: typeof adminController.updateWorker,
  deleteWorker: typeof adminController.deleteWorker
});

// Admin routes
// Admin routes
router.post('/admins', protect, requireRoles('SUPER_ADMIN'), adminController.createAdmin);
router.get('/admins', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.getAdmins);
router.put('/admins/:id', protect, requireRoles('SUPER_ADMIN'), adminController.updateAdmin);
router.delete('/admins/:id', protect, requireRoles('SUPER_ADMIN'), adminController.deleteAdmin);
router.put('/admins/:id/toggle-status', protect, requireRoles('SUPER_ADMIN'), adminController.toggleAdminStatus);

// Worker routes
router.post('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.createWorker);
router.get('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.getWorkers);
router.put('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.updateWorker);
router.delete('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.deleteWorker);
router.put('/workers/:id/toggle-status', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.toggleWorkerStatus);

module.exports = router;