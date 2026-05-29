const express = require('express');
const router = express.Router();
const customsController = require('../controllers/customsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, checkRole(['Customs Officer', 'Super Admin']), customsController.getCustomsRequests);
router.put('/:id', verifyToken, checkRole(['Customs Officer', 'Super Admin']), customsController.updateCustomsStatus);

module.exports = router;
