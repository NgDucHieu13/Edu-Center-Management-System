const express = require('express');
const controller = require('../controllers/student.controller');

const router = express.Router();

// Development only: open student APIs for local UI testing.
router.get('/', controller.list);
router.get('/:id/learning-history', controller.learningHistory);
router.get('/:id/payment-history', controller.paymentHistory);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
