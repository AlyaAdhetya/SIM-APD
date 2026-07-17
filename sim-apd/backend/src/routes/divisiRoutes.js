const express = require('express');
const router = express.Router();
const divisiController = require('../controllers/divisiController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/list', requireAuth, divisiController.getListDivisi);
router.post('/save', requireAuth, requireRole(['hc']), divisiController.saveDivisi);

module.exports = router;
