const express = require('express');
const router = express.Router();

const Todo = require('../models/todo');

/* GET users listing. */
router.get('/all', function (req, res, next) {
 // res.send([{id:1, title: 'hello', completed: false}]);
 Todo.findAll().then(data => {
   res.send(data)
 });
});

/* GET users listing. */
router.get('/get/:id', function (req, res, next) {
});

router.post('/create', function (req, res, next) {
  Todo.create(req.body).then(r => res.send(r));
});

router.put('/update/:id', function (req, res, next) {
  const toUpdate = Object.assign(req.body);
  delete toUpdate.id;
  Todo.update(toUpdate, { where: { id: req.params.id } }).then((data) => {
    res.send(req.body);
  })
});

router.delete('/delete/:id', function (req, res, next) {
  Todo.destroy({
    where: {
      id: req.params.id
    }
  }).then((data) => {
    res.send({id: req.params.id});
  });
});

module.exports = router;
