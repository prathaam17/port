const { Cargo, CustomsClearance, Warehouse, YardLocation, Inventory, Notification } = require('../models');
const { logActivity } = require('../utils/logger');
const { Op } = require('sequelize');

// Get all cargo with filtering, searching, and pagination
exports.getCargoes = async (req, res) => {
  const { search, type, status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { cargoId: { [Op.like]: `%${search}%` } },
      { consignee: { [Op.like]: `%${search}%` } }
    ];
  }

  if (type) {
    whereClause.cargoType = type;
  }

  if (status) {
    whereClause.status = status;
  }

  try {
    const { count, rows } = await Cargo.findAndCountAll({
      where: whereClause,
      include: [{ model: Warehouse }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      cargoes: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get single cargo details
exports.getCargoById = async (req, res) => {
  const { id } = req.params;

  try {
    const cargo = await Cargo.findByPk(id, {
      include: [
        { model: Warehouse },
        { model: CustomsClearance }
      ]
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    return res.json(cargo);
  } catch (error) {
    console.error('Get cargo details error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Upload Cargo Manifest (Creates new cargo records)
exports.uploadManifest = async (req, res) => {
  const { 
    cargoId, vesselName, cargoType, quantity, weight, consignee, 
    containerNo, destination, tradeType, billOfLading, shippingBill, digitalSignature 
  } = req.body;
  const file = req.file;

  try {
    if (!cargoId || !cargoType || !quantity || !weight || !consignee) {
      return res.status(400).json({ message: 'All cargo details are required.' });
    }

    // Check if cargoId already exists
    const existing = await Cargo.findOne({ where: { cargoId } });
    if (existing) {
      return res.status(400).json({ message: `Cargo ID ${cargoId} already exists in manifest database.` });
    }

    // Create Cargo
    const cargo = await Cargo.create({
      cargoId,
      vesselName,
      cargoType,
      quantity: parseInt(quantity),
      weight: parseFloat(weight),
      consignee,
      status: 'Manifest Uploaded',
      containerNo,
      destination,
      tradeType: tradeType || 'Import',
      billOfLading,
      shippingBill,
      digitalSignature,
      entryTime: new Date()
    });

    // Create pending customs clearance
    await CustomsClearance.create({
      cargoId: cargo.id,
      documentUrl: file ? file.filename : 'manifest_attached.pdf',
      status: 'Pending',
      remarks: 'Cargo manifest uploaded. Awaiting document verification.'
    });

    // Trigger Notification for Port Operations & Customs
    await logActivity(
      req,
      'MANIFEST_UPLOAD',
      `Manifest uploaded for Cargo: ${cargoId}. Container: ${containerNo || 'N/A'}. Trade: ${tradeType || 'Import'}.`,
      'Port Operations Officer',
      `New cargo ${cargoId} is registered. Ready for unloading.`
    );

    return res.status(201).json({
      message: 'Manifest uploaded successfully.',
      cargo
    });
  } catch (error) {
    console.error('Manifest upload error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Unload Cargo from Ship
exports.unloadCargo = async (req, res) => {
  const { id } = req.params;
  const { unloadingEquipment } = req.body;

  try {
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    if (cargo.status !== 'Manifest Uploaded') {
      return res.status(400).json({ message: `Cannot unload cargo with status ${cargo.status}.` });
    }

    // Update Status
    cargo.status = 'Unloaded';
    if (unloadingEquipment) {
      cargo.unloadingEquipment = unloadingEquipment;
    }
    await cargo.save();

    await logActivity(
      req,
      'CARGO_UNLOAD',
      `Cargo ${cargo.cargoId} unloaded using ${unloadingEquipment || 'default equipment'}.`,
      'Warehouse Manager',
      `Cargo ${cargo.cargoId} is unloaded using ${unloadingEquipment || 'default equipment'}. Space allocation required.`
    );

    return res.json({ message: 'Cargo unloaded successfully.', cargo });
  } catch (error) {
    console.error('Unload cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Assign Warehouse / Yard Location
exports.assignWarehouse = async (req, res) => {
  const { id } = req.params;
  const { warehouseId, yardLocationId, binCode } = req.body;

  try {
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    if (cargo.status !== 'Unloaded') {
      return res.status(400).json({ message: `Cannot allocate storage for cargo with status ${cargo.status}.` });
    }

    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found.' });
    }

    if (warehouse.availableSpace < cargo.weight) {
      return res.status(400).json({ message: 'Insufficient capacity in selected warehouse.' });
    }

    let yardLoc = null;
    if (yardLocationId) {
      yardLoc = await YardLocation.findByPk(yardLocationId);
      if (!yardLoc) {
        return res.status(404).json({ message: 'Yard location not found.' });
      }
      if (yardLoc.capacity - yardLoc.occupiedSpace < cargo.weight) {
        return res.status(400).json({ message: 'Insufficient capacity in selected Yard zone.' });
      }
    }

    // Update cargo allocation
    cargo.warehouseId = warehouseId;
    if (binCode) {
      cargo.binCode = binCode;
    }
    cargo.status = 'Allocated';
    await cargo.save();

    // Deduct warehouse space
    warehouse.occupiedSpace += cargo.weight;
    warehouse.availableSpace -= cargo.weight;
    await warehouse.save();

    // Deduct yard location space
    if (yardLoc) {
      yardLoc.occupiedSpace += cargo.weight;
      await yardLoc.save();
    }

    // Create Inventory Entry
    await Inventory.create({
      cargoId: cargo.id,
      warehouseId: warehouseId,
      yardLocationId: yardLocationId || null,
      quantity: cargo.quantity,
      weight: cargo.weight,
      lastMovedAt: new Date()
    });

    await logActivity(
      req,
      'STORAGE_ALLOCATION',
      `Allocated Cargo ${cargo.cargoId} to ${warehouse.name} ${yardLoc ? `zone ${yardLoc.zoneCode}` : ''} ${binCode ? `position ${binCode}` : ''}`,
      'Customs Officer',
      `Cargo ${cargo.cargoId} is allocated to storage. Ready for Customs verification.`
    );

    return res.json({ message: 'Warehouse allocated and inventory recorded.', cargo });
  } catch (error) {
    console.error('Assign warehouse error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Bulk Cargo Manifest Upload (creates multiple cargo + customs clearance records)
exports.uploadBulkManifest = async (req, res) => {
  const { vesselName, tradeType, consignee, containers } = req.body;

  try {
    if (!vesselName || !consignee || !containers || !Array.isArray(containers) || containers.length === 0) {
      return res.status(400).json({ message: 'Vessel name, consignee, and container list are required.' });
    }

    const createdCargoes = [];

    for (const item of containers) {
      const { containerNo, cargoType, weight, destination, billOfLading, shippingBill, digitalSignature } = item;

      if (!containerNo || !cargoType || !weight) {
        continue; // skip incomplete rows
      }

      // Generate a unique Cargo ID for each
      const uniqueId = `CRG-NMPA-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

      const cargo = await Cargo.create({
        cargoId: uniqueId,
        vesselName,
        cargoType,
        quantity: 1,
        weight: parseFloat(weight),
        consignee,
        status: 'Manifest Uploaded',
        containerNo,
        destination,
        tradeType: tradeType || 'Import',
        billOfLading: billOfLading || `BL-${Date.now().toString().slice(-4)}`,
        shippingBill,
        digitalSignature,
        entryTime: new Date()
      });

      await CustomsClearance.create({
        cargoId: cargo.id,
        documentUrl: 'bulk_manifest_attached.pdf',
        status: 'Pending',
        remarks: 'Bulk cargo manifest entry. Awaiting verification.'
      });

      createdCargoes.push(cargo);
    }

    await logActivity(
      req,
      'BULK_MANIFEST_UPLOAD',
      `Uploaded bulk manifest for Vessel: ${vesselName} containing ${createdCargoes.length} containers.`,
      'Port Operations Officer',
      `Bulk manifest processed for vessel ${vesselName}.`
    );

    return res.status(201).json({
      message: `Bulk manifest uploaded successfully. Created ${createdCargoes.length} cargo logs.`,
      cargoes: createdCargoes
    });
  } catch (error) {
    console.error('Bulk manifest upload error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Generate Delivery Order (DO) after customs clearance & billing invoice is paid
exports.generateDeliveryOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const cargo = await Cargo.findByPk(id, {
      include: [{ model: CustomsClearance }]
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Cargo consignment not found.' });
    }

    // Verify customs cleared
    if (cargo.status !== 'Customs Approved') {
      return res.status(400).json({ message: `Cannot generate Delivery Order. Cargo status is ${cargo.status}. Customs release is required.` });
    }

    // Verify billing payment completed
    const invoice = await Invoice.findOne({ where: { cargoId: cargo.id } });
    if (!invoice || invoice.status !== 'Paid') {
      return res.status(400).json({ message: `Settle outstanding invoice ${invoice ? invoice.invoiceNumber : 'N/A'} to generate Delivery Order.` });
    }

    // Generate DO Number
    const deliveryOrderNo = `DO-NMPA-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    cargo.deliveryOrderNo = deliveryOrderNo;
    await cargo.save();

    await logActivity(
      req,
      'DELIVERY_ORDER_GENERATED',
      `Issued Delivery Order: ${deliveryOrderNo} for Cargo consignment: ${cargo.cargoId}.`,
      'Shipping Agent',
      `Delivery Order ${deliveryOrderNo} generated. Ready for gate exit.`
    );

    return res.json({
      message: `Delivery Order generated successfully.`,
      deliveryOrderNo,
      cargo
    });
  } catch (error) {
    console.error('Delivery order generation error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
