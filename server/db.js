const Sequelize =  require('sequelize');
const sequelize = new Sequelize({
 // host: 'localhost',
  dialect: 'sqlite',

  // pool: {
  //   max: 5,
  //   min: 0,
  //   idle: 10000
  // },

  // SQLite only
  storage: './database.sqlite'
});

module.exports = sequelize;