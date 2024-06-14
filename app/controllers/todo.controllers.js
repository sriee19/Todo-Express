const Todo = require('../models/Todo');

exports.addTodo = async (req, res) => {
  // console.log('Request body:', req.body);
  const { todo } = req.body;
  try {
    const newTodo = new Todo({
      todo
    });
    await newTodo.save();
    console.log("Successfully added todo!");
    res.status(200).json({Todo:newTodo});
    // res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteTodo = async (req, res) => {
  const { _id } = req.params;
  try {
    await Todo.deleteOne({ _id });
    console.log("Deleted Todo Successfully!");
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
