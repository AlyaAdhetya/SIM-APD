const express = require('express');
const router = express.Router();
const pengembalianController = require('../controllers/pengembalianController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { uploadDisk } = require('../middlewares/upload');

router.get('/list', requireAuth, pengembalianController.getListPengembalian);
router.get('/by_qr', requireAuth, pengembalianController.getByQr);
router.post('/create', requireAuth, requireRole(['mahasiswa']), uploadDisk.any(), pengembalianController.createPengembalian);
router.post('/approve', requireAuth, requireRole(['hc', 'hsse']), pengembalianController.approvePengembalian);
router.post('/confirm-scan', requireAuth, requireRole(['mahasiswa', 'hc', 'admin']), pengembalianController.confirmScanPengembalian);
router.delete('/delete/:id', requireAuth, requireRole(['hc', 'hsse']), pengembalianController.deletePengembalian);

module.exports = router;
