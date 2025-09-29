const express = require('express');
const { registerUser, verifyEmail, resendVerificationCode, loginUser, getUser } = require('../controller/userController');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');

router.route('/register').post(registerUser);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-verification').post(resendVerificationCode);
router.route('/login').post(loginUser);
router.route('/').get(protect, getUser);

module.exports = router;