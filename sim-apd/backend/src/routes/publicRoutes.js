const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Endpoint untuk frontend public form
router.get('/check-nim/:nim', publicController.checkNim);
router.post('/submit-form', publicController.submitForm);
router.get('/apd-stok', publicController.getApdStok); // Untuk load pilihan APD di form

module.exports = router;
