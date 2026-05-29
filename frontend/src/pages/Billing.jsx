import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  FileSpreadsheet, 
  IndianRupee, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  DollarSign 
} from 'lucide-react';

const Billing = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Modal print view states
  const [showPrintView, setShowPrintView] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await API.get('/billing/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      triggerToast('Error', 'Failed to retrieve billing invoices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMode('UPI');
    setTxRef('');
    setShowPayModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMode) return;

    setPayLoading(true);
    try {
      await API.post(`/billing/invoice/${selectedInvoice.id}/payment`, {
        paymentMode,
        transactionRef: txRef || `TXN-${Date.now()}`
      });

      triggerToast('Invoice Settled', `Invoice ${selectedInvoice.invoiceNumber} paid successfully via ${paymentMode}.`, 'success');
      setShowPayModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      triggerToast('Payment Failed', error.response?.data?.message || 'Failed to process invoice settlement.', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const openPrintReceipt = (invoice) => {
    setInvoiceToPrint(invoice);
    setShowPrintView(true);
    // Auto call browser print shortly after modal renders
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PAID & COMPLETED</span>;
      case 'Unpaid':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">UNPAID LEDGER</span>;
      default:
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel no-print">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Port Billing & Finance Ledger</h2>
        <p className="text-sm text-slate-400 font-light mt-0.5">Manage storage fees, calculate demurrage charges, issue commercial invoices, and print receipts</p>
      </div>

      {/* Invoice Ledger Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden glass-panel no-print">
        
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-450 font-light">No invoices issued.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Cargo ID</th>
                  <th className="p-4">Consignee Client</th>
                  <th className="p-4">Storage days</th>
                  <th className="p-4">Demurrage Days</th>
                  <th className="p-4">Storage Fee</th>
                  <th className="p-4">Demurrage Fee</th>
                  <th className="p-4 font-bold text-slate-800 dark:text-white">Total Billing (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                {invoices.map(inv => {
                  const storageDays = Math.max(1, Math.ceil((new Date() - new Date(inv.Cargo?.createdAt)) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100">{inv.invoiceNumber}</td>
                      <td className="p-4 font-bold text-sky-500 dark:text-sky-400">{inv.Cargo?.cargoId || 'N/A'}</td>
                      <td className="p-4 truncate max-w-[120px] font-medium" title={inv.Cargo?.consignee}>{inv.Cargo?.consignee || 'N/A'}</td>
                      <td className="p-4">{storageDays} Days</td>
                      <td className="p-4 font-bold text-amber-500">{inv.demurrageDays}</td>
                      <td className="p-4">₹{inv.storageFee.toLocaleString()}</td>
                      <td className="p-4">₹{inv.demurrageFee.toLocaleString()}</td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4">{getStatusBadge(inv.status)}</td>
                      <td className="p-4 text-right shrink-0">
                        <div className="flex gap-1.5 justify-end">
                          
                          {/* Settle (Finance, Shipping Agent, or Admin, only if Unpaid) */}
                          {['Finance', 'Super Admin', 'Shipping Agent'].includes(user?.role) && inv.status === 'Unpaid' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition"
                            >
                              {user?.role === 'Shipping Agent' ? 'Pay Port Charges' : 'Collect Fee'}
                            </button>
                          )}

                          {/* Print Receipt */}
                          <button
                            onClick={() => openPrintReceipt(inv)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-lg text-sm transition"
                          >
                            <Printer className="w-3 h-3" />
                            Print Bill
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* COLLECT PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 no-print">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Settle Storage Invoice</h3>
                <span className="text-sm text-slate-400 font-light">Invoice: <strong className="font-mono text-sky-500">{selectedInvoice?.invoiceNumber}</strong></span>
              </div>
              <button onClick={() => { setShowPayModal(false); setSelectedInvoice(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-sm select-none">
              
              {/* Settle breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-100 dark:border-slate-850">
                <div className="flex justify-between text-slate-450">
                  <span>Storage Base Fee:</span>
                  <span>₹{selectedInvoice?.storageFee.toLocaleString()}</span>
                </div>
                {selectedInvoice?.demurrageFee > 0 && (
                  <div className="flex justify-between text-amber-500 font-medium">
                    <span>Demurrage ({selectedInvoice?.demurrageDays} days):</span>
                    <span>+ ₹{selectedInvoice?.demurrageFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 dark:text-slate-100 font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-sm">
                  <span>Amount Due:</span>
                  <span className="text-sky-500">₹{selectedInvoice?.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300 font-bold"
                >
                  <option value="UPI">UPI / QR Scan Code</option>
                  <option value="Bank Transfer">RTGS / Bank Transfer</option>
                  <option value="Card">Commercial Credit Card</option>
                  <option value="Ledger">Shipping Line Agency Ledger</option>
                </select>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Transaction Reference ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-90312014022"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setSelectedInvoice(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-emerald-500/10 flex items-center gap-1"
                >
                  <CreditCard className="w-4 h-4" />
                  {payLoading ? 'Processing...' : 'Settle Amount'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT OVERLAY (Toggled for media print execution) */}
      {showPrintView && invoiceToPrint && (
        <div className="fixed inset-0 bg-white z-[9999] p-10 overflow-y-auto text-black flex flex-col justify-between print-container">
          
          <div className="space-y-6">
            
            {/* Print Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">New Mangalore Port Authority</h1>
                <p className="text-sm text-slate-500 mt-1">NMPA Finance & Billing Department | Panambur, Mangaluru, Karnataka 575010</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-slate-800">OFFICIAL RECEIPT</h2>
                <p className="text-sm text-slate-500 mt-0.5">Date Issued: {new Date(invoiceToPrint.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700">INVOICED TO:</h4>
                <p className="font-bold text-slate-900">{invoiceToPrint.Cargo?.consignee}</p>
                <p className="text-slate-500">Shipping Client Partner</p>
              </div>
              <div className="text-right space-y-1">
                <h4 className="font-bold text-slate-700">BILLING REFERENCE:</h4>
                <p className="font-bold text-slate-900">Invoice: {invoiceToPrint.invoiceNumber}</p>
                <p className="font-bold text-sky-600">Cargo Reference: {invoiceToPrint.Cargo?.cargoId}</p>
              </div>
            </div>

            {/* Table Details */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left font-bold text-slate-700">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">Cargo Category</th>
                  <th className="py-2">Tonnage (Metric Tons)</th>
                  <th className="py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-3">
                    <span className="font-bold block">Base Storage Warehousing</span>
                    <span className="text-sm text-slate-500">Fixed rate storage inside secure port zones</span>
                  </td>
                  <td className="py-3">{invoiceToPrint.Cargo?.cargoType}</td>
                  <td className="py-3">{invoiceToPrint.Cargo?.weight} Tons</td>
                  <td className="py-3 text-right">₹{invoiceToPrint.storageFee.toLocaleString()}</td>
                </tr>
                {invoiceToPrint.demurrageFee > 0 && (
                  <tr className="border-b border-slate-200">
                    <td className="py-3 text-amber-600">
                      <span className="font-bold block">Demurrage Penalties</span>
                      <span className="text-sm text-slate-500">Overstay storage exceeding 3 days threshold ({invoiceToPrint.demurrageDays} extra days)</span>
                    </td>
                    <td className="py-3">-</td>
                    <td className="py-3">-</td>
                    <td className="py-3 text-right text-amber-600">₹{invoiceToPrint.demurrageFee.toLocaleString()}</td>
                  </tr>
                )}
                
                {/* Total block */}
                <tr className="font-bold text-sm">
                  <td colSpan="3" className="py-4 text-right">Invoice Total Amount:</td>
                  <td className="py-4 text-right text-slate-900 border-t border-slate-900 text-base">₹{invoiceToPrint.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Payment Details */}
            <div className="p-4 bg-slate-100 rounded-xl grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-sm font-bold text-slate-500 uppercase">Payment Status</span>
                <span className="font-bold text-emerald-600 mt-1 block">{invoiceToPrint.status === 'Paid' ? 'PAID & COMPLETED' : 'UNPAID'}</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold text-slate-500 uppercase">Settlement Details</span>
                <span className="font-medium text-slate-800 mt-1 block">Mode: {invoiceToPrint.Payments?.[0]?.paymentMode || 'N/A'}</span>
                <span className="text-sm text-slate-500 font-mono">Ref: {invoiceToPrint.Payments?.[0]?.transactionRef || 'N/A'}</span>
              </div>
            </div>

          </div>

          {/* Footer print disclaimer */}
          <div className="border-t border-slate-300 pt-5 mt-10 flex justify-between items-center text-sm text-slate-400 no-print">
            <span>Generated electronically by NMPA Port System. No physical signature required.</span>
            <button 
              onClick={() => { setShowPrintView(false); setInvoiceToPrint(null); }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer"
            >
              Exit Print Mode
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default Billing;
