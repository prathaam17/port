const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes here are admin only
router.get('/', verifyToken, checkRole(['Super Admin']), userController.getUsers);
router.post('/', verifyToken, checkRole(['Super Admin']), userController.createUser);
router.put('/:id', verifyToken, checkRole(['Super Admin']), userController.updateUser);
router.delete('/:id', verifyToken, checkRole(['Super Admin']), userController.deleteUser);
router.get('/roles', verifyToken, checkRole(['Super Admin']), userController.getRoles);

module.exports = router;
