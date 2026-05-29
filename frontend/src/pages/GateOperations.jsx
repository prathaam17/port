import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  QrCode, 
  Truck as TruckIcon, 
  UserCheck, 
  ArrowRightLeft, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

const GateOperations = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Generator Form Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [cargoIdVal, setCargoIdVal] = useState('');
  const [truckNumVal, setTruckNumVal] = useState('');
  const [driverNameVal, setDriverNameVal] = useState('');
  const [driverLicVal, setDriverLicVal] = useState('');
  const [carrierCompanyVal, setCarrierCompanyVal] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  // Scanner Simulator Console
  const [scanCode, setScanCode] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [scanError, setScanError] = useState('');
  const [processLoading, setProcessLoading] = useState(false);

  const fetchGatePasses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/gate');
      setPasses(res.data);
    } catch (error) {
      console.error('Failed to fetch gate passes:', error);
      triggerToast('Error', 'Failed to retrieve gate passes database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, []);

  // 1. Action: Generate QR Gate Pass
  const handleGeneratePassSubmit = async (e) => {
    e.preventDefault();
    if (!cargoIdVal || !truckNumVal || !driverNameVal || !driverLicVal) {
      triggerToast('Validation Error', 'Please fill in all required truck and driver details.', 'error');
      return;
    }

    setGenLoading(true);
    try {
      const res = await API.post('/gate/pass', {
        cargoId: cargoIdVal,
        truckNumber: truckNumVal,
        driverName: driverNameVal,
        driverLicence: driverLicVal,
        carrierCompany: carrierCompanyVal
      });

      triggerToast('Pass Generated', `Gate Pass ${res.data.gatePass.passCode} created successfully.`, 'success');
      setShowGenModal(false);
      // Reset form
      setCargoIdVal('');
      setTruckNumVal('');
      setDriverNameVal('');
      setDriverLicVal('');
      setCarrierCompanyVal('');
      
      // Auto fill scanner for convenience in testing!
      setScanCode(res.data.gatePass.passCode);
      handleVerifyScanCode(res.data.gatePass.passCode);

      fetchGatePasses();
    } catch (error) {
      triggerToast('Pass Failed', error.response?.data?.message || 'Failed to issue Gate Pass.', 'error');
    } finally {
      setGenLoading(false);
    }
  };

  // 2. Action: Verify QR Pass
  const handleVerifyScanCode = async (codeToVerify) => {
    const code = codeToVerify || scanCode;
    if (!code) {
      setScanError('Please enter a valid Gate Pass QR code string.');
      setScannedPass(null);
      return;
    }

    setScanError('');
    // Look up locally from current passes state for immediate response
    const passObj = passes.find(p => p.passCode === code);
    if (!passObj) {
      // If not in local page state, prompt error
      setScanError('Invalid Gate Pass. Code not registered in NMPA database.');
      setScannedPass(null);
    } else {
      setScannedPass(passObj);
    }
  };

  // 3. Action: Process Gate Check-In (Entry)
  const handleGateEntry = async () => {
    setProcessLoading(true);
    try {
      await API.post('/gate/entry', { passCode: scannedPass.passCode });
      triggerToast('Truck Entered', `Truck ${scannedPass.Truck.truckNumber} verified and checked in at Gate 2.`, 'success');
      
      setScannedPass(null);
      setScanCode('');
      fetchGatePasses();
    } catch (error) {
      triggerToast('Entry Blocked', error.response?.data?.message || 'Check-in failed.', 'error');
    } finally {
      setProcessLoading(false);
    }
  };

  // 4. Action: Process Gate Check-Out & Dispatch (Exit)
  const handleGateExit = async () => {
    setProcessLoading(true);
    try {
      await API.post('/gate/exit', { passCode: scannedPass.passCode });
      triggerToast('Cargo Dispatched', `Truck exited. Cargo ${scannedPass.Cargo.cargoId} has left the port facility. Inventory updated.`, 'success');
      
      setScannedPass(null);
      setScanCode('');
      fetchGatePasses();
    } catch (error) {
      triggerToast('Exit Blocked', error.response?.data?.message || 'Check-out failed.', 'error');
    } finally {
      setProcessLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Generated':
        return <span className="px-2 py-1 text-sm font-bold rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">PASS ISSUED</span>;
      case 'Entered':
        return <span className="px-2 py-1 text-sm font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">INSIDE PORT AREA</span>;
      case 'Exited':
        return <span className="px-2 py-1 text-sm font-bold rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">DISPATCHED (EXITED)</span>;
      default:
        return <span className="px-2 py-1 text-sm font-bold rounded bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Gate Operations & Truck Dispatch</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Generate QR Gate Passes, verify driver license documentation, and check commercial trucks in/out of terminal gates</p>
        </div>
        {['Shipping Agent', 'Super Admin'].includes(user?.role) && (
          <button 
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
          >
            <Plus className="w-4 h-4" />
            Generate Gate Pass QR
          </button>
        )}
      </div>

      {/* Main Grid: QR Scanner Simulator console vs Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Scanner console (Gate Officer only or Admin) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sky-400" />
              Gate QR Pass Scanner Simulator
            </h3>

            {/* Input scanning code */}
            <div className="flex gap-2 mb-4 select-none">
              <input
                type="text"
                placeholder="Enter or Scan Gate Pass Code (e.g. GP-NMPA-...)"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-800 dark:text-slate-200 font-mono"
              />
              <button
                onClick={() => handleVerifyScanCode()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-xl transition"
              >
                Scan Pass
              </button>
            </div>

            {scanError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm flex gap-1.5 items-center mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Scanned result dashboard details */}
            {scannedPass ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3.5 text-sm select-none">
                
                {/* Header detail */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-sky-500">{scannedPass.passCode}</span>
                  {getStatusBadge(scannedPass.status)}
                </div>

                {/* Driver Check */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-sm font-bold text-slate-400 uppercase">Driver Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{scannedPass.Truck.driverName}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-400 uppercase">Driver License</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{scannedPass.Truck.driverLicence}</span>
                  </div>
                </div>

                {/* Truck Detail */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-sm font-bold text-slate-400 uppercase">Truck License Plate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{scannedPass.Truck.truckNumber}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-400 uppercase">Cargo Reference</span>
                    <span className="font-bold text-sky-500">{scannedPass.Cargo.cargoId}</span>
                  </div>
                </div>

                {/* Logistics Info */}
                <div>
                  <span className="block text-sm font-bold text-slate-400 uppercase">Carrier Company</span>
                  <span className="text-slate-600 dark:text-slate-300 font-light">{scannedPass.Truck.carrierCompany || 'N/A'}</span>
                </div>

                {/* Verification alerts */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex gap-2 items-center text-sm text-emerald-500 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Verified: Cargo is approved by customs and invoice is PAID.</span>
                </div>

              </div>
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center flex flex-col items-center gap-2 select-none">
                <TruckIcon className="w-8 h-8 text-slate-400 animate-pulse-slow" />
                <span className="text-sm text-slate-500 font-light">Scan QR gate pass code or click a seeded pass on the right to simulate QR gate pass verification.</span>
              </div>
            )}
          </div>

          {/* Action Trigger button */}
          {scannedPass && (
            <div className="mt-6">
              {scannedPass.status === 'Generated' && (
                <button
                  onClick={handleGateEntry}
                  disabled={processLoading || !['Gate Officer', 'Super Admin'].includes(user?.role)}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-amber-600/10 flex items-center justify-center gap-1.5 border border-amber-500/10"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {processLoading ? 'Registering check-in...' : 'Verify Entry (Check-In Truck)'}
                </button>
              )}

              {scannedPass.status === 'Entered' && (
                <button
                  onClick={handleGateExit}
                  disabled={processLoading || !['Gate Officer', 'Super Admin'].includes(user?.role)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-600/10 flex items-center justify-center gap-1.5 border border-emerald-500/10"
                >
                  <CheckCircle className="w-4 h-4" />
                  {processLoading ? 'Reducing Inventory...' : 'Verify Exit & Dispatch Cargo'}
                </button>
              )}

              {scannedPass.status === 'Exited' && (
                <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-center text-slate-400 italic font-medium select-none">
                  Gate Pass is already Exited and Dispatched.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Logs list */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
          
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Gate Registry logs</h3>
              <button 
                onClick={fetchGatePasses}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-10 flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : passes.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-500 font-light">No Gate Passes issued.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1 text-sm font-light">
                {passes.map(pass => (
                  <div 
                    key={pass.id} 
                    onClick={() => {
                      setScanCode(pass.passCode);
                      setScannedPass(pass);
                      setScanError('');
                    }}
                    className="py-3 flex justify-between items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-950/45 px-2 rounded-xl transition cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-500">{pass.passCode}</span>
                        {getStatusBadge(pass.status)}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">
                        Truck: <strong className="font-bold">{pass.Truck?.truckNumber}</strong> | Driver: {pass.Truck?.driverName}
                      </p>
                      <div className="text-sm text-slate-400 font-light flex gap-2">
                        {pass.entryTime && <span>In: {new Date(pass.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        {pass.exitTime && <span>Out: {new Date(pass.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>

                    <div className="text-right text-sm text-slate-400 shrink-0 select-none">
                      <span className="block font-medium text-slate-600 dark:text-slate-200">Cargo: {pass.Cargo?.cargoId}</span>
                      <span>Issued: {new Date(pass.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* GENERATE MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Issue QR Gate Pass</h3>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleGeneratePassSubmit} className="space-y-4 text-sm select-none">
              
              {/* Cargo ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRG-NMPA-004"
                  value={cargoIdVal}
                  onChange={(e) => setCargoIdVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <span className="block text-sm text-slate-400 mt-1">Cargo must be Customs Approved and Invoice must be Paid.</span>
              </div>

              {/* Truck Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Truck Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-19-ME-9021"
                  value={truckNumVal}
                  onChange={(e) => setTruckNumVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Driver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gowda"
                    value={driverNameVal}
                    onChange={(e) => setDriverNameVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Driver License DL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-192014022"
                    value={driverLicVal}
                    onChange={(e) => setDriverLicVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Carrier Company */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Carrier Transport Company</label>
                <input
                  type="text"
                  placeholder="e.g. Mangalore Port Transport Co."
                  value={carrierCompanyVal}
                  onChange={(e) => setCarrierCompanyVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg hover:shadow-sky-500/10"
                >
                  <QrCode className="w-4 h-4" />
                  {genLoading ? 'Verifying & Creating...' : 'Generate Pass'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GateOperations;
