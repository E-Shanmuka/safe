// models/group.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Group = sequelize.define('Group', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  code: {
    type: DataTypes.STRING,  // use DataTypes, not Sequelize
    allowNull: true          // null means public group
  },
  groupName: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  createdBy: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }
}, {
  tableName: 'groups',
  timestamps: true
});

module.exports = Group;
