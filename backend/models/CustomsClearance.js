const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CustomsClearance = sequelize.define('CustomsClearance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // Pending, Approved, Rejected, On Hold
    defaultValue: 'Pending',
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  inspectionScheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'CustomsClearances'
});

module.exports = CustomsClearance;
