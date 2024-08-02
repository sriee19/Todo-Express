const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  addTodo: (todoText) => ipcRenderer.send('add-todo', todoText),
  fetchTodos: () => ipcRenderer.send('fetch-todos'),
  onTodos: (callback) => ipcRenderer.on('todos', (event, todos) => callback(todos)),
  onAddTodoResponse: (callback) => ipcRenderer.on('add-todo-response', (event, message) => callback(message)),
});
