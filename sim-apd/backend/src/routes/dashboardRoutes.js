const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/hc_summary', requireAuth, requireRole(['hc']), dashboardController.getHcSummary);
router.get('/hsse_summary', requireAuth, requireRole(['hsse']), dashboardController.getHsseSummary);

module.exports = router;
