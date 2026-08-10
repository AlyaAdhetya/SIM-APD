const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.post('/send-restock', requireAuth, requireRole(['hc']), emailController.sendRestockEmail);

module.exports = router;
