const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, requireRoles } = require('../middlewares/authMiddleware');

router.get('/', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), customerController.getCustomers);
router.post('/', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), customerController.createCustomer);
router.put('/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), customerController.updateCustomer);
router.delete('/:id', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), customerController.deleteCustomer);
router.put('/:id/toggle-status', protect, requireRoles('ADMIN', 'SUPER_ADMIN'), customerController.toggleCustomerStatus);

module.exports = router;