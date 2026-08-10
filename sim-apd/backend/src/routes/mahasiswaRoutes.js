const express = require('express');
const router = express.Router();
const mahasiswaController = require('../controllers/mahasiswaController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { uploadMemory } = require('../middlewares/upload');

router.get('/list', requireAuth, mahasiswaController.getListMahasiswa);
router.post('/update_status', requireAuth, requireRole(['hc']), mahasiswaController.updateStatus);
router.put('/update/:id', requireAuth, requireRole(['hc']), mahasiswaController.updateMahasiswa);
router.delete('/delete/:id', requireAuth, requireRole(['hc']), mahasiswaController.deleteMahasiswa);
router.delete('/delete_all', requireAuth, requireRole(['hc']), mahasiswaController.deleteAllMahasiswa);
router.post('/import', requireAuth, requireRole(['hc']), uploadMemory.single('file'), mahasiswaController.importMahasiswa);

module.exports = router;
