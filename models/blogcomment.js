// models/blogcomment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const BlogComment = sequelize.define('BlogComment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = BlogComment;
