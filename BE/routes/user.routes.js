const express = require('express');
const controller = require('../controllers/user.controller');

const router = express.Router();

// Development only: open account CRUD for local UI testing.
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.lock);

module.exports = router;
