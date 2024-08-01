// renderer.js
const { ipcRenderer } = require('electron');

function addTodoFromRenderer(todoText) {
  ipcRenderer.send('add-todo', todoText);
}

function fetchTodosFromRenderer() {
  ipcRenderer.send('fetch-todos');
}

ipcRenderer.on('todos', (event, todos) => {
  console.log('Fetched TODOs:', todos);
});

document.getElementById('addTodoButton').addEventListener('click', () => {
  const todoText = document.getElementById('todoInput').value;
  addTodoFromRenderer(todoText);
});

document.getElementById('fetchTodosButton').addEventListener('click', fetchTodosFromRenderer);
