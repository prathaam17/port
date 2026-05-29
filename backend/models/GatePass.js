const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GatePass = sequelize.define('GatePass', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  passCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING, // Generated, Entered, Exited
    defaultValue: 'Generated',
    allowNull: false
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = GatePass;
