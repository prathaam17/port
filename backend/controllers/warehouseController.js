const { Warehouse, YardLocation, Cargo, Inventory } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all warehouses with yard locations
exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      include: [{ model: YardLocation }]
    });
    return res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get single warehouse by ID
exports.getWarehouseById = async (req, res) => {
  const { id } = req.params;
  try {
    const warehouse = await Warehouse.findByPk(id, {
      include: [
        { model: YardLocation },
        { 
          model: Cargo,
          where: { status: 'Allocated' },
          required: false
        }
      ]
    });

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found.' });
    }

    return res.json(warehouse);
  } catch (error) {
    console.error('Get warehouse details error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Mark cargo as damaged
exports.reportDamage = async (req, res) => {
  const { cargoId, remarks } = req.body;

  try {
    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    cargo.isDamaged = true;
    cargo.damageRemarks = remarks;
    await cargo.save();

    await logActivity(
      req,
      'CARGO_DAMAGE_REPORT',
      `Flagged cargo ${cargo.cargoId} as damaged. Remarks: ${remarks}`,
      'Warehouse Manager',
      `Damage reported on Cargo ${cargo.cargoId}: ${remarks}`
    );

    return res.json({ message: 'Cargo flagged as damaged successfully.', cargo });
  } catch (error) {
    console.error('Report damage error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get all damaged cargo records
exports.getDamagedCargoReports = async (req, res) => {
  try {
    const damagedCargoes = await Cargo.findAll({
      where: { isDamaged: true },
      include: [{ model: Warehouse }]
    });

    return res.json(damagedCargoes);
  } catch (error) {
    console.error('Get damaged cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
