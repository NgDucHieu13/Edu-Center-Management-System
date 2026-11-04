const express = require('express');
const controller = require('../controllers/student-purchase.controller');

const router = express.Router();
router.post('/course', controller.checkout);
router.post('/requests', controller.requestCheckout);
router.get('/requests', controller.listRequests);
router.post('/requests/:id/:action', controller.reviewRequest);

module.exports = router;
