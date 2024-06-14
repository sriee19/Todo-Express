const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controllers');

router.post('/add/todo', todoController.addTodo);
router.get('/delete/todo/:_id', todoController.deleteTodo);

module.exports = router;
