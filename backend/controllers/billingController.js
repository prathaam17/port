const { Invoice, Cargo, Payment, Notification } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: Cargo }]
    });
    return res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Process Invoice Payment
exports.payInvoice = async (req, res) => {
  const { id } = req.params; // Invoice ID
  const { paymentMethod, transactionRef } = req.body;

  try {
    if (!paymentMethod || !transactionRef) {
      return res.status(400).json({ message: 'Payment method and transaction reference are required.' });
    }

    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Cargo }]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ message: 'Invoice has already been paid.' });
    }

    // 1. Create Payment record
    const payment = await Payment.create({
      invoiceId: invoice.id,
      amountPaid: invoice.totalAmount,
      paymentMethod,
      transactionRef,
      paymentDate: new Date()
    });

    // 2. Update Invoice status
    invoice.status = 'Paid';
    await invoice.save();

    // 3. Log success
    const cargo = invoice.Cargo;
    await logActivity(
      req,
      'INVOICE_PAID',
      `Invoice ${invoice.invoiceNumber} paid via ${paymentMethod} ($${invoice.totalAmount}). Ref: ${transactionRef}`,
      'Gate Officer',
      `Payment received for cargo ${cargo ? cargo.cargoId : 'N/A'}. Invoice ${invoice.invoiceNumber} status is PAID.`
    );

    return res.json({
      message: 'Payment processed successfully. Invoice is now marked as Paid.',
      invoice,
      payment
    });
  } catch (error) {
    console.error('Pay invoice error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get Payment History
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Invoice,
          include: [{ model: Cargo }]
        }
      ],
      order: [['paymentDate', 'DESC']]
    });
    return res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
