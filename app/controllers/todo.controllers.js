const { ObjectId } = require('bson');
const getRealm = require('../realm_config');
const logger = require('../../logger');
const BSON = require('bson');
exports.addTodo = async (req, res) => {
  const { todo } = req.body; 
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new BSON.ObjectId(),
        todo: todoText,
        done: false
      });
    });

    logger.info('Successfully added todo', { todo });
    res.status(200).json({ message: 'Successfully added todo!' });
  } catch (err) {
    logger.error('Error adding todo:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.fetchTodos = async (req, res) => {
  try {
    const realm = await getRealm();
    const todos = realm.objects('Todo');
    logger.info('Fetched TODOs', { count: todos.length });
    res.status(200).json(todos);
  } catch (err) {
    logger.error('Error fetching TODOs:', err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = getRealm;