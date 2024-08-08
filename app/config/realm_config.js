const Realm = require('realm');
const logger = require('../config/logger');
const dns = require('dns');
const path = require('path');
const os = require('os');
const fs = require('fs');

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

async function clearLocalDatabase(realmPath) {
  try {
    if (fs.existsSync(realmPath)) {
      fs.rmdirSync(realmPath, { recursive: true });
      logger.info('Local Realm database cleared successfully');
    }
  } catch (err) {
    logger.error('Failed to clear local Realm database:', err);
    throw err;
  }
}

async function getRealm(syncOnOnline = false) {
  const appId = 'todo-electron-cteedtf';

  if (!appId) {
    const err = new Error('Realm App ID is not set in the environment variables');
    logger.error(err);
    throw err;
  }

  const realmPath = path.join(os.homedir(), 'AppData', 'Local', 'TodoApp', 'local_realm');
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
      if (localErr.message.includes("Incompatible histories")) {
        logger.error('Incompatible histories detected, clearing local database...');
        await clearLocalDatabase(realmPath);
        realmInstance = await Realm.open({
          schema: [TodoSchema],
          path: realmPath,
        });
        logger.info('Local Realm reopened successfully after clearing.');
      } else {
        logger.error('Error opening local Realm:', localErr);
        throw localErr;
      }
    }
  } else {
    if (!realmInstance || syncOnOnline) {
      try {
        const app = new Realm.App({ id: appId });
        const credentials = Realm.Credentials.anonymous();
        const user = await app.logIn(credentials);
        logger.info('User logged in', { user });

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

        // Sync cloud data to local
        await syncCloudToLocal();

        logger.info('Connected to MongoDB Realm and synced cloud data to local Realm.');
      } catch (err) {
        logger.error('Error connecting to MongoDB Realm:', err);

        // Fallback to local Realm if cloud connection fails
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
  }

  return realmInstance;
}

async function syncCloudToLocal() {
  try {
    const realm = await getRealm();
    const cloudTodos = await fetchTodosFromCloud(realm);
    await storeInLocalDatabase(cloudTodos);
    logger.info('Cloud data synced to local database');
  } catch (err) {
    logger.error('Error syncing cloud data to local database:', err);
    throw err;
  }
}

module.exports = getRealm;

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

// clearLocalDatabase();