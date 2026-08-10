const express = require('express');
const router = express.Router();
const apdController = require('../controllers/apdController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Public route for viewing lists (or just for logged in users)
router.get('/list', requireAuth, apdController.getListApd);

// Routes for Staff (HC)
router.post('/jenis_create', requireAuth, requireRole(['hc']), apdController.createJenisApd);
router.post('/stok_create', requireAuth, requireRole(['hc']), apdController.createStokApd);
router.post('/stok_update', requireAuth, requireRole(['hc']), apdController.updateStokApd);
router.post('/nonaktifkan', requireAuth, requireRole(['hc']), apdController.nonaktifkanApd);

module.exports = router;
