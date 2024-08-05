const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const logger = require('./app/config/logger');
const getRealm = require('./app/config/realm_config');

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

  setInterval(checkNetworkStatus, 5000); 
});

const { addTodo, fetchTodos } = require('./app/controllers/todo.controllers');

ipcMain.on('add-todo', async (event, todoText) => {
  try {
    await addTodo({ body: { todo: todoText } }, {
      status: () => ({
        json: (response) => event.reply('add-todo-response', response.message),
        send: (message) => event.reply('add-todo-response', message),
      }),
    });
  } catch (err) {
    logger.error('Error adding TODO:', err);
    event.reply('add-todo-response', 'Error adding TODO');
  }
});

ipcMain.on('fetch-todos', async (event) => {
  try {
    await fetchTodos({}, {
      status: () => ({
        json: (todos) => event.reply('todos', todos),
        send: (message) => event.reply('todos', message),
      }),
    });
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    event.reply('todos', []);
  }
});

function checkNetworkStatus() {
  require('dns').resolve('www.google.com', (err) => {
    const isOnline = !err;
    mainWindow.webContents.send('network-status', isOnline);
    if (isOnline) {
      logger.info('Network status: online');
      syncLocalData();
    } else {
      logger.info('Network status: offline');
    }
  });
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
