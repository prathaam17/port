const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', verifyToken, cargoController.getCargoes);
router.get('/:id', verifyToken, cargoController.getCargoById);

// Shipping Agent or Admin uploads manifest
router.post('/manifest', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), upload.single('manifest'), cargoController.uploadManifest);

// Bulk manifest upload
router.post('/bulk-manifest', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.uploadBulkManifest);

// Generate Delivery Order
router.post('/:id/delivery-order', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.generateDeliveryOrder);

// Port Ops Officer unloads cargo
router.put('/:id/unload', verifyToken, checkRole(['Port Operations Officer', 'Super Admin']), cargoController.unloadCargo);

// Warehouse Manager allocates space
router.put('/:id/allocate', verifyToken, checkRole(['Warehouse Manager', 'Super Admin']), cargoController.assignWarehouse);

module.exports = router;
