const express = require('express');
const path = require('path');
require('dotenv').config();
const getRealm = require('./app/realm_config');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server connected");
});

const todoRoutes = require("./app/routes/todo.routes");
const indexRoutes = require("./app/routes/index.routes");

app.use(todoRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT, () => console.log("Server started listening on port: 8000"));

module.exports = getRealm;
