const bcrypt = require('bcryptjs');
const {
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
} = require('./models');

const seed = async () => {
  try {
    console.log('Starting Fresh Database Seeding...');
    
    // Force sync the database (drops existing tables and recreates them)
    await sequelize.sync({ force: true });
    console.log('Database tables cleared and recreated.');

    // 1. Create Roles
    const rolesData = [
      { name: 'Super Admin', description: 'System administrator with full access to manage users, roles, audit logs, and analytics.' },
      { name: 'Port Operations Officer', description: 'Monitors ship berths and manages the unloading of cargo from vessels.' },
      { name: 'Warehouse Manager', description: 'Allocates warehouse space, monitors yard occupancy, and tracks storage details.' },
      { name: 'Customs Officer', description: 'Reviews cargo documents, performs inspections, and approves customs clearance.' },
      { name: 'Gate Officer', description: 'Manages truck arrivals, issues QR gate passes, and verifies dispatch approvals.' },
      { name: 'Finance', description: 'Generates storage and demurrage invoices, tracks payments, and manages billing.' },
      { name: 'Shipping Agent', description: 'Uploads cargo manifests, views shipment status, and requests cargo release.' }
    ];
    
    const roles = await Role.bulkCreate(rolesData);
    console.log('Roles seeded.');

    // Map roles for easy access
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.name] = r.id;
    });

    // 2. Create Users (Password: password123)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const usersData = [
      { username: 'admin', password: passwordHash, email: 'admin@nmpa.gov.in', roleId: roleMap['Super Admin'] },
      { username: 'ops', password: passwordHash, email: 'operations@nmpa.gov.in', roleId: roleMap['Port Operations Officer'] },
      { username: 'warehouse', password: passwordHash, email: 'warehouse@nmpa.gov.in', roleId: roleMap['Warehouse Manager'] },
      { username: 'customs', password: passwordHash, email: 'customs@nmpa.gov.in', roleId: roleMap['Customs Officer'] },
      { username: 'gate', password: passwordHash, email: 'gate@nmpa.gov.in', roleId: roleMap['Gate Officer'] },
      { username: 'finance', password: passwordHash, email: 'finance@nmpa.gov.in', roleId: roleMap['Finance'] },
      { username: 'shipping', password: passwordHash, email: 'shipping@nmpa.gov.in', roleId: roleMap['Shipping Agent'] }
    ];

    const users = await User.bulkCreate(usersData);
    console.log('Users seeded (Password for all: password123).');

    // 3. Create Warehouses (Reset occupied space to 0)
    const warehousesData = [
      { name: 'Transit Shed No. 2 (Berth 2)', type: 'Transit Shed', capacity: 11400.0, occupiedSpace: 0.0, availableSpace: 11400.0 },
      { name: 'Transit Shed No. 4 (Berth 4)', type: 'Transit Shed', capacity: 7980.0, occupiedSpace: 0.0, availableSpace: 7980.0 },
      { name: 'Overflow Shed (East Wharf)', type: 'Overflow Shed', capacity: 10000.0, occupiedSpace: 0.0, availableSpace: 10000.0 },
      { name: 'Godown No. 29', type: 'Covered Warehouse', capacity: 6885.0, occupiedSpace: 0.0, availableSpace: 6885.0 },
      { name: 'Godown No. 31', type: 'Covered Warehouse', capacity: 9625.0, occupiedSpace: 0.0, availableSpace: 9625.0 },
      { name: 'Godown No. 33 (POL Terminal)', type: 'Liquid Storage', capacity: 14062.5, occupiedSpace: 0.0, availableSpace: 14062.5 }
    ];

    const warehouses = await Warehouse.bulkCreate(warehousesData);
    console.log('Warehouses seeded with 0% utilization.');

    // 4. Create YardLocations (Reset occupied space to 0)
    const yardLocationsData = [
      { warehouseId: warehouses[0].id, zoneCode: 'Container Row-A', capacity: 5000, occupiedSpace: 0 },
      { warehouseId: warehouses[0].id, zoneCode: 'Container Row-B', capacity: 5000, occupiedSpace: 0 },
      { warehouseId: warehouses[0].id, zoneCode: 'Reefer Zone R-1', capacity: 1400, occupiedSpace: 0 },
      
      { warehouseId: warehouses[1].id, zoneCode: 'Timber Yard T-1', capacity: 4000, occupiedSpace: 0 },
      { warehouseId: warehouses[1].id, zoneCode: 'Steel Bay S-1', capacity: 3980, occupiedSpace: 0 },
      
      { warehouseId: warehouses[2].id, zoneCode: 'Coal Bay C-1', capacity: 10000, occupiedSpace: 0 },
      
      { warehouseId: warehouses[3].id, zoneCode: 'Cashew Rack 29-A', capacity: 3400, occupiedSpace: 0 },
      { warehouseId: warehouses[3].id, zoneCode: 'Cashew Rack 29-B', capacity: 3485, occupiedSpace: 0 },
      
      { warehouseId: warehouses[5].id, zoneCode: 'POL Oil Tank L-1', capacity: 10000, occupiedSpace: 0 },
      { warehouseId: warehouses[5].id, zoneCode: 'Chemical Tank L-2', capacity: 4062.5, occupiedSpace: 0 }
    ];

    await YardLocation.bulkCreate(yardLocationsData);
    console.log('Yard Locations seeded with 0 occupancy.');

    console.log('Database Reset Completed Successfully!');
  } catch (error) {
    console.error('Error during Database Seeding:', error);
    process.exit(1);
  }
};

// If run directly from terminal
if (require.main === module) {
  seed().then(() => sequelize.close());
}

module.exports = seed;
