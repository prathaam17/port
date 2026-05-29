const { GatePass, Cargo, Truck, Invoice, Warehouse, YardLocation, Inventory, Notification } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all gate passes / logs
exports.getGatePasses = async (req, res) => {
  try {
    const passes = await GatePass.findAll({
      include: [
        { model: Cargo },
        { model: Truck }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(passes);
  } catch (error) {
    console.error('Get gate passes error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create a new QR Gate Pass for cargo release
exports.generateGatePass = async (req, res) => {
  const { cargoId, truckNumber, driverName, driverLicence, carrierCompany } = req.body;

  try {
    // 1. Verify cargo exists
    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: `Cargo ${cargoId} not found.` });
    }

    // 2. Verify Customs Approval
    if (cargo.status !== 'Customs Approved') {
      return res.status(400).json({ 
        message: `Cargo cannot be released. Current status is ${cargo.status}. Must be Customs Approved.` 
      });
    }

    // 3. Verify invoice is Paid
    const invoice = await Invoice.findOne({ where: { cargoId: cargo.id } });
    if (!invoice || invoice.status !== 'Paid') {
      return res.status(400).json({ 
        message: `Cargo release blocked. Outstanding invoice ${invoice ? invoice.invoiceNumber : 'N/A'} must be PAID before gate pass generation.` 
      });
    }

    // 4. Register Truck (or find if exists)
    let truck = await Truck.findOne({ where: { truckNumber } });
    if (!truck) {
      truck = await Truck.create({
        truckNumber,
        driverName,
        driverLicence,
        carrierCompany
      });
    } else {
      // Update driver info in case it changed
      truck.driverName = driverName;
      truck.driverLicence = driverLicence;
      truck.carrierCompany = carrierCompany;
      await truck.save();
    }

    // 5. Create Gate Pass
    const passCode = `GP-NMPA-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    
    // Check if there is an active gate pass already
    const activePass = await GatePass.findOne({
      where: { cargoId: cargo.id, status: ['Generated', 'Entered'] }
    });

    if (activePass) {
      return res.status(400).json({ 
        message: 'An active gate pass is already generated for this cargo.',
        gatePass: activePass 
      });
    }

    const gatePass = await GatePass.create({
      passCode,
      truckId: truck.id,
      cargoId: cargo.id,
      status: 'Generated',
      approvedByUserId: req.user.id
    });

    // Update cargo status to "Gate Pass Generated"
    cargo.status = 'Gate Pass Generated';
    await cargo.save();

    await logActivity(
      req,
      'GATE_PASS_GENERATED',
      `Gate pass ${passCode} generated for truck ${truckNumber}. Driver: ${driverName}.`,
      'Gate Officer',
      `Gate pass ${passCode} generated. Truck ${truckNumber} is authorized for entry.`
    );

    return res.status(201).json({
      message: 'Gate pass generated successfully.',
      gatePass,
      truck
    });
  } catch (error) {
    console.error('Generate gate pass error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Check-In: Truck enters port gate
exports.processGateEntry = async (req, res) => {
  const { passCode } = req.body;

  try {
    const gatePass = await GatePass.findOne({
      where: { passCode },
      include: [{ model: Cargo }, { model: Truck }]
    });

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found or invalid QR code.' });
    }

    if (gatePass.status !== 'Generated') {
      return res.status(400).json({ message: `Invalid pass state. Gate pass is currently: ${gatePass.status}` });
    }

    gatePass.status = 'Entered';
    gatePass.entryTime = new Date();
    await gatePass.save();

    await logActivity(
      req,
      'TRUCK_GATE_ENTRY',
      `Truck ${gatePass.Truck.truckNumber} entered port. Gate Pass Verified.`
    );

    return res.json({
      message: 'Gate entry authorized. Truck entered.',
      gatePass
    });
  } catch (error) {
    console.error('Process gate entry error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Check-Out & Dispatch: Cargo leaves port (Inventory Decreased)
exports.processGateExit = async (req, res) => {
  const { passCode } = req.body;

  try {
    const gatePass = await GatePass.findOne({
      where: { passCode },
      include: [
        { model: Cargo }, 
        { model: Truck }
      ]
    });

    if (!gatePass) {
      return res.status(404).json({ message: 'Gate pass not found.' });
    }

    if (gatePass.status !== 'Entered') {
      return res.status(400).json({ message: `Truck must be checked in first. Current status: ${gatePass.status}` });
    }

    const cargo = gatePass.Cargo;
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo associated with gate pass not found.' });
    }

    // 1. Log Gate Exit
    gatePass.status = 'Exited';
    gatePass.exitTime = new Date();
    await gatePass.save();

    // 2. Mark Cargo as Dispatched
    cargo.status = 'Dispatched';
    cargo.exitTime = new Date();
    await cargo.save();

    // 3. Free up storage space in Warehouse
    if (cargo.warehouseId) {
      const warehouse = await Warehouse.findByPk(cargo.warehouseId);
      if (warehouse) {
        warehouse.occupiedSpace = Math.max(0, warehouse.occupiedSpace - cargo.weight);
        warehouse.availableSpace = Math.min(warehouse.capacity, warehouse.availableSpace + cargo.weight);
        await warehouse.save();
      }

      // 4. Free up space in Yard Location mapping if any
      const inventory = await Inventory.findOne({ where: { cargoId: cargo.id } });
      if (inventory && inventory.yardLocationId) {
        const yardLoc = await YardLocation.findByPk(inventory.yardLocationId);
        if (yardLoc) {
          yardLoc.occupiedSpace = Math.max(0, yardLoc.occupiedSpace - cargo.weight);
          await yardLoc.save();
        }
      }
    }

    // 5. Remove cargo from active Inventory records (since it has left the port)
    await Inventory.destroy({ where: { cargoId: cargo.id } });

    await logActivity(
      req,
      'CARGO_DISPATCHED',
      `Cargo ${cargo.cargoId} dispatched on truck ${gatePass.Truck.truckNumber}. Port inventory decremented.`,
      'Super Admin',
      `Cargo ${cargo.cargoId} has left the port facility. Inventory updated.`
    );

    return res.json({
      message: 'Gate exit processed successfully. Cargo dispatched, inventory updated.',
      gatePass
    });
  } catch (error) {
    console.error('Process gate exit error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
