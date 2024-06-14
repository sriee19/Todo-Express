const express =require ("express")
const mongoose = require('mongoose')
const path = require('path');
require('dotenv').config();
const fs = require('fs');

const app = express()


let config;
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  config = {};
}

// const mongoURI = process.env.MONGO_URI;
mongoose.connect("mongodb+srv://srisanjana:Sriee@1920@cluster0.lyyphz8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
, { dbName: "TodoApp", useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Error connecting to MongoDB:", err.message));


app.use(express.urlencoded({ extended: true}));
// app.use(express.static("public"));
app.use(express.json());


// const htmlContent = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Todo App</title>
//     <link rel="stylesheet" href="/styles.css">
// </head>
// <body>
//     <div class="container">
//         <h1>Welcome to the Todo App</h1>
//         <form action="/add/todo" method="POST">
//             <input type="text" name="todo" placeholder="Enter your task" required>
//             <button type="submit">Add Task</button>
//         </form>
//     </div>
// </body>
// </html>
// `;

app.get("/", (req, res) => {
  res.send(
    // htmlContent
    "server connected"
);
});

// app.set("view engine","ejs");
// app.set("views", path.join(__dirname, 'views'));
const todoRoutes = require("./app/routes/todo.routes");
const indexRoutes = require("./app/routes/index.routes");

app.use(todoRoutes)
app.use(indexRoutes)

// app.listen(process.env.PORT, ()=>console.log(`Server started listening on port: ${process.env.PORT}`) )
app.listen(5000, ()=>console.log("Server started listening on port: 5000") )


