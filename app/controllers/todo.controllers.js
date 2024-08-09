const getRealm = require('../config/realm_config');
const logger = require('../config/logger');
const BSON = require('bson');
const dns = require('dns');

exports.addTodo = async (req, res) => {
  const { todo } = req.body;
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new BSON.ObjectId(),
        todo,
        done: false,
      });
    });

    logger.info('Successfully added todo');
    res.status(200).json({ message: 'Successfully added todo!' });

    if (realm.syncSession) {
      await realm.syncSession.uploadAllLocalChanges();
      logger.info('Local data synced to MongoDB Atlas');
    }
  } catch (err) {
    logger.error('Error adding todo:', err);
    res.status(500).send('Internal Server Error');
  }
};

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
}

exports.fetchTodos = async (req, res) => {
  try {
    const realm = await getRealm();
    const isOnline = await checkNetworkStatus();

    let todos;
    if (isOnline) {
      logger.info('Client online');
      todos = realm.objects('Todo');
    } else {
      logger.info('Client offline');
      todos = realm.objects('Todo');
    }
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done,
    }));

    res.status(200).json(todosPlain);
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    res.status(500).send('Internal Server Error');
  }
};
