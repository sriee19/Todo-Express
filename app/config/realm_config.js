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

let onlineRealmInstance;
let offlineRealmInstance;

async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
}

async function ensureDirectoryExists(directoryPath) {
  try {
    if (fs.existsSync(directoryPath)) {
      logger.info(`Directory already exists at path: ${directoryPath}`);
    } else {
      fs.mkdirSync(directoryPath, { recursive: true });
      logger.info(`Directory created at path: ${directoryPath}`);
    }
    return directoryPath;
  } catch (err) {
    logger.error(`Failed to create directory at path: ${directoryPath}`, err);
    throw err;
  }
}

async function syncCloudToLocal() {
  try {
    const todos = onlineRealmInstance.objects('Todo');
    const todosPlain = todos.map(todo => ({
      _id: todo._id.toHexString(),
      todo: todo.todo,
      done: todo.done,
    }));

    logger.info('Fetched TODOs from cloud:', todosPlain);

    offlineRealmInstance.write(() => {
      todosPlain.forEach(todo => {
        logger.info('Storing/Updating todo', { todo });
        offlineRealmInstance.create('Todo', {
          _id: new BSON.ObjectId(todo._id),
          todo: todo.todo,
          done: todo.done
        }, 'modified');
      });
    });

    logger.info('Data successfully stored/updated in offline Realm', { count: todosPlain.length });
  } catch (err) {
    logger.error('Error syncing cloud data to local offline Realm:', err);
    throw err;
  }
}

async function openRealm(syncOnOnline = false) {
  const appId = 'todo-electron-cteedtf';
  const realmPath = path.join(os.homedir(), 'TodoDB', 'local_realm');
  const offlineRealmPath = path.join(os.homedir(), 'TodoDB', 'offline_realm');

  await ensureDirectoryExists(path.dirname(realmPath));

  const isOnline = await checkNetworkStatus();

  if (onlineRealmInstance && !onlineRealmInstance.isClosed) {
    logger.info('Closing existing online Realm instance before opening a new one.');
    onlineRealmInstance.close();
  }
  if (offlineRealmInstance && !offlineRealmInstance.isClosed) {
    logger.info('Closing existing offline Realm instance before opening a new one.');
    offlineRealmInstance.close();
  }

  offlineRealmInstance = await Realm.open({
    schema: [TodoSchema],
    path: offlineRealmPath,
    schemaVersion: 1,
  });

  if (!isOnline) {
    logger.info('Offline mode detected. Using offline Realm only.');
    return offlineRealmInstance;
  } else {
    const app = new Realm.App({ id: appId });
    const credentials = Realm.Credentials.anonymous();
    const user = await app.logIn(credentials);
    logger.info('User logged in', { user });

    try {
      onlineRealmInstance = await Realm.open({
        schema: [TodoSchema],
        sync: {
          user: user,
          flexible: true,
        },
        path: realmPath,
        schemaVersion: 1,
        onError: (err) => {
          logger.error('Realm sync error:', err);
        },
      });

      await onlineRealmInstance.subscriptions.update(mutableSubs => {
        mutableSubs.add(onlineRealmInstance.objects('Todo'));
      });

      logger.info('Connected to MongoDB Realm and syncing cloud data to local offline Realm.');

      await syncCloudToLocal();

    } catch (syncErr) {
      if (syncErr.message.includes("Incompatible histories")) {
        logger.error('Incompatible histories detected. Attempting to clear local data...');

        await clearLocalDatabase(offlineRealmPath);
        offlineRealmInstance = await openRealm(syncOnOnline); 
      } else {
        throw syncErr;
      }
    }
    return onlineRealmInstance;
  }
}

async function clearLocalDatabase(realmPath) {
  try {
    const realm = await Realm.open({
      schema: [TodoSchema],
      path: realmPath,
      schemaVersion: 1,
    });

    realm.write(() => {
      realm.deleteAll();
    });

    logger.info('Local database cleared successfully');
  } catch (err) {
    logger.error('Failed to clear local database:', err);
  }
}

module.exports = openRealm;
