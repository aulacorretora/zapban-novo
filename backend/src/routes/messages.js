const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const upload = require('../middleware/upload');

router.get('/instances/:instanceId/chats/:chatId', messageController.getMessages);

router.post('/instances/:instanceId/chats/:chatId', upload.single('media'), messageController.sendMessage);

router.get('/templates', messageController.getTemplates);

router.post('/templates', messageController.createTemplate);

router.put('/templates/:templateId', messageController.updateTemplate);

router.delete('/templates/:templateId', messageController.deleteTemplate);

module.exports = router;
