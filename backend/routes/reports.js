const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);
router.get('/analytics', verifyToken, reportController.getAnalyticsReports);
router.get('/notifications', verifyToken, reportController.getNotifications);
router.put('/notifications/read', verifyToken, reportController.markNotificationsRead);

// Only Super Admin can view audit logs
router.get('/audit-logs', verifyToken, checkRole(['Super Admin']), reportController.getAuditLogs);

module.exports = router;
