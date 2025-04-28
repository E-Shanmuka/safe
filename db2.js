


//MYSQL_ADDON_URI=mysql://ujspra44mq9ii943:vVHds8TU12nXpao4zRMF@bz5gi3wvot5mnckvr1k9-mysql.services.clever-cloud.com:3306/bz5gi3wvot5mnckvr1k9


// db.js
const { Sequelize } = require('sequelize');

// Remote MySQL connection (Clever Cloud)
const sequelize = new Sequelize('bz5gi3wvot5mnckvr1k9', 'ujspra44mq9ii943', 'vVHds8TU12nXpao4zRMF', {
  host: 'bz5gi3wvot5mnckvr1k9-mysql.services.clever-cloud.com',
  dialect: 'mysql',
  port: 3306,
  logging: console.log, // Set to false if you don't want SQL logs
  dialectOptions: {
    connectTimeout: 10000, // Optional: gives more time for initial connection
  }
});

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Clever Cloud MySQL database...');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
})();

module.exports = sequelize;
