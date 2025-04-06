const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRoles } = require('../middlewares/authMiddleware');


// Add this verification
console.log('Admin Controller Methods:', {
  createAdmin: typeof adminController.createAdmin,
  listAdmins: typeof adminController.listAdmins,
  createWorker: typeof adminController.createWorker,
  getWorkers: typeof adminController.getWorkers,
  updateWorker: typeof adminController.updateWorker,
  deleteWorker: typeof adminController.deleteWorker
});

// Admin routes
router.post('/admins', protect, requireRoles('SUPER_ADMIN'), adminController.createAdmin);
router.get('/admins', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.listAdmins);

// Worker routes
router.post('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.createWorker);
router.get('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.getWorkers);
router.put('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.updateWorker);
router.delete('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.deleteWorker);

module.exports = router;