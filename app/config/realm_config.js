const Realm = require('realm');
const logger = require('../config/logger');

const TodoSchema = {
  name: 'Todo',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    todo: 'string',
    done: { type: 'bool', default: false }
  }
};

let realmInstance;

async function getRealm() {
  const appId = 'todo-electron-cteedtf';

  if (!appId) {
    const err = new Error('Realm App ID is not set in the environment variables');
    logger.error(err);
    throw err;
  }

  const app = new Realm.App({ id: appId });

  try {
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
      }
    });

    await realmInstance.subscriptions.update(mutableSubs => {
      mutableSubs.add(realmInstance.objects('Todo'));
    });

  } catch (err) {
    logger.error('Error logging in to MongoDB Realm:', err);

    // Open local Realm in case of network issues
    realmInstance = await Realm.open({
      schema: [TodoSchema],
      path: 'local_realm'
    });
  }

  return realmInstance;
}

module.exports = getRealm;
