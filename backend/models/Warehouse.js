const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING, // Container Yard, Liquid Storage, Dry Bulk Warehouse, Break Bulk Shed
    allowNull: false
  },
  capacity: {
    type: DataTypes.DOUBLE, // Max capacity (e.g. 5000 tons or 1000 TEU)
    allowNull: false
  },
  occupiedSpace: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  },
  availableSpace: {
    type: DataTypes.DOUBLE,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Warehouse;
