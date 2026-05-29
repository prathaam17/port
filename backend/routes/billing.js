const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, billingController.getInvoices);
router.get('/payments', verifyToken, billingController.getPayments);

// Only Finance and Admin can process payments
router.put('/:id/pay', verifyToken, checkRole(['Finance', 'Super Admin']), billingController.payInvoice);

module.exports = router;
