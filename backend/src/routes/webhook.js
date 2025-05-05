const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/hotmart', webhookController.handleHotmartWebhook);

module.exports = router;
