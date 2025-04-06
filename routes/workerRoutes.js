// routes/workerRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireRoles } = require('../middlewares/authMiddleware');

router.post('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.createWorker);
router.get('/workers', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.getWorkers);
router.put('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.updateWorker);
router.delete('/workers/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), adminController.deleteWorker);

module.exports = router;