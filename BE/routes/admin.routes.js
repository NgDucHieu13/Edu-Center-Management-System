const express = require('express');
const controller = require('../controllers/admin.controller');
const router = express.Router();

router.get('/finance', controller.finance);
router.post('/refunds', controller.createRefund);
router.post('/refunds/:id/:action', controller.reviewRefund);
router.get('/settings', controller.settings);
router.put('/settings', controller.saveSettings);
router.post('/branches', controller.createBranch);
router.patch('/branches/:id', controller.updateBranch);

module.exports = router;
