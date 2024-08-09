const Realm = require('realm');
const logger = require('../config/logger');
const dns = require('dns');
const path = require('path');
const os = require('os');
const fs = require('fs');
const BSON = require('bson');

const TodoSchema = {
  name: 'Todo',
  properties: {
    _id: 'objectId',
    done: 'bool',
    todo: 'string',
  },
  primaryKey: '_id',
};

let realmInstance;

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
}

async function ensureDirectoryExists(directoryPath) {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
      logger.info(`Directory created at path: ${directoryPath}`);
    }
  } catch (err) {
    logger.error(`Failed to create directory at path: ${directoryPath}`, err);
    throw err;
  }
}

async function syncCloudToLocal() {
  try {
    const todos = realmInstance.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done,
    }));
    logger.info('Fetched TODOs from cloud:', todosPlain);

    realmInstance.write(() => {
      todosPlain.forEach(todo => {
        logger.info('Storing/Updating todo', { todo });
        realmInstance.create('Todo', {
          _id: new BSON.ObjectId(todo._id),
          todo: todo.todo,
          done: todo.done
        }, 'modified');
      });
    });

    logger.info('Data successfully stored/updated in local database', { count: todosPlain.length });
  } catch (err) {
    logger.error('Error syncing cloud data to local database:', err);
    throw err;
  }
}

async function clearLocalDatabase() {
  try {
    const realm = await Realm.open({
      path: 'C:/Users/srisa/AppData/Local/TodoApp/local_realm',
      schema: [TodoSchema],
    });

    realm.write(() => {
      realm.deleteAll();
    });

    logger.info('Local database cleared successfully');
    realm.close();
  } catch (err) {
    logger.error('Failed to clear local database:', err);
  }
}

async function getRealm(syncOnOnline = false) {
  const appId = 'todo-electron-cteedtf';
  const realmPath = path.join(os.homedir(),'local_realm');
  
  await ensureDirectoryExists(path.dirname(realmPath));

  const isOnline = await checkNetworkStatus();

  if (!isOnline) {
    logger.info('Offline mode detected. Opening local Realm only.');
    try {
      realmInstance = await Realm.open({
        schema: [TodoSchema],
        path: realmPath,
      });
      logger.info('Local Realm opened successfully in offline mode.');
    } catch (localErr) {
      logger.error('Error opening local Realm:', localErr);
      throw localErr;
    }
  } else {
    try {
      const app = new Realm.App({ id: appId });
      const credentials = Realm.Credentials.anonymous();
      const user = await app.logIn(credentials);
      logger.info('User logged in', { user });

      try {
        realmInstance = await Realm.open({
          schema: [TodoSchema],
          sync: {
            user: user,
            flexible: true,
          },
          path: realmPath,
          onError: (err) => {
            logger.error('Realm sync error:', err);
          },
        });

        await realmInstance.subscriptions.update(mutableSubs => {
          mutableSubs.add(realmInstance.objects('Todo'));
        });

        logger.info('Connected to MongoDB Realm and synced cloud data to local Realm.');
        
        // Store cloud data to local database
        await syncCloudToLocal();

      } catch (syncErr) {
        if (syncErr.message.includes("Incompatible histories")) {
          logger.error('Incompatible histories detected. Attempting to merge local data with cloud data...');
          
          const localData = await fetchTodosFromLocal(realmInstance);
          realmInstance.close();

          await clearLocalDatabase(realmPath);
          realmInstance = await Realm.open({
            schema: [TodoSchema],
            sync: {
              user: user,
              flexible: true,
            },
            path: realmPath,
            onError: (err) => {
              logger.error('Realm sync error:', err);
            },
          });

          await realmInstance.subscriptions.update(mutableSubs => {
            mutableSubs.add(realmInstance.objects('Todo'));
          });

          await storeInLocalDatabase(localData);
          logger.info('Successfully merged local data with cloud data.');
        } else {
          throw syncErr;
        }
      }
    } catch (err) {
      logger.error('Error connecting to MongoDB Realm:', err);
      try {
        realmInstance = await Realm.open({
          schema: [TodoSchema],
          path: realmPath,
        });
        logger.info('Opened local Realm due to network issues.');
      } catch (localErr) {
        logger.error('Error opening local Realm:', localErr);
        throw localErr;
      }
    }
  }

  return realmInstance;
}


module.exports = getRealm;
