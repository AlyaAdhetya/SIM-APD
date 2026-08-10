const express = require('express');
const router = express.Router();
const exportHistoryController = require('../controllers/exportHistoryController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.post('/save', requireAuth, requireRole(['hc']), exportHistoryController.saveExportHistory);
router.get('/list', requireAuth, requireRole(['hc']), exportHistoryController.listExportHistory);
router.get('/:id/data', requireAuth, requireRole(['hc']), exportHistoryController.getExportData);
router.delete('/:id', requireAuth, requireRole(['hc']), exportHistoryController.deleteExportHistory);

module.exports = router;
