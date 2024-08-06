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
        done: false
      });
    });

    logger.info('Successfully added todo');
    res.status(200).json({ message: 'Successfully added todo!' });

    // Check network status to sync data if online
    const isOnline = await checkNetworkStatus();
    if (isOnline) {
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

    if (isOnline) {
      logger.info('Client online');
      const cloudTodos = await fetchTodosFromCloud();
      await storeInLocalDatabase(cloudTodos);
      // await syncLocalData();
      return res.status(200).json(cloudTodos);
    } else {
      try {
        const todos = await fetchTodosFromLocal();
        if (!todos || todos.length === 0) {
          logger.warn('No TODOs returned from local database fetch');
        }
        return res.status(200).json(todos);
      } catch (err) {
        logger.error('Error in fetchTodos:', err);
        return res.status(500).send('Internal Server Error');
      }
      
    }
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    return res.status(500).send('Internal Server Error');
  }
};

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
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

async function fetchTodosFromLocal() {
  try {
    const realm = await getRealm();
    logger.info('Realm instance retrieved for local fetch');
    
    const todos = realm.objects('Todo');
    if (todos.length === 0) {
      logger.warn('No TODOs found in local database');
    } else {
      logger.info(`Found ${todos.length} TODOs in local database`);
    }
    
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


async function storeInLocalDatabase(todos) {
  try {
    const realm = await getRealm();
    logger.info('Starting to store data in local database');
    
    realm.write(() => {
      todos.forEach(todo => {
        logger.info('Storing todo', { todo });
        realm.create('Todo', {
          _id: new BSON.ObjectId(todo._id),
          todo: todo.todo,
          done: todo.done
        }, 'modified');
      });
    });

    logger.info('Data successfully stored in local database', { count: todos.length });
  } catch (err) {
    logger.error('Error storing data in local database:', err);
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
