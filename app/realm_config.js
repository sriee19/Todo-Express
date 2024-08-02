const Realm = require('realm');
const logger = require('../logger');

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
logger.info(`Realm App ID: ${process.env.REALM_APP_ID}`);
async function getRealm() {
  const appId = todo-electron-cteedtf;

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
        flexible: true 
      }
    });
  } catch (err) {
    logger.error('Error logging in to MongoDB Realm:', err);
    throw err;
  }

  return realmInstance;
}

module.exports = getRealm;
