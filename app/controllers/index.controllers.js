const Todo = require('../models/Todo');

exports.getAllTodos = async (req, res) => {
  try {
    const allTodos = await Todo.find();
    res.status(200).json({ todos: allTodos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
