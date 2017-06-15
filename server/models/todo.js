const s = require('sequelize');
const db = require('../db');

const STR = s.STRING;
const BOOL = s.BOOLEAN;
const INT = s.INTEGER;

const Todo = db.define('todo', {
  id: {
    type: INT,
    primaryKey: true,
    autoIncrement: true
  },
  title: STR,
  completed: BOOL
});

module.exports = Todo;