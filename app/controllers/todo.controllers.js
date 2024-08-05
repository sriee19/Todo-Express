const getRealm = require('../config/realm_config');
const logger = require('../config/logger');
const BSON = require('bson');

exports.addTodo = async (req, res) => {
  const { todo } = req.body;
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new BSON.ObjectId(),
        todo,
        done: false
      });
    });

    logger.info('Successfully added todo', { todo });
    res.status(200).json({ message: 'Successfully added todo!' });
  } catch (err) {
    logger.error('Error adding todo:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.fetchTodosFromLocal = async () => {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done
    }));
    logger.info('Fetched TODOs', { count: todosPlain.length });
    return todosPlain;
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    throw err;
  }
};


exports.fetchCloudTodos = async (req, res) => {
  try {
    const todos = await fetchTodosFromCloud();
    res.status(200).json(todos);
  } catch (err) {
    logger.error('Error fetching TODOs from cloud:', err);
    res.status(500).send('Internal Server Error');
  }
};

async function fetchTodosFromCloud() {
  return [
    { _id: new BSON.ObjectId(), todo: 'Example Cloud TODO 1', done: false },
    { _id: new BSON.ObjectId(), todo: 'Example Cloud TODO 2', done: true }
  ];
}
