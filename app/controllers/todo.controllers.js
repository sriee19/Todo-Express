const getRealm = require('../config/realm_config');
const logger = require('../config/logger');
const BSON = require('bson');
const dns = require('dns');

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
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
      await syncLocalData();
    }
  } catch (err) {
    logger.error('Error adding todo:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.fetchTodos = async (req, res) => {
  try {
    const isOnline = await checkNetworkStatus();
    const realm = await getRealm();

    if (isOnline) {
      logger.info('Client online');
      try {
        const cloudTodos = await fetchTodosFromCloud(realm);
        await storeInLocalDatabase(cloudTodos);
        return res.status(200).json(cloudTodos);
      } catch (err) {
        logger.error('Error fetching TODOs from cloud:', err);
        // Fallback to local data if cloud fetch fails
        const todos = await fetchTodosFromLocal(realm);
        return res.status(200).json(todos);
      }
    } else {
      logger.info('Client offline');
      const todos = await fetchTodosFromLocal(realm);
      return res.status(200).json(todos);
    }
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    res.status(500).send('Internal Server Error');
  }
};


async function fetchTodosFromCloud(realm) {
  try {
    const todos = realm.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done,
    }));
    logger.info('Fetched TODOs from cloud:', todosPlain);
    return todosPlain;
  } catch (err) {
    logger.error('Error fetching TODOs from cloud:', err);
    throw err;
  }
}

async function fetchTodosFromLocal(realm) {
  try {
    logger.info('Realm instance retrieved for local fetch');
    const todos = realm.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done,
    }));
    logger.info('Fetched TODOs from local database:', todosPlain);
    return todosPlain;
  } catch (err) {
    logger.error('Error fetching TODOs from local database:', err);
    throw err;
  }
}

async function storeInLocalDatabase(todos) {
  try {
    const realm = await getRealm();
    logger.info('Starting to store data in local database');

    realm.write(() => {
      todos.forEach(todo => {
        logger.info('Storing/Updating todo', { todo });
        realm.create('Todo', {
          _id: new BSON.ObjectId(todo._id),
          todo: todo.todo,
          done: todo.done
        }, 'modified');
      });
    });

    logger.info('Data successfully stored/updated in local database', { count: todos.length });
  } catch (err) {
    logger.error('Error storing/updating data in local database:', err);
    throw err;
  }
}


async function syncLocalData() {
  try {
    const realm = await getRealm();
    await realm.syncSession.uploadAllLocalChanges();
    logger.info('Local data synced to MongoDB Atlas');
  } catch (err) {
    logger.error('Error syncing local data:', err);
  }
}
