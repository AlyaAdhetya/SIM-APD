const express = require('express');
const router = express.Router();
const rusakHilangController = require('../controllers/rusakHilangController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/list', requireAuth, requireRole(['hc', 'hsse']), rusakHilangController.getListRusakHilang);
router.post('/update_status', requireAuth, requireRole(['hsse']), rusakHilangController.updateStatus);

module.exports = router;
