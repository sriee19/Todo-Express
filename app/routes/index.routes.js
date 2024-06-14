const express = require('express');
const router = express.Router();
const todoController = require('../controllers/index.controllers');

router.get('/get', todoController.getAllTodos);

module.exports = router;
