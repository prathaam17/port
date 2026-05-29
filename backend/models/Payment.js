const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amountPaid: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING, // Bank Transfer, Credit Card, UPI, Escrow
    allowNull: false
  },
  transactionRef: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Payment;
