const express = require('express');
const { registerUser, verifyEmail, resendVerificationCode, loginUser, getUser } = require('../controller/userController');
const { checkEmailConfig } = require('../utils/emailService');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');

router.route('/register').post(registerUser);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-verification').post(resendVerificationCode);
router.route('/login').post(loginUser);
router.route('/').get(protect, getUser);

// Debug-only email config healthcheck
router.get('/_email-health', async (req, res) => {
    if (process.env.EMAIL_DEBUG !== '1') {
        return res.status(404).json({ message: 'Not found' });
    }
    try {
        const result = await checkEmailConfig();
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

module.exports = router;