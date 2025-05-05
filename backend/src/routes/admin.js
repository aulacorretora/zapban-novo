const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

router.get('/instances', adminController.getInstances);
router.delete('/instances/:instanceId', adminController.deleteInstance);

router.post('/export/:type', adminController.exportData);

module.exports = router;
