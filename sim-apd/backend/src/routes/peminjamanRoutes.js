const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjamanController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { uploadDisk } = require('../middlewares/upload');

router.get('/list', requireAuth, peminjamanController.getListPeminjaman);
router.get('/detail', requireAuth, peminjamanController.getDetailPeminjaman);
router.post('/create', requireAuth, requireRole(['mahasiswa']), uploadDisk.any(), peminjamanController.createPeminjaman);
router.post('/approve', requireAuth, requireRole(['hc', 'hsse']), peminjamanController.approvePeminjaman);
router.post('/reject', requireAuth, requireRole(['hc', 'hsse']), peminjamanController.rejectPeminjaman);
router.delete('/delete/:id', requireAuth, requireRole(['hc', 'hsse', 'mahasiswa']), peminjamanController.deletePeminjaman);

module.exports = router;
