const Sequelize = require('sequelize');
const mysql2 = require('mysql2');
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_DBNAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: 'mysql',
    dialectModule: mysql2, // Needed to fix sequelize issues with WebPack
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  }
)

module.exports = sequelize;