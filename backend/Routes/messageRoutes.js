const express = require('express');
const { protect } = require('../middleware/authmiddleware');
const router = express.Router();
const { sendMessage, getMessages } = require('../controller/messageController');

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, getMessages);

module.exports = router;
