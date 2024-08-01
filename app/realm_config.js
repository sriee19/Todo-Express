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
  const app = new Realm.App({ id: process.env.REALM_APP_ID });

  try {
    const credentials = Realm.Credentials.anonymous();
    const user = await app.logIn(credentials);

    realmInstance = await Realm.open({
      schema: [TodoSchema],
      sync: {
        user: user,
        flexible: true
      }
    });

    // Add an initial subscription
    realmInstance.subscriptions.update((mutableSubs) => {
      mutableSubs.add(realmInstance.objects("Todo"));
    });

  } catch (err) {
    console.error('Error logging in to MongoDB Realm:', err);
    throw err;
  }

  return realmInstance;
}

module.exports = getRealm;
