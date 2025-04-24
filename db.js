// db.js
const { Sequelize } = require('sequelize');

// Remote MySQL connection (InfinityFree)
const sequelize = new Sequelize('if0_38196313_blogwe', 'if0_38196313', '9951117884', {
  host: 'sql203.infinityfree.com',
  dialect: 'mysql',
  port: 3306,
  logging: true, // Set to false if you want cleaner logs
  dialectOptions: {
    connectTimeout: 10000, // Optional: gives it more time to connect
  }
});

// Test the database connection
sequelize.authenticate()
  .then(() => console.log("✅ Connected to InfinityFree MySQL database..."))
  .catch(err => console.error("❌ MySQL connection error:", err));

module.exports = sequelize;
