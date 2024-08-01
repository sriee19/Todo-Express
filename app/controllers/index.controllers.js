const getRealm = require('../../app');

exports.getAllTodos = async (req, res) => {
  try {
    const realm = await getRealm();
    const allTodos = realm.objects('Todo');
    res.status(200).json({ todos: allTodos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
