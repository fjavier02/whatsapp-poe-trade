const Sequelize = require('sequelize');
require('dotenv').config()

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize(process.env.DB_DBNAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql', // Cambia esto según tu base de datos (puede ser 'mysql', 'postgres', etc.)
});

module.exports = sequelize;