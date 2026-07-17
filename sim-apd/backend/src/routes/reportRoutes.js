const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/kepatuhan_apd', requireAuth, requireRole(['hc', 'hsse']), reportController.getKepatuhanApd);
router.get('/penggunaan_apd', requireAuth, requireRole(['hc', 'hsse']), reportController.getPenggunaanApd);
router.get('/status_peminjaman', requireAuth, requireRole(['hc', 'hsse']), reportController.getStatusPeminjaman);

module.exports = router;
