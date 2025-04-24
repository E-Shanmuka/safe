// db.js
const { Sequelize } = require('sequelize');

// Remote MySQL connection (Clever Cloud)
const sequelize = new Sequelize('byxbpgvhrl5xibxn0wli', 'u1mnzcc7unkxm650', 'UMAsdig94CzpjcRsj1ur', {
  host: 'byxbpgvhrl5xibxn0wli-mysql.services.clever-cloud.com',
  dialect: 'mysql',
  port: 3306,
  logging: true, // Set to false if you want cleaner logs
  dialectOptions: {
    connectTimeout: 10000 // Optional: gives more time for initial connection
  }
});

// Test the database connection
sequelize.authenticate()
  .then(() => console.log("✅ Connected to Clever Cloud MySQL database..."))
  .catch(err => console.error("❌ MySQL connection error:", err));

module.exports = sequelize;

