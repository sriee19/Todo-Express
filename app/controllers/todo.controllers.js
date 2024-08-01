const { ObjectId } = require('bson');
const getRealm = require('../realm_config');

exports.addTodo = async (req, res) => {
  const { todo } = req.body;
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create('Todo', {
        _id: new ObjectId(),
        todo,
        done: false,
        partition: realm.syncSession.config.partitionValue
      });
    });
    res.status(200).json({ message: 'Successfully added todo!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteTodo = async (req, res) => {
  const { _id } = req.params;
  try {
    const realm = await getRealm();
    realm.write(() => {
      const todo = realm.objectForPrimaryKey('Todo', new ObjectId(_id));
      realm.delete(todo);
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
