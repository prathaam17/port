const sequelize = require('../config/db');

// Import models
const Role = require('./Role');
const User = require('./User');
const Cargo = require('./Cargo');
const Warehouse = require('./Warehouse');
const YardLocation = require('./YardLocation');
const Inventory = require('./Inventory');
const CustomsClearance = require('./CustomsClearance');
const Truck = require('./Truck');
const GatePass = require('./GatePass');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// Define associations

// 1. User & Role
Role.hasMany(User, { foreignKey: 'roleId', onDelete: 'RESTRICT' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// 2. Cargo & Warehouse
Warehouse.hasMany(Cargo, { foreignKey: 'warehouseId', onDelete: 'SET NULL' });
Cargo.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

// 3. YardLocation & Warehouse
Warehouse.hasMany(YardLocation, { foreignKey: 'warehouseId', onDelete: 'CASCADE' });
YardLocation.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

// 4. Inventory
Cargo.hasMany(Inventory, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
Inventory.belongsTo(Cargo, { foreignKey: 'cargoId' });

Warehouse.hasMany(Inventory, { foreignKey: 'warehouseId', onDelete: 'CASCADE' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouseId' });

YardLocation.hasMany(Inventory, { foreignKey: 'yardLocationId', onDelete: 'SET NULL' });
Inventory.belongsTo(YardLocation, { foreignKey: 'yardLocationId' });

// 5. CustomsClearance
Cargo.hasOne(CustomsClearance, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
CustomsClearance.belongsTo(Cargo, { foreignKey: 'cargoId' });

User.hasMany(CustomsClearance, { foreignKey: 'officerId', as: 'inspectedCustoms', onDelete: 'SET NULL' });
CustomsClearance.belongsTo(User, { foreignKey: 'officerId', as: 'officer' });

// 6. GatePass
Cargo.hasMany(GatePass, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
GatePass.belongsTo(Cargo, { foreignKey: 'cargoId' });

Truck.hasMany(GatePass, { foreignKey: 'truckId', onDelete: 'CASCADE' });
GatePass.belongsTo(Truck, { foreignKey: 'truckId' });

User.hasMany(GatePass, { foreignKey: 'approvedByUserId', onDelete: 'SET NULL' });
GatePass.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approver' });

// 7. Invoice & Payment
Cargo.hasMany(Invoice, { foreignKey: 'cargoId', onDelete: 'CASCADE' });
Invoice.belongsTo(Cargo, { foreignKey: 'cargoId' });

Invoice.hasMany(Payment, { foreignKey: 'invoiceId', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// AuditLog holds optional link to User (for reporting only, don't cascade delete)
User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Role,
  User,
  Cargo,
  Warehouse,
  YardLocation,
  Inventory,
  CustomsClearance,
  Truck,
  GatePass,
  Invoice,
  Payment,
  Notification,
  AuditLog
};
