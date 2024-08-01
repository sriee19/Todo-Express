const Realm = require('realm');
const BSON = require('bson');

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
  if (!realmInstance) {
    const app = new Realm.App({ id: 'todo-electron-cteedtf' });
    const credentials = Realm.Credentials.anonymous();
    try {
      const user = await app.logIn(credentials);
      realmInstance = await Realm.open({
        schema: [TodoSchema],
        sync: {
          user: user
        }
      });
    } catch (err) {
      console.error('Error logging in to MongoDB Realm:', err);
      throw err;
    }
  }
  return realmInstance;
}

module.exports = getRealm;
