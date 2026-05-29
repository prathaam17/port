const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, warehouseController.getWarehouses);
router.get('/:id', verifyToken, warehouseController.getWarehouseById);

// Warehouse manager reports cargo damages
router.post('/damage', verifyToken, checkRole(['Warehouse Manager', 'Super Admin']), warehouseController.reportDamage);
router.get('/damaged/reports', verifyToken, checkRole(['Warehouse Manager', 'Super Admin', 'Port Operations Officer']), warehouseController.getDamagedCargoReports);

module.exports = router;
