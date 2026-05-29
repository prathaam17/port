const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cargo = sequelize.define('Cargo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cargoId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vesselName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cargoType: {
    type: DataTypes.STRING, // Container, Bulk, Liquid, Break Bulk
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  weight: {
    type: DataTypes.DOUBLE, // Weight in metric tons
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // Manifest Uploaded, Unloaded, Allocated, Customs Hold, Customs Approved, Gate Pass Generated, Dispatched
    allowNull: false,
    defaultValue: 'Manifest Uploaded'
  },
  consignee: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isDamaged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  damageRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unloadingEquipment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  binCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  containerNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tradeType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Import'
  },
  billOfLading: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shippingBill: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryOrderNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  digitalSignature: {
    type: DataTypes.STRING,
    allowNull: true
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

module.exports = Cargo;
