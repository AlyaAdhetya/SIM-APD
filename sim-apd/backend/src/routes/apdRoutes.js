const express = require('express');
const router = express.Router();
const apdController = require('../controllers/apdController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Public route for viewing lists (or just for logged in users)
router.get('/list', requireAuth, apdController.getListApd);

// Routes for Staff (HC/HSSE)
router.post('/jenis_create', requireAuth, requireRole(['hc', 'hsse']), apdController.createJenisApd);
router.post('/stok_create', requireAuth, requireRole(['hc', 'hsse']), apdController.createStokApd);
router.post('/stok_update', requireAuth, requireRole(['hc', 'hsse']), apdController.updateStokApd);
router.post('/nonaktifkan', requireAuth, requireRole(['hc', 'hsse']), apdController.nonaktifkanApd);

module.exports = router;
