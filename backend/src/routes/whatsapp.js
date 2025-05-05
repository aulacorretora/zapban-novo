const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.post('/instances', whatsappController.createInstance);

router.get('/instances', whatsappController.getUserInstances);

router.get('/instances/:instanceId', whatsappController.getInstance);

router.delete('/instances/:instanceId', whatsappController.deleteInstance);

router.get('/instances/:instanceId/qr', whatsappController.generateQR);

router.get('/instances/:instanceId/status', whatsappController.getStatus);

router.get('/instances/:instanceId/chats', whatsappController.getChats);

router.get('/instances/:instanceId/contacts', whatsappController.getContacts);

module.exports = router;
