const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/hc_summary', requireAuth, requireRole(['hc']), dashboardController.getHcSummary);
router.get('/stok_apd',   requireAuth, requireRole(['hc']), dashboardController.getStokApd);
router.get('/notifications', requireAuth, requireRole(['hc']), dashboardController.getNotifications);
router.put('/notifications/:id/read', requireAuth, requireRole(['hc']), dashboardController.markNotificationRead);

module.exports = router;
