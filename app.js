const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const logger = require('./app/config/logger');
const getRealm = require('./app/config/realm_config');
const dns = require('dns');

let mainWindow;

// Create a new BrowserWindow
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './app/config/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('./app/view/index.html');
}

// Handle the 'ready' event to create the main window
app.on('ready', () => {
  logger.info('Application is ready');
  createWindow();
  
  // Periodically check network status and sync data if online
  setInterval(async () => {
    const isOnline = await checkNetworkStatus();
    if (isOnline) {
      logger.info('Network is online. Syncing cloud data to local...');
      try {
        await getRealm(true);  // Force sync when online
      } catch (err) {
        logger.error('Error syncing data:', err);
      }
    }
  }, 5000);  // Check every 5 seconds
});

// Check network status
async function checkNetworkStatus() {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      resolve(!err);
    });
  });
}

// IPC handlers
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
    const response = await fetchTodos({}, {
      status: () => ({
        json: (data) => event.reply('todos', data),
        send: (message) => event.reply('todos', message),
      }),
    });
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    event.reply('todos', 'Error fetching TODOs');
  }
});
