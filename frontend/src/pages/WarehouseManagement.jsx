import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Warehouse as WarehouseIcon, 
  Layers, 
  AlertOctagon, 
  CheckCircle, 
  MapPin, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

const WarehouseManagement = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [damagedCargoes, setDamagedCargoes] = useState([]);
  const [activeCargoes, setActiveCargoes] = useState([]); // Non-dispatched cargoes to choose for reporting damage
  const [loading, setLoading] = useState(true);

  // Damage reporting form state
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [damageRemarks, setDamageRemarks] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Warehouses
      const whRes = await API.get('/warehouses');
      setWarehouses(whRes.data);
      if (whRes.data.length > 0) {
        // Retain selected warehouse if it exists, or select the first
        const nextId = selectedWarehouseId || whRes.data[0].id;
        setSelectedWarehouseId(nextId);
        await fetchWarehouseDetails(nextId);
      }

      // 2. Fetch Damaged Cargo list
      const damageRes = await API.get('/warehouses/damaged/reports');
      setDamagedCargoes(damageRes.data);

      // 3. Fetch active Cargo for dropdown selection (only cargo currently in port)
      const cargoRes = await API.get('/cargo', { params: { limit: 100 } });
      const activeInPort = cargoRes.data.cargoes.filter(c => 
        ['Allocated', 'Customs Hold', 'Customs Approved', 'Gate Pass Generated'].includes(c.status)
      );
      setActiveCargoes(activeInPort);
    } catch (error) {
      console.error('Failed to fetch warehouse data:', error);
      triggerToast('Sync Error', 'Failed to retrieve storage databases.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseDetails = async (id) => {
    try {
      const res = await API.get(`/warehouses/${id}`);
      setActiveWarehouse(res.data);
    } catch (error) {
      console.error('Failed to get warehouse details:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWarehouseSelect = (id) => {
    setSelectedWarehouseId(id);
    fetchWarehouseDetails(id);
  };

  // Submit Cargo damage report
  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (!selectedCargoId || !damageRemarks) {
      triggerToast('Validation Error', 'Please select a cargo and enter remarks.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.post('/warehouses/damage', {
        cargoId: selectedCargoId,
        remarks: damageRemarks
      });

      triggerToast('Damage Filed', `Cargo ${selectedCargoId} flagged as damaged.`, 'success');
      setSelectedCargoId('');
      setDamageRemarks('');
      fetchData(); // Refresh datasets
    } catch (error) {
      triggerToast('Filing Failed', error.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Occupancy utilization colors helper
  const getUtilColor = (occupied, capacity) => {
    const pct = (occupied / capacity) * 100;
    if (pct < 50) return 'bg-emerald-500';
    if (pct < 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getUtilBg = (occupied, capacity) => {
    const pct = (occupied / capacity) * 100;
    if (pct < 50) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (pct < 85) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Top title banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Warehouse & Yard Administration</h2>
        <p className="text-sm text-slate-400 font-light mt-0.5">Allocate cargo zones, track physical occupancy, and audit damaged goods inventories</p>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
          {/* Main Grid: Warehouse Directory & visual mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Warehouse Directory cards */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider select-none">Warehouse Directory</h3>
              <div className="space-y-3.5">
                {warehouses.map(wh => {
                  const utilPct = Math.round((wh.occupiedSpace / wh.capacity) * 100);
                  const isSelected = wh.id === selectedWarehouseId;
                  
                  return (
                    <div 
                      key={wh.id}
                      onClick={() => handleWarehouseSelect(wh.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 glass-panel select-none
                        ${isSelected 
                          ? 'border-sky-500 bg-sky-500/5 shadow-lg shadow-sky-500/5' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className={`w-5 h-5 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{wh.name}</h4>
                        </div>
                        <span className={`px-2 py-0.5 text-sm font-bold uppercase rounded-md border ${getUtilBg(wh.occupiedSpace, wh.capacity)}`}>
                          {utilPct}% full
                        </span>
                      </div>

                      <p className="text-sm text-slate-400 mb-4">Type: {wh.type}</p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-slate-400 select-none">
                          <span>Occupied: {wh.occupiedSpace.toFixed(0)} Tons</span>
                          <span>Max: {wh.capacity} Tons</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${getUtilColor(wh.occupiedSpace, wh.capacity)}`} style={{ width: `${Math.min(100, utilPct)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Visual Slot Grid & Allocation list */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white">Yard Mapping Visualizer</h3>
                    <p className="text-sm text-slate-400 font-light mt-0.5">{activeWarehouse?.name}</p>
                  </div>
                  <Layers className="w-5 h-5 text-sky-500" />
                </div>

                {/* 2D Slot Visual Grid representation */}
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider select-none">Storage Slots Layout</h4>
                
                {activeWarehouse?.YardLocations?.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500 font-light">No yard location grid slots configured for this warehouse.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
                    {activeWarehouse?.YardLocations?.map((yard, idx) => {
                      const util = Math.round((yard.occupiedSpace / yard.capacity) * 100);
                      const isFull = util >= 95;
                      
                      return (
                        <div 
                          key={yard.id}
                          className={`p-3.5 rounded-xl border flex flex-col gap-1 select-none transition hover:scale-102
                            ${isFull 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                              : util > 50 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }
                          `}
                        >
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="font-bold text-sm">{yard.zoneCode}</span>
                          </div>
                          
                          <div className="mt-2 text-sm flex justify-between">
                            <span className="font-light">Util: {util}%</span>
                            <span className="font-medium">({yard.capacity - yard.occupiedSpace}T free)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Allocated Cargo list inside this warehouse */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider select-none">Active Cargo in Warehouse</h4>
                
                {activeWarehouse?.Cargoes?.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-2">No active cargo currently allocated to this warehouse.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1.5 text-sm font-light">
                    {activeWarehouse?.Cargoes?.map(cargo => (
                      <div key={cargo.id} className="py-2 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-bold text-sky-500">{cargo.cargoId}</span>
                          {cargo.binCode && (
                            <span className="text-xs text-slate-400 font-medium mt-0.5">Bin: {cargo.binCode}</span>
                          )}
                        </div>
                        <span>{cargo.weight} Tons</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/15">
                          {cargo.status === 'Customs Hold' ? 'On Hold' : cargo.status === 'Customs Approved' ? 'Cleared' : cargo.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Row 2: Damaged Cargo reporting form & list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* File Damage Report Form */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
              <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                Report Damaged Cargo
              </h3>

              <form onSubmit={handleReportDamage} className="space-y-4 text-sm select-none">
                
                {/* Select Cargo */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Cargo in Yard</label>
                  <select
                    value={selectedCargoId}
                    onChange={(e) => setSelectedCargoId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                  >
                    <option value="">-- Choose Cargo --</option>
                    {activeCargoes.map(c => (
                      <option key={c.id} value={c.cargoId}>
                        {c.cargoId} ({c.cargoType} - {c.weight}T)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Damage description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Remarks / Damage Scope</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Corner dent on Container seal, wet spots on cement bags bulk carrier, etc."
                    value={damageRemarks}
                    onChange={(e) => setDamageRemarks(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || activeCargoes.length === 0}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-rose-600/10 border border-rose-500/10"
                >
                  <AlertOctagon className="w-4 h-4" />
                  {submitLoading ? 'Submitting Report...' : 'Log Damage Report'}
                </button>

              </form>
            </div>

            {/* Damaged Cargo Reports list */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
              
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Active Yard Damage Reports
                </h3>

                {damagedCargoes.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500 font-light">No damaged cargo reports on file. Yard is fully clear.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-1 text-sm font-light">
                    {damagedCargoes.map(cargo => (
                      <div key={cargo.id} className="py-2.5 flex justify-between items-start gap-4 hover:bg-rose-500/5 px-2 rounded-xl transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-500">{cargo.cargoId}</span>
                            <span className="text-slate-500">({cargo.cargoType})</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-350 leading-snug font-light italic">
                            Damage remarks: {cargo.damageRemarks}
                          </p>
                        </div>
                        <div className="text-right text-sm text-slate-400 shrink-0 select-none">
                          <span className="block font-medium text-slate-600 dark:text-slate-200">{cargo.Warehouse?.name || 'Unassigned'}</span>
                          <span>Logged: {new Date(cargo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default WarehouseManagement;
