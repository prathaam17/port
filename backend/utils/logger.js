const { AuditLog, Notification } = require('../models');

/**
 * Logs an administrative or operational action to the database.
 * Also triggers a role-specific notification if requested.
 */
const logActivity = async (req, action, details, notifyRole = null, notifyMsg = null) => {
  try {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'SYSTEM';
    const role = req.user ? req.user.role : 'SYSTEM';

    // Log to Audit Log
    await AuditLog.create({
      userId,
      username,
      role,
      action,
      details
    });

    // Create a notification if required
    if (notifyRole && notifyMsg) {
      await Notification.create({
        title: action.replace(/_/g, ' '),
        message: notifyMsg,
        roleTarget: notifyRole,
        isRead: false
      });
    }

    console.log(`[AUDIT] User: ${username} | Action: ${action} | Details: ${details}`);
  } catch (error) {
    console.error('Logging activity failed:', error);
  }
};

module.exports = {
  logActivity
};
