const express = require('express');
const router = express.Router();
const permintaanController = require('../controllers/permintaanController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/list', requireAuth, requireRole(['hc', 'hsse']), permintaanController.getListPermintaan);
router.post('/create', requireAuth, requireRole(['hc', 'hsse']), permintaanController.createPermintaan);
router.post('/approve', requireAuth, requireRole(['hsse']), permintaanController.approvePermintaan);
router.post('/reject', requireAuth, requireRole(['hsse']), permintaanController.rejectPermintaan);

module.exports = router;
