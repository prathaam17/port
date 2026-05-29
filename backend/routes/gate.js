const express = require('express');
const router = express.Router();
const gateController = require('../controllers/gateController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, gateController.getGatePasses);

// Shipping Agent or Gate Officer can request/generate gate pass
router.post('/pass', verifyToken, checkRole(['Gate Officer', 'Shipping Agent', 'Super Admin']), gateController.generateGatePass);

// Gate officer checks truck in or out
router.post('/entry', verifyToken, checkRole(['Gate Officer', 'Super Admin']), gateController.processGateEntry);
router.post('/exit', verifyToken, checkRole(['Gate Officer', 'Super Admin']), gateController.processGateExit);

module.exports = router;
