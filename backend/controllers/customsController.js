const { CustomsClearance, Cargo, Invoice, Notification } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all customs clearance requests
exports.getCustomsRequests = async (req, res) => {
  try {
    const requests = await CustomsClearance.findAll({
      include: [{ model: Cargo }]
    });
    return res.json(requests);
  } catch (error) {
    console.error('Get customs requests error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Update customs status, add remarks and schedule inspections
exports.updateCustomsStatus = async (req, res) => {
  const { id } = req.params; // CustomsClearance primary key ID
  const { status, remarks, inspectionScheduledAt } = req.body;

  try {
    const clearance = await CustomsClearance.findByPk(id, {
      include: [{ model: Cargo }]
    });

    if (!clearance) {
      return res.status(404).json({ message: 'Customs clearance record not found.' });
    }

    const cargo = clearance.Cargo;
    if (!cargo) {
      return res.status(404).json({ message: 'Associated cargo not found.' });
    }

    // Update clearance details
    if (status) clearance.status = status;
    if (remarks) clearance.remarks = remarks;
    if (inspectionScheduledAt) clearance.inspectionScheduledAt = inspectionScheduledAt;
    clearance.officerId = req.user.id;
    await clearance.save();

    // Sync cargo status
    if (status === 'Approved') {
      cargo.status = 'Customs Approved';
      await cargo.save();

      // Automatically generate Finance Invoice upon Customs Approval
      // Calculate Storage Fee:
      // Weight * rate per ton * storage duration (mocked as e.g. 5 days)
      // Standard rate: $15 per ton per day.
      // Free storage: 3 days. Overstay triggers demurrage fee ($35 per ton per day).
      const entryDate = new Date(cargo.entryTime || cargo.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // min 1 day
      
      const freeDays = 3;
      const ratePerTon = 10.0; // standard daily rate
      const penaltyRate = 25.0; // demurrage daily rate
      
      let storageFee = cargo.weight * ratePerTon * diffDays;
      let demurrageFee = 0.0;
      
      if (diffDays > freeDays) {
        const excessDays = diffDays - freeDays;
        // Standard fee for the free period, penalty for the rest
        storageFee = cargo.weight * ratePerTon * freeDays;
        demurrageFee = cargo.weight * penaltyRate * excessDays;
      }
      
      const totalAmount = storageFee + demurrageFee;
      const invoiceNumber = `INV-NMPA-${Date.now().toString().slice(-6)}`;

      await Invoice.create({
        invoiceNumber,
        cargoId: cargo.id,
        storageFee,
        demurrageFee,
        penaltyFee: 0.0,
        totalAmount,
        status: 'Pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      await logActivity(
        req,
        'CUSTOMS_APPROVED',
        `Customs clearance approved for Cargo ${cargo.cargoId}. Generated Invoice ${invoiceNumber}.`,
        'Finance',
        `Cargo ${cargo.cargoId} approved by Customs. Invoice ${invoiceNumber} created for $${totalAmount.toFixed(2)}.`
      );
    } else if (status === 'Rejected') {
      cargo.status = 'Customs Hold';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_REJECTED',
        `Customs clearance rejected for Cargo ${cargo.cargoId}. Reason: ${remarks}`,
        'Shipping Agent',
        `Cargo ${cargo.cargoId} was REJECTED by customs. Remarks: ${remarks}`
      );
    } else if (status === 'On Hold') {
      cargo.status = 'Customs Hold';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_HOLD',
        `Customs clearance put on hold for Cargo ${cargo.cargoId}. Remarks: ${remarks}`
      );
    } else if (status === 'Under Inspection') {
      cargo.status = 'Customs Hold';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_UNDER_INSPECTION',
        `Customs clearance status updated to Under Inspection for Cargo ${cargo.cargoId}. Remarks: ${remarks}`
      );
    }

    return res.json({
      message: `Customs status updated to ${status || clearance.status}.`,
      clearance
    });
  } catch (error) {
    console.error('Update customs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
