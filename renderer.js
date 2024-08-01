const { ipcRenderer } = require('electron');
const { BSON } = require('realm-web');

// Define the Realm app ID
const app = new Realm.App({ id: 'todo-electron-cteedtf' });

async function getRealm() {
  const credentials = Realm.Credentials.anonymous();
  const user = await app.logIn(credentials);
  const realmConfig = {
    schema: [TodoSchema],
    sync: {
      user: user,
      partitionValue: 'myPartition' 
    }
  };
  return await Realm.open(realmConfig);
}

const TodoSchema = {
  name: 'Todo',
  properties: {
    _id: 'objectId',
    todo: 'string',
    done: { type: 'bool', default: false }
  },
  primaryKey: '_id'
};

// Example function to add a new TODO item from the renderer process
async function addTodoFromRenderer(todoText) {
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new BSON.ObjectId(),
        todo: todoText,
        done: false
      });
    });
    console.log('Successfully added TODO from renderer');
  } catch (err) {
    console.error('Error adding TODO from renderer:', err);
  }
}

// Example function to fetch all TODO items from the renderer process
async function fetchTodosFromRenderer() {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    console.log('Fetched TODOs:', todos);
  } catch (err) {
    console.error('Error fetching TODOs from renderer:', err);
  }
}

// Example usage
document.getElementById('addTodoButton').addEventListener('click', () => {
  const todoText = document.getElementById('todoInput').value;
  addTodoFromRenderer(todoText);
});

document.getElementById('fetchTodosButton').addEventListener('click', fetchTodosFromRenderer);
