const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const logger = require('./app/config/logger');
const getRealm = require('./app/config/realm_config');
const dns = require('dns');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './app/config/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('./app/view/index.html');
}

app.on('ready', () => {
  logger.info('Application is ready');
  createWindow();
});

const { addTodo, fetchCloudTodos, fetchTodosFromLocal } = require('./app/controllers/todo.controllers');

ipcMain.on('add-todo', async (event, todoText) => {
  try {
    await addTodo({ body: { todo: todoText } }, {
      status: () => ({
        json: (response) => event.reply('add-todo-response', response.message),
        send: (message) => event.reply('add-todo-response', message),
      }),
    });
    checkNetworkStatus((isOnline) => {
      if (isOnline) {
        syncLocalData();
      }
    });
  } catch (err) {
    logger.error('Error adding TODO:', err);
    event.reply('add-todo-response', 'Error adding TODO');
  }
});

ipcMain.on('fetch-todos', async (event) => {
  checkNetworkStatus(async (isOnline) => {
    if (isOnline) {
      logger.info('Network status: online');
      await fetchCloudTodos({}, {
        status: () => ({
          json: async (todos) => {
            await storeInLocalDatabase(todos);
            const allTodos = await fetchTodosFromLocal();
            event.reply('todos', allTodos);
          },
          send: (message) => event.reply('todos', message),
        }),
      });
    } else {
      logger.info('Network status: offline');
      try {
        const allTodos = await fetchTodosFromLocal();
        event.reply('todos', allTodos);
      } catch (err) {
        logger.error('Error fetching TODOs:', err);
        event.reply('todos', 'Error fetching TODOs');
      }
    }
  });
});


function checkNetworkStatus(callback) {
  dns.resolve('www.google.com', (err) => {
    const isOnline = !err;
    mainWindow.webContents.send('network-status', isOnline);
    callback(isOnline);
  });
}

async function storeInLocalDatabase(todos) {
  try {
    const realm = await getRealm();
    realm.write(() => {
      todos.forEach(todo => {
        realm.create('Todo', {
          _id: new BSON.ObjectId(todo._id),
          todo: todo.todo,
          done: todo.done
        }, 'modified');
      });
    });
  } catch (err) {
    logger.error('Error storing data in local database:', err);
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
