// models/groupchat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const GroupChat = sequelize.define('GroupChat', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = GroupChat;
