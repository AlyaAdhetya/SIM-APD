const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { uploadProfile } = require('../middlewares/upload');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/change_password', requireAuth, authController.changePassword);
router.put('/update_profile', requireAuth, uploadProfile.single('foto'), authController.updateProfile);

module.exports = router;
