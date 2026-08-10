const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjamanController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/list', requireAuth, peminjamanController.getListPeminjaman);
router.get('/detail', requireAuth, peminjamanController.getDetailPeminjaman);
router.post('/approve', requireAuth, requireRole(['hc']), peminjamanController.approvePeminjaman);
router.delete('/delete/:id', requireAuth, requireRole(['hc']), peminjamanController.deletePeminjaman);
router.put('/finish/:id', requireAuth, requireRole(['hc']), peminjamanController.finishPeminjaman);
router.post('/:id/send-reminder', requireAuth, requireRole(['hc']), peminjamanController.sendReminderPeminjaman);

module.exports = router;
