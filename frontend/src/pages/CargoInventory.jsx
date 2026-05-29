import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

const CargoInventory = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  // Lists & pagination
  const [cargoes, setCargoes] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showUnloadModal, setShowUnloadModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [unloadingCargo, setUnloadingCargo] = useState(null);

  // Upload Form State
  const [newCargoId, setNewCargoId] = useState('');
  const [newCargoType, setNewCargoType] = useState('Container');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newWeight, setNewWeight] = useState(0.0);
  const [newConsignee, setNewConsignee] = useState('');
  const [manifestFile, setManifestFile] = useState(null);

  // Allocation Form State
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedYardLocId, setSelectedYardLocId] = useState('');
  const [yardLocations, setYardLocations] = useState([]);
  const [binCodeVal, setBinCodeVal] = useState('');
  const [unloadEquipment, setUnloadEquipment] = useState('Cranes');

  const fetchCargoes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/cargo', {
        params: {
          search,
          type: typeFilter,
          status: statusFilter,
          page: currentPage,
          limit: 8
        }
      });
      setCargoes(res.data.cargoes);
      setTotalItems(res.data.totalItems);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch cargo inventory:', error);
      triggerToast('Failed to load inventory', 'Could not sync cargo lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargoes();
  }, [currentPage, typeFilter, statusFilter]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCargoes();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    // Slight timeout to let state clear
    setTimeout(fetchCargoes, 50);
  };

  // 1. Action: Unload Cargo Submit (Port Ops / Admin)
  const handleUnloadCargoSubmit = async (e) => {
    e.preventDefault();
    if (!unloadingCargo) return;

    try {
      await API.put(`/cargo/${unloadingCargo.id}/unload`, {
        unloadingEquipment: unloadEquipment
      });
      triggerToast('Cargo Unloaded', `Cargo ${unloadingCargo.cargoId} unloaded successfully using ${unloadEquipment}.`, 'success');
      setShowUnloadModal(false);
      setUnloadingCargo(null);
      fetchCargoes();
    } catch (error) {
      triggerToast('Unload Failed', error.response?.data?.message || 'Failed to register unloading.', 'error');
    }
  };

  // Open Allocation modal (Warehouse Manager / Admin)
  const openAllocateModal = async (cargo) => {
    setSelectedCargo(cargo);
    setBinCodeVal(cargo.binCode || '');
    try {
      const res = await API.get('/warehouses');
      setWarehouses(res.data);
      if (res.data.length > 0) {
        setSelectedWarehouseId(res.data[0].id);
        setYardLocations(res.data[0].YardLocations || []);
        if (res.data[0].YardLocations?.length > 0) {
          setSelectedYardLocId(res.data[0].YardLocations[0].id);
        } else {
          setSelectedYardLocId('');
        }
      }
      setShowAllocateModal(true);
    } catch (error) {
      triggerToast('Error loading locations', 'Failed to retrieve warehouse capacities.', 'error');
    }
  };

  // Sync Yard locations dropdown on warehouse change
  useEffect(() => {
    if (selectedWarehouseId) {
      const wh = warehouses.find(w => w.id === parseInt(selectedWarehouseId));
      if (wh) {
        setYardLocations(wh.YardLocations || []);
        if (wh.YardLocations?.length > 0) {
          setSelectedYardLocId(wh.YardLocations[0].id);
        } else {
          setSelectedYardLocId('');
        }
      }
    }
  }, [selectedWarehouseId]);

  // 2. Action: Allocate Storage Space (Warehouse Manager / Admin)
  const handleAllocateStorage = async (e) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;

    try {
      await API.put(`/cargo/${selectedCargo.id}/allocate`, {
        warehouseId: parseInt(selectedWarehouseId),
        yardLocationId: selectedYardLocId ? parseInt(selectedYardLocId) : null,
        binCode: binCodeVal
      });

      triggerToast('Storage Assigned', `Cargo ${selectedCargo.cargoId} allocated successfully.`, 'success');
      setShowAllocateModal(false);
      setSelectedCargo(null);
      setBinCodeVal('');
      fetchCargoes();
    } catch (error) {
      triggerToast('Allocation Failed', error.response?.data?.message || 'Failed to allocate warehouse space.', 'error');
    }
  };

  // 3. Action: Upload Manifest (Shipping Agent / Admin)
  const handleUploadManifestSubmit = async (e) => {
    e.preventDefault();

    if (!newCargoId || !newConsignee || newWeight <= 0) {
      triggerToast('Validation Error', 'Please fill all manifest details with valid entries.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('cargoId', newCargoId);
    formData.append('cargoType', newCargoType);
    formData.append('quantity', newQuantity);
    formData.append('weight', newWeight);
    formData.append('consignee', newConsignee);
    if (manifestFile) {
      formData.append('manifest', manifestFile);
    }

    try {
      await API.post('/cargo/manifest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      triggerToast('Manifest Registered', `Cargo manifest ${newCargoId} registered successfully.`, 'success');
      setShowUploadModal(false);
      // Reset Form fields
      setNewCargoId('');
      setNewCargoType('Container');
      setNewQuantity(1);
      setNewWeight(0.0);
      setNewConsignee('');
      setManifestFile(null);
      fetchCargoes();
    } catch (error) {
      triggerToast('Upload Failed', error.response?.data?.message || 'Failed to submit cargo manifest.', 'error');
    }
  };

  // Status Badge configurations
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Manifest Uploaded':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">MANIFEST UPLOADED</span>;
      case 'Unloaded':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">UNLOADED</span>;
      case 'Allocated':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">ALLOCATED</span>;
      case 'Customs Hold':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">ON HOLD</span>;
      case 'Customs Approved':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">CLEARED</span>;
      case 'Gate Pass Generated':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">GATE PASS ACTIVE</span>;
      case 'Dispatched':
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">DISPATCHED</span>;
      default:
        return <span className="px-2 py-1 text-sm font-bold rounded-lg bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and top buttons */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Cargo Manifest Database</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Browse active shipments, track terminal status, and register manifest declarations</p>
        </div>
        {['Shipping Agent', 'Super Admin'].includes(user?.role) && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
          >
            <Plus className="w-4 h-4" />
            Upload Cargo Manifest
          </button>
        )}
      </div>

      {/* Search and filtering bars */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
          <input
            type="text"
            placeholder="Search Cargo ID, Consignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-880 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-200 transition"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
        </form>

        {/* Type Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-300 transition appearance-none"
          >
            <option value="">All Cargo Categories</option>
            <option value="Container">Container</option>
            <option value="Bulk">Bulk</option>
            <option value="Liquid">Liquid</option>
            <option value="Break Bulk">Break Bulk</option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4.5 h-4.5" />
          </span>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-300 transition appearance-none"
          >
            <option value="">All Workflow States</option>
            <option value="Manifest Uploaded">Manifest Uploaded</option>
            <option value="Unloaded">Unloaded</option>
            <option value="Allocated">Allocated</option>
            <option value="Customs Hold">On Hold</option>
            <option value="Customs Approved">Cleared</option>
            <option value="Gate Pass Generated">Gate Pass Active</option>
            <option value="Dispatched">Dispatched</option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-4.5 h-4.5" />
          </span>
        </div>

        {/* Reset button */}
        <button 
          onClick={handleResetFilters}
          className="md:col-span-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition"
        >
          Reset
        </button>

      </div>

      {/* Cargo Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden glass-panel">
        
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : cargoes.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-450 font-light">No cargo records found matching the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                  <th className="p-4">Cargo ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Weight (Tons)</th>
                  <th className="p-4">Consignee</th>
                  <th className="p-4">Assigned Yard</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                {cargoes.map(cargo => (
                  <tr key={cargo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold text-sky-500 dark:text-sky-400">{cargo.cargoId}</td>
                    <td className="p-4">{cargo.cargoType}</td>
                    <td className="p-4">{cargo.weight.toFixed(1)}</td>
                    <td className="p-4 max-w-[150px] truncate" title={cargo.consignee}>{cargo.consignee}</td>
                    <td className="p-4 max-w-[180px] truncate text-slate-500 dark:text-slate-400">
                      {cargo.Warehouse?.name || <span className="italic text-slate-400">Unallocated</span>}
                    </td>
                    <td className="p-4">{getStatusBadge(cargo.status)}</td>
                    <td className="p-4 text-right shrink-0">
                      {/* Action 1: Unload Cargo (Ops / Admin only, only if Manifest Uploaded) */}
                      {['Port Operations Officer', 'Super Admin'].includes(user?.role) && cargo.status === 'Manifest Uploaded' && (
                        <button
                          onClick={() => {
                            setUnloadingCargo(cargo);
                            setUnloadEquipment('Cranes');
                            setShowUnloadModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition cursor-pointer"
                        >
                          Unload Cargo
                        </button>
                      )}

                      {/* Action 2: Allocate Storage (Warehouse Manager / Admin only, only if Unloaded) */}
                      {['Warehouse Manager', 'Super Admin'].includes(user?.role) && cargo.status === 'Unloaded' && (
                        <button
                          onClick={() => openAllocateModal(cargo)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition"
                        >
                          Allocate Storage
                        </button>
                      )}

                      {/* Fallback indicator */}
                      {!((['Port Operations Officer', 'Super Admin'].includes(user?.role) && cargo.status === 'Manifest Uploaded') ||
                        ((['Warehouse Manager', 'Super Admin'].includes(user?.role) && cargo.status === 'Unloaded'))) && (
                        <span className="text-sm text-slate-400 italic">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <span className="text-sm text-slate-400 font-light">
              Showing page <strong className="text-slate-600 dark:text-slate-200">{currentPage}</strong> of <strong className="text-slate-600 dark:text-slate-200">{totalPages}</strong> ({totalItems} items total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 disabled:opacity-40 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 disabled:opacity-40 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Upload Cargo Manifest */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">New Manifest Declaration</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleUploadManifestSubmit} className="space-y-4 text-sm select-none">
              
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRG-NMPA-010"
                  value={newCargoId}
                  onChange={(e) => setNewCargoId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Category</label>
                  <select
                    value={newCargoType}
                    onChange={(e) => setNewCargoType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300"
                  >
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Consignee Client</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MRPL India"
                    value={newConsignee}
                    onChange={(e) => setNewConsignee(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Quantity (Units/TEU)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tonnage (Metric Tons)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.1"
                    placeholder="0.00"
                    value={newWeight || ''}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Manifest File Drop */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Manifest PDF</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition flex flex-col items-center gap-1.5 relative">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500 font-medium">
                    {manifestFile ? manifestFile.name : 'Click to browse or drop files (.pdf, .csv, .xls)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.csv,.xls,.xlsx"
                    onChange={(e) => setManifestFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg hover:shadow-sky-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Manifest
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Allocate Storage Space */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Allocate Storage Space</h3>
                <span className="text-sm text-slate-400 font-light">Assigning Cargo <strong className="text-sky-500">{selectedCargo?.cargoId}</strong> ({selectedCargo?.weight} Tons)</span>
              </div>
              <button onClick={() => { setShowAllocateModal(false); setSelectedCargo(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleAllocateStorage} className="space-y-4 text-sm select-none">
              
              {/* Select Warehouse */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Warehouse / Terminal</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} - ({w.availableSpace.toFixed(0)}T left / type: {w.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Yard location section if exists */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Yard Location / Zone Slot
                </label>
                {yardLocations.length === 0 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No specific zone racks configured. General storage applies.</span>
                  </div>
                ) : (
                  <select
                    value={selectedYardLocId}
                    onChange={(e) => setSelectedYardLocId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                  >
                    {yardLocations.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.zoneCode} - (Capacity: {y.capacity}T / Occupied: {y.occupiedSpace}T)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bin Code / Stacking Position input */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bin / Stacking Position (Container Stacking)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Row-4, Tier-3, Level-2"
                  value={binCodeVal}
                  onChange={(e) => setBinCodeVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAllocateModal(false); setSelectedCargo(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={warehouses.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg hover:shadow-indigo-500/10"
                >
                  <Layers className="w-4 h-4" />
                  Allocate Bay
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Select Unloading Equipment */}
      {showUnloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Register Cargo Unloading</h3>
              <button onClick={() => { setShowUnloadModal(false); setUnloadingCargo(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleUnloadCargoSubmit} className="space-y-4 text-sm select-none">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Unloading Equipment</label>
                <select
                  value={unloadEquipment}
                  onChange={(e) => setUnloadEquipment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                >
                  <option value="Cranes">Gantry Cranes</option>
                  <option value="Reach stackers">Reach Stackers</option>
                  <option value="Forklifts">Heavy Forklifts</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowUnloadModal(false); setUnloadingCargo(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-505/10 animate-pulse-slow"
                >
                  Confirm Unload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CargoInventory;
