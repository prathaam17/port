import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  ShieldAlert, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Edit3 
} from 'lucide-react';

const CustomsClearance = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState(null);
  
  const [statusVal, setStatusVal] = useState('Pending');
  const [remarksVal, setRemarksVal] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCustomsRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/customs');
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch customs requests:', error);
      triggerToast('Error', 'Failed to retrieve customs registry lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomsRequests();
  }, []);

  const openReviewModal = (clearance) => {
    setSelectedClearance(clearance);
    setStatusVal(clearance.status);
    setRemarksVal(clearance.remarks || '');
    setInspectionDate(clearance.inspectionScheduledAt ? new Date(clearance.inspectionScheduledAt).toISOString().slice(0, 16) : '');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!statusVal || !remarksVal) {
      triggerToast('Validation Error', 'Please choose a status and enter remarks.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.put(`/customs/${selectedClearance.id}`, {
        status: statusVal,
        remarks: remarksVal,
        inspectionScheduledAt: inspectionDate ? new Date(inspectionDate) : null
      });

      triggerToast('Customs Logged', `Clearance status updated to ${statusVal} for Cargo ${selectedClearance.Cargo.cargoId}.`, 'success');
      setShowReviewModal(false);
      setSelectedClearance(null);
      fetchCustomsRequests();
    } catch (error) {
      triggerToast('Review Failed', error.response?.data?.message || 'Failed to update customs state.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">PENDING VERIFICATION</span>;
      case 'Approved':
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CLEARED</span>;
      case 'Rejected':
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">VERIFICATION FAILED</span>;
      case 'On Hold':
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">ON HOLD</span>;
      case 'Under Inspection':
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">UNDER INSPECTION</span>;
      default:
        return <span className="inline-block whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Customs Clearance & Document Audit</h2>
        <p className="text-sm text-slate-400 font-light mt-0.5">Audit cargo manifests, review phytosanitary/import certifications, schedule inspections, and sign dispatch releases</p>
      </div>

      {/* Customs Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden glass-panel">
        
        {loading ? (
          <div className="p-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-450 font-light">No customs clearance requests submitted.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                  <th className="p-4">Cargo Code</th>
                  <th className="p-4">Consignee Client</th>
                  <th className="p-4">Bill of Lading File</th>
                  <th className="p-4">Clearance status</th>
                  <th className="p-4">Inspection Date</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                {requests.map(clearance => (
                  <tr key={clearance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold text-sky-500 dark:text-sky-400">{clearance.Cargo?.cargoId || 'N/A'}</td>
                    <td className="p-4 truncate max-w-[120px]" title={clearance.Cargo?.consignee}>{clearance.Cargo?.consignee || 'N/A'}</td>
                    <td className="p-4">
                      <a
                        href={`http://localhost:5000/uploads/${clearance.documentUrl || 'manifest_attached.pdf'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sky-500 dark:text-sky-400 cursor-pointer font-medium hover:underline w-fit"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{clearance.documentUrl || 'manifest_attached.pdf'}</span>
                      </a>
                    </td>
                    <td className="p-4">{getStatusBadge(clearance.status)}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {clearance.inspectionScheduledAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          <span>{new Date(clearance.inspectionScheduledAt).toLocaleDateString()} {new Date(clearance.inspectionScheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="p-4 max-w-[200px] truncate italic" title={clearance.remarks}>{clearance.remarks || '-'}</td>
                    <td className="p-4 text-right shrink-0">
                      {/* Action: Open review modal (Customs Officer or Admin) */}
                      {['Customs Officer', 'Super Admin'].includes(user?.role) && clearance.status !== 'Approved' ? (
                        <button
                          onClick={() => openReviewModal(clearance)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition ml-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          Process Review
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Customs Audit Panel</h3>
                <span className="text-sm text-slate-400 font-light">Auditing Cargo: <strong className="text-sky-500">{selectedClearance?.Cargo?.cargoId}</strong> ({selectedClearance?.Cargo?.cargoType})</span>
              </div>
              <button onClick={() => { setShowReviewModal(false); setSelectedClearance(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-sm select-none">
              
              {/* Set Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Verification Determination</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300 font-bold"
                >
                  <option value="Pending">Awaiting Physical Inspection (Pending)</option>
                  <option value="Approved">Release Authorized (Cleared / Approve)</option>
                  <option value="Rejected">Access Denied / Quarantined (Reject)</option>
                  <option value="On Hold">Document Discrepancy (On Hold)</option>
                  <option value="Under Inspection">Physical/Safety Check (Under Inspection)</option>
                </select>
              </div>

              {/* Set Inspection Date/Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Schedule Inspection Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                />
              </div>

              {/* Remarks / Review Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Inspector Remarks</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Phytosanitary seals checked and approved. Wood packaging heat treatment stamp verified."
                  value={remarksVal}
                  onChange={(e) => setRemarksVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {statusVal === 'Approved' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm leading-snug">
                    <strong>Important:</strong> Approving customs clearance automatically transitions cargo status to "Customs Approved" and creates a storage invoice in the billing database.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowReviewModal(false); setSelectedClearance(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-500/10"
                >
                  {submitLoading ? 'Saving Review...' : 'Sign and Apply'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomsClearance;
