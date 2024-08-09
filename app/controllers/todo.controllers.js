const getRealm = require('../config/realm_config');
const logger = require('../config/logger');
const dns = require('dns');
const BSON = require('bson');

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
}



async function fetchTodosFromLocal() {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done
    }));
    
    logger.info('Fetched TODOs from local database:', todosPlain);
    return todosPlain;
  } catch (err) {
    logger.error('Error fetching TODOs from local database:', err);
    throw err;
  }
}

async function fetchTodosFromCloud() {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done
    }));
    
    logger.info('Fetched TODOs from cloud:', todosPlain);
    return todosPlain;
  } catch (err) {
    logger.error('Error fetching TODOs from cloud:', err);
    throw err;
  }
}


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

exports.fetchTodos = async (req, res) => {
  try {
    const realm = await getRealm();
    const isOnline = await checkNetworkStatus();

    let todos;
    if (isOnline) {
      logger.info('Client online');
      todos = await fetchTodosFromCloud(); 
    } else {
      logger.info('Client offline');
      todos = await fetchTodosFromLocal();
    }
    res.status(200).json(todos);
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    res.status(500).send('Internal Server Error');
  }
};
