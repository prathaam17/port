import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Anchor,
  FilePlus,
  QrCode,
  Search,
  FileText,
  CheckCircle,
  AlertTriangle,
  Layers,
  Activity,
  CreditCard,
  Plus,
  Compass,
  FileSpreadsheet,
  Sparkles,
  Clock,
  ArrowRight,
  Upload,
  ShieldCheck
} from 'lucide-react';

const ShippingAgentPortal = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [activeTab, setActiveTab] = useState('manifest');

  // Manifest states
  const [vesselNameVal, setVesselNameVal] = useState('MT Swarna Krishna');
  const [consigneeVal, setConsigneeVal] = useState('');
  const [tradeTypeVal, setTradeTypeVal] = useState('Import');
  
  // Single submission states
  const [containerNoVal, setContainerNoVal] = useState('');
  const [cargoTypeVal, setCargoTypeVal] = useState('Container');
  const [weightVal, setWeightVal] = useState(0.0);
  const [destinationVal, setDestinationVal] = useState('Mangalore');
  const [billOfLadingVal, setBillOfLadingVal] = useState('');
  const [shippingBillVal, setShippingBillVal] = useState('');
  const [signatureVal, setSignatureVal] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [isDocVerified, setIsDocVerified] = useState(false);
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Bulk CSV states
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Tracking states
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedCargo, setTrackedCargo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  
  // Billing states
  const [invoices, setInvoices] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Notifications summary
  const [agentAlerts, setAgentAlerts] = useState([]);

  // Load initial data
  useEffect(() => {
    fetchInvoices();
    fetchAgentAlerts();
  }, []);

  const fetchInvoices = async () => {
    setBillingLoading(true);
    try {
      const res = await API.get('/billing/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchAgentAlerts = async () => {
    try {
      const res = await API.get('/reports/notifications');
      const filtered = res.data.filter(
        n => n.roleTarget === 'Shipping Agent' || n.roleTarget === 'All'
      );
      setAgentAlerts(filtered.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  // Mock document validation
  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFile(file);
    setIsDocVerified(false);
    
    // Simulate auto-verification
    triggerToast('Analyzing Document', 'Validating digital signature and layout...', 'info');
    setTimeout(() => {
      setIsDocVerified(true);
      triggerToast('Auto-Verified', 'Document structure complies with NMPA standards.', 'success');
    }, 1500);
  };

  // Handle single manifest submit
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!containerNoVal || !consigneeVal || weightVal <= 0) {
      triggerToast('Validation Error', 'Fill all required manifest details.', 'error');
      return;
    }

    setSubmittingSingle(true);
    try {
      const cargoId = `CRG-NMPA-${Date.now().toString().slice(-4)}`;
      await API.post('/cargo/manifest', {
        cargoId,
        vesselName: vesselNameVal,
        cargoType: cargoTypeVal,
        quantity: 1,
        weight: parseFloat(weightVal),
        consignee: consigneeVal,
        containerNo: containerNoVal,
        destination: destinationVal,
        tradeType: tradeTypeVal,
        billOfLading: billOfLadingVal || `BL-${Date.now().toString().slice(-4)}`,
        shippingBill: shippingBillVal,
        digitalSignature: signatureVal
      });

      triggerToast('Manifest Registered', `Container ${containerNoVal} logged successfully.`, 'success');
      // Reset form
      setContainerNoVal('');
      setBillOfLadingVal('');
      setShippingBillVal('');
      setSignatureVal('');
      setDocFile(null);
      setIsDocVerified(false);
      fetchInvoices();
    } catch (err) {
      triggerToast('Upload Failed', err.response?.data?.message || 'Failed to submit manifest.', 'error');
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Parse CSV manifest text input
  const handleCsvParse = () => {
    if (!csvText) {
      triggerToast('No Input', 'Enter CSV text to parse.', 'error');
      return;
    }
    const lines = csvText.split('\n');
    const parsed = [];
    const startIndex = lines[0].toLowerCase().includes('container') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 3) {
        parsed.push({
          containerNo: parts[0]?.trim(),
          cargoType: parts[1]?.trim() || 'Container',
          weight: parseFloat(parts[2]?.trim()) || 0,
          destination: parts[3]?.trim() || 'Mangalore',
          tradeType: parts[4]?.trim() || 'Import'
        });
      }
    }
    setCsvPreview(parsed);
    triggerToast('CSV Parsed', `Found ${parsed.length} container rows. Review preview below.`, 'success');
  };

  // Submit bulk manifest
  const handleBulkSubmit = async () => {
    if (csvPreview.length === 0) return;
    setSubmittingBulk(true);
    try {
      await API.post('/cargo/bulk-manifest', {
        vesselName: vesselNameVal,
        tradeType: tradeTypeVal,
        consignee: consigneeVal,
        containers: csvPreview
      });
      triggerToast('Bulk Manifest Uploaded', `Successfully registered ${csvPreview.length} containers in inventory.`, 'success');
      setCsvPreview([]);
      setCsvText('');
      fetchInvoices();
    } catch (err) {
      triggerToast('Bulk Upload Failed', err.response?.data?.message || 'Failed to register bulk containers.', 'error');
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Search/Track Container
  const handleTrackContainer = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;

    setTrackingLoading(true);
    try {
      const res = await API.get('/cargo');
      const match = res.data.cargoes.find(
        c => c.containerNo === searchQuery || c.billOfLading === searchQuery || c.cargoId === searchQuery
      );
      if (match) {
        const detailRes = await API.get(`/cargo/${match.id}`);
        setTrackedCargo(detailRes.data);
      } else {
        setTrackedCargo(null);
        triggerToast('No Match', 'No active container or BL found matching query.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Search Error', 'Failed to retrieve container telemetry.', 'error');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Generate Delivery Order inline
  const handleGenerateDO = async (cargoId) => {
    try {
      const res = await API.post(`/cargo/${cargoId}/delivery-order`);
      triggerToast('DO Generated', `Delivery Order ${res.data.deliveryOrderNo} created successfully.`, 'success');
      if (trackedCargo && trackedCargo.id === cargoId) {
        const detailRes = await API.get(`/cargo/${cargoId}`);
        setTrackedCargo(detailRes.data);
      }
      fetchInvoices();
    } catch (err) {
      triggerToast('Failed', err.response?.data?.message || 'Failed to generate DO.', 'error');
    }
  };

  // Pay Port Charges Inline
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMode('UPI');
    setTxRef('');
    setShowPayModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await API.post(`/billing/invoice/${selectedInvoice.id}/payment`, {
        paymentMode,
        transactionRef: txRef || `TXN-${Date.now()}`
      });

      triggerToast('Paid Successfully', `Settle port invoice for ${selectedInvoice.invoiceNumber}.`, 'success');
      setShowPayModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
      if (trackedCargo) {
        const detailRes = await API.get(`/cargo/${trackedCargo.id}`);
        setTrackedCargo(detailRes.data);
      }
    } catch (err) {
      triggerToast('Payment failed', 'Internal check mismatch.', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  // Helper: Visual timeline stepper render
  const renderTrackingStepper = (cargo) => {
    const steps = [
      { label: 'Manifest Logged', done: true, desc: `Trade: ${cargo.tradeType}` },
      { label: 'Unloaded', done: cargo.status !== 'Manifest Uploaded', desc: cargo.unloadingEquipment ? `Via ${cargo.unloadingEquipment}` : 'Awaiting Dock' },
      { label: 'Storage Map', done: ['Allocated', 'Customs Hold', 'Customs Approved', 'Gate Pass Generated', 'Dispatched'].includes(cargo.status), desc: cargo.binCode ? `Bin: ${cargo.binCode}` : 'Awaiting Storage' },
      { label: 'Customs Release', done: ['Customs Approved', 'Gate Pass Generated', 'Dispatched'].includes(cargo.status), desc: cargo.CustomsClearance?.status === 'Approved' ? 'Cleared' : cargo.CustomsClearance?.status || 'Pending' },
      { label: 'Delivery Order', done: !!cargo.deliveryOrderNo, desc: cargo.deliveryOrderNo ? 'DO Issued' : 'Awaiting DO' },
      { label: 'Gate Exit', done: cargo.status === 'Dispatched', desc: cargo.status === 'Dispatched' ? 'Exited Terminal' : 'Awaiting Pickup' }
    ];

    return (
      <div className="space-y-4 font-light text-slate-700 dark:text-slate-350 select-none">
        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Telemetry Tracking Stepper</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-3">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-slate-950/40 dark:border-slate-800/40">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 border ${
                step.done 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                {step.done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
              </div>
              <span className="font-bold text-xs leading-tight text-slate-850 dark:text-slate-200">{step.label}</span>
              <span className="text-[10px] text-slate-400 mt-1 italic leading-tight">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Welcoming User */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Anchor className="w-6 h-6 text-sky-500" />
            Shipping Agency Cockpit
          </h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Declare incoming cargo manifests, track containers, and pay port charges</p>
        </div>
        <div className="flex gap-2">
          {['manifest', 'tracking', 'billing'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition cursor-pointer
                ${activeTab === tab 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/10' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Alert Monitor Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Agency Statistics */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between select-none">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">Consignment Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Active Containers</span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {invoices.filter(i => i.status !== 'Paid').length}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Unpaid Ledger</span>
              <span className="text-lg font-black text-rose-500 mt-1 block truncate">
                ₹{invoices.filter(i => i.status === 'Unpaid').reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Shipping Line Alerts Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Live Agency Operations Feed</h3>
          <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
            {agentAlerts.map(alert => (
              <div key={alert.id} className="text-xs p-2 rounded-lg bg-sky-500/5 border border-sky-500/10 flex justify-between items-center text-slate-700 dark:text-slate-350">
                <span className="font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  {alert.title}: {alert.message}
                </span>
                <span className="text-slate-400">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            {agentAlerts.length === 0 && (
              <p className="text-xs text-slate-400 italic">No warnings or billing updates received.</p>
            )}
          </div>
        </div>

      </div>

      {/* TAB 1: Manifest Declarations */}
      {activeTab === 'manifest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Side */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
            <h3 className="font-bold text-base text-slate-850 dark:text-white mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FilePlus className="w-5 h-5 text-sky-500" />
              Declare Ship Cargo
            </h3>

            <form onSubmit={handleSingleSubmit} className="space-y-4 text-sm select-none">
              
              {/* General header parameters */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vessel Call Name</label>
                  <input
                    type="text"
                    required
                    value={vesselNameVal}
                    onChange={(e) => setVesselNameVal(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trade Direction</label>
                  <select
                    value={tradeTypeVal}
                    onChange={(e) => setTradeTypeVal(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="Import">Import Clearance</option>
                    <option value="Export">Export Approval</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Consignee Client Partner</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western India Cashew Company"
                  value={consigneeVal}
                  onChange={(e) => setConsigneeVal(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Container ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MSCU1234567"
                    value={containerNoVal}
                    onChange={(e) => setContainerNoVal(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mangalore"
                    value={destinationVal}
                    onChange={(e) => setDestinationVal(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Class Category</label>
                  <select
                    value={cargoTypeVal}
                    onChange={(e) => setCargoTypeVal(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                  >
                    <option value="Container">Containerized (TEU)</option>
                    <option value="Bulk">Bulk Carrier</option>
                    <option value="Liquid">Liquid Carrier</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tonnage (Metric Tons)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0.1"
                    value={weightVal || ''}
                    onChange={(e) => setWeightVal(parseFloat(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill of Lading No</label>
                  <input
                    type="text"
                    placeholder="BL-908123"
                    value={billOfLadingVal}
                    onChange={(e) => setBillOfLadingVal(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Bill Reference</label>
                  <input
                    type="text"
                    placeholder="SB-109281"
                    value={shippingBillVal}
                    onChange={(e) => setShippingBillVal(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* PDF Document Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customs Document PDF</label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition flex flex-col items-center gap-1.5 relative">
                  <Upload className="w-5 h-5 text-slate-450" />
                  <span className="text-xs text-slate-500 font-medium">
                    {docFile ? docFile.name : 'Drop Bill of Lading / Shipping Bill PDF here'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleDocUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {docFile && (
                  <div className={`mt-2 p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold border ${
                    isDocVerified 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/15'
                  }`}>
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{isDocVerified ? 'Auto-Verified: NMPA Format Validated & Signed' : 'Analyzing Document Seals...'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Digital Signature Identity</label>
                <input
                  type="text"
                  required
                  placeholder="Type full name to digitally sign"
                  value={signatureVal}
                  onChange={(e) => setSignatureVal(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSingle || (docFile && !isDocVerified)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-sky-500/10 flex justify-center items-center gap-1.5 border border-sky-500/10 cursor-pointer disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                {submittingSingle ? 'Saving consignment...' : 'Settle Manifest'}
              </button>

            </form>
          </div>

          {/* Bulk Import / CSV Side */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
            
            <div>
              <h3 className="font-bold text-base text-slate-850 dark:text-white mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Bulk CSV Manifest Parser
              </h3>

              <div className="space-y-4 select-none">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Paste Container Rows (CSV Format)</label>
                  <textarea
                    rows={6}
                    placeholder="Container No,Cargo Type,Weight,Destination,Trade Type&#10;MSCU1234567,Coal,25,Mangalore,Import&#10;MSCU7654321,Timber,18,Udupi,Export"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCsvParse}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
                >
                  Parse & Validate
                </button>
              </div>

              {/* Parsed Rows Preview */}
              {csvPreview.length > 0 && (
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-450 uppercase mb-2 tracking-wider">CSV Container Rows Preview</h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl text-xs font-light">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 border-b border-slate-100 dark:border-slate-800/60 font-bold">
                          <th className="p-2">Container</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Tons</th>
                          <th className="p-2">Destination</th>
                          <th className="p-2">Trade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-350">
                        {csvPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="p-2 font-bold text-indigo-500">{row.containerNo}</td>
                            <td className="p-2">{row.cargoType}</td>
                            <td className="p-2">{row.weight}T</td>
                            <td className="p-2">{row.destination}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.tradeType === 'Export' 
                                  ? 'bg-amber-500/10 text-amber-400' 
                                  : 'bg-sky-500/10 text-sky-400'
                              }`}>
                                {row.tradeType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {csvPreview.length > 0 && (
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={submittingBulk}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex justify-center items-center gap-1 shadow-lg hover:shadow-emerald-500/10 cursor-pointer border border-emerald-500/10"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submittingBulk ? 'Creating records...' : `Confirm & Settle ${csvPreview.length} containers`}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: Container Telemetry & Tracking */}
      {activeTab === 'tracking' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel space-y-6">
          
          {/* Tracking Search Input */}
          <div className="max-w-xl">
            <h3 className="font-bold text-base text-slate-850 dark:text-white mb-2 flex items-center gap-1.5">
              <Search className="w-5 h-5 text-sky-400" />
              Real-time Container Tracker
            </h3>
            <p className="text-sm text-slate-400 font-light mb-4">Search by Container Number (e.g. MSCU1234567) or Bill of Lading ID to retrieve complete cargo logistics telemetry</p>
            
            <form onSubmit={handleTrackContainer} className="flex gap-2">
              <input
                type="text"
                placeholder="Search Container, BL-Ref, or Cargo ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-800 dark:text-slate-200"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition shadow-lg hover:shadow-sky-500/10 flex items-center gap-1 cursor-pointer border border-sky-500/10"
              >
                <Search className="w-4 h-4" />
                Track
              </button>
            </form>
          </div>

          {/* Stepper Timeline & Cargo Details */}
          {trackingLoading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : trackedCargo ? (
            <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-6 animate-fade-in text-sm font-light">
              
              {/* Stepper Grid block */}
              {renderTrackingStepper(trackedCargo)}

              {/* Data Blocks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* Consignment block */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl space-y-2 select-none">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Consignment Credentials</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-450">Cargo ID:</span><span className="font-bold text-sky-500">{trackedCargo.cargoId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-450">Container No:</span><span className="font-bold text-slate-800 dark:text-slate-200">{trackedCargo.containerNo || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-450">Vessel Name:</span><span>{trackedCargo.vesselName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-450">Consignee:</span><span className="truncate max-w-[150px] font-bold">{trackedCargo.consignee}</span></div>
                  </div>
                </div>

                {/* Customs Status block */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl space-y-2 select-none">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Customs & Files</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-450">Bill of Lading:</span><span className="font-mono">{trackedCargo.billOfLading || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-450">Shipping Bill:</span><span className="font-mono">{trackedCargo.shippingBill || 'N/A'}</span></div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Customs Release:</span>
                      <span className={`font-bold uppercase ${
                        trackedCargo.CustomsClearance?.status === 'Approved' ? 'text-emerald-400' : 'text-amber-500'
                      }`}>
                        {trackedCargo.CustomsClearance?.status || 'Pending'}
                      </span>
                    </div>
                    {trackedCargo.CustomsClearance?.remarks && (
                      <div className="text-[10px] text-slate-400 italic truncate" title={trackedCargo.CustomsClearance.remarks}>
                        Remarks: {trackedCargo.CustomsClearance.remarks}
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing / DO release action block */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl space-y-2">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider select-none">Billing & Releases</h4>
                  
                  {/* Generate DO and Settle actions */}
                  <div className="space-y-2 pt-1.5">
                    {/* If cargo cleared and DO not yet generated, and invoice is unpaid */}
                    {trackedCargo.status === 'Customs Approved' && !trackedCargo.deliveryOrderNo ? (
                      <div className="space-y-2 select-none text-xs">
                        <p className="text-xs text-slate-400">Cargo is Customs Cleared. Pay outstanding dues to generate Delivery Order.</p>
                        <button
                          onClick={() => handleGenerateDO(trackedCargo.id)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generate Delivery Order
                        </button>
                      </div>
                    ) : trackedCargo.deliveryOrderNo ? (
                      <div className="text-xs space-y-1 select-none">
                        <div className="flex justify-between"><span className="text-slate-450">DO Reference:</span><span className="font-bold text-emerald-500">{trackedCargo.deliveryOrderNo}</span></div>
                        <div className="text-[10px] text-emerald-500/80 font-semibold flex items-center gap-1 mt-1 bg-emerald-500/5 p-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Delivery Order generated. Cargo release pass cleared for gate exit.
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic select-none">
                        Awaiting Customs Approval to trigger Delivery Order.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            searchQuery && (
              <div className="text-center py-10 text-sm text-slate-400 italic">No container matches search index.</div>
            )
          )}

        </div>
      )}

      {/* TAB 3: Agency Invoices & Billing */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
          <h3 className="font-bold text-base text-slate-850 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            Commercial Port Charges Ledger
          </h3>

          {billingLoading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : invoices.length === 0 ? (
            <p className="p-10 text-center text-slate-400">No active invoices linked to your shipping agency.</p>
          ) : (
            <div className="overflow-x-auto text-sm font-light">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Cargo ID</th>
                    <th className="p-3">Consignee Client</th>
                    <th className="p-3">Demurrage Days</th>
                    <th className="p-3 font-bold text-slate-800 dark:text-white">Total Billing (₹)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-355 font-light">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-850 dark:text-slate-100">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-sky-500">{inv.Cargo?.cargoId || 'N/A'}</td>
                      <td className="p-3 truncate max-w-[150px] font-medium" title={inv.Cargo?.consignee}>{inv.Cargo?.consignee || 'N/A'}</td>
                      <td className="p-3 font-bold text-amber-500">{inv.demurrageDays}</td>
                      <td className="p-3 font-extrabold">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          inv.status === 'Paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                        }`}>
                          {inv.status === 'Paid' ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                      <td className="p-3 text-right shrink-0">
                        {inv.status === 'Unpaid' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Pay Charges
                          </button>
                        )}
                        {inv.status === 'Paid' && (
                          <span className="text-xs text-slate-400 italic font-medium">Paid & Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Pay Port Charges</h3>
                <span className="text-xs text-slate-450">Invoice: <strong className="font-mono text-sky-500">{selectedInvoice?.invoiceNumber}</strong></span>
              </div>
              <button onClick={() => { setShowPayModal(false); setSelectedInvoice(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-light text-slate-700 dark:text-slate-355 select-none">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-100 dark:border-slate-850">
                <div className="flex justify-between text-slate-450">
                  <span>Storage Base Fee:</span>
                  <span>₹{selectedInvoice?.storageFee.toLocaleString()}</span>
                </div>
                {selectedInvoice?.demurrageFee > 0 && (
                  <div className="flex justify-between text-amber-500 font-semibold">
                    <span>Demurrage:</span>
                    <span>+ ₹{selectedInvoice?.demurrageFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 dark:text-slate-100 font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-sm">
                  <span>Amount Due:</span>
                  <span className="text-sky-500">₹{selectedInvoice?.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300 font-bold"
                >
                  <option value="UPI">UPI / QR Scan Code</option>
                  <option value="Bank Transfer">RTGS / Bank Transfer</option>
                  <option value="Card">Commercial Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-90312014022"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-emerald-500/10 flex items-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  {payLoading ? 'Processing...' : 'Settle Amount'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShippingAgentPortal;
