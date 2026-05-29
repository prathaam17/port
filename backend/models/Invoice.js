const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  storageFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  demurrageFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  penaltyFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.STRING, // Pending, Paid, Void
    defaultValue: 'Pending',
    allowNull: false
  },
  issuedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Invoice;
