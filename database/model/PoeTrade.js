const { DataTypes } = require('sequelize');
const sequelize = require('../connection'); // Asegúrate de tener la ruta correcta a tu archivo connection.js

const PoeTrade = sequelize.define('poeTrade', {
  cliente_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  number_client: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price_max: {
    type: DataTypes.INTEGER,
  },
  currency: {
    type: DataTypes.TEXT,
  },
});

// Sincroniza el modelo con la base de datos (esto creará la tabla si no existe)
PoeTrade.sync();

module.exports = PoeTrade;
