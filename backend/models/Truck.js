const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Truck = sequelize.define('Truck', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  truckNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  driverName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  driverLicence: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carrierCompany: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Truck;
