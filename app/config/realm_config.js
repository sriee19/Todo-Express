const Realm = require('realm');
const logger = require('../config/logger');
const path = require("path");
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

async function getRealm() {
  const appId = 'todo-electron-cteedtf';

  if (!appId) {
    const err = new Error('Realm App ID is not set in the environment variables');
    logger.error(err);
    throw err;
  }

  if (!realmInstance) {
    try {
      // Attempt to connect to the cloud Realm
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
        path: 'local_realm',
        onError: (err) => {
          logger.error('Realm sync error:', err);
          logger.error('Realm sync error details:', {
            message: err.message,
            stack: err.stack
          });
        }
      });

      await realmInstance.subscriptions.update(mutableSubs => {
        mutableSubs.add(realmInstance.objects('Todo'));
      });

    } catch (err) {
      logger.error('Error connecting to MongoDB Realm:', err);
      
      // Open local Realm if there are network issues
      try {
        realmInstance = await Realm.open({
          schema: [TodoSchema],
          path: 'local_realm'
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

// const realmPath = path.resolve(__dirname, "local_realm");

// async function clearLocalDatabase() {
//   try {
//     // Open the local Realm
//     const realm = await Realm.open({
//       path: "localRealm",
//       schema: [TodoSchema],
//     });

//     // Begin a write transaction
//     realm.write(() => {
//       // Delete all objects from the Realm
//       realm.deleteAll();
//     });

//     console.log("Local database cleared successfully");

//     // Close the Realm
//     realm.close();
//   } catch (err) {
//     console.error("Failed to clear local database:", err);
//   }
// }

module.exports = getRealm;
