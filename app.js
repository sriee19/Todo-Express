const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const BSON = require('bson');
require('dotenv').config();
const getRealm = require('./app/realm_config');
// const { BSON } = require('realm');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

ipcMain.on('add-todo', async (event, todoText) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new BSON.ObjectId(),
        todo: todoText,
        done: false
      });
    });
    event.reply('add-todo-response', 'Successfully added TODO');
  } catch (err) {
    console.error('Error adding TODO:', err);
    event.reply('add-todo-response', 'Error adding TODO');
  }
});

ipcMain.on('fetch-todos', async (event) => {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    event.reply('todos', todos);
  } catch (err) {
    console.error('Error fetching TODOs:', err);
    event.reply('todos', []);
  }
});

module.exports = getRealm;