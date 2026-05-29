import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Settings2, 
  Bell, 
  Terminal, 
  Key, 
  HardDrive, 
  Save, 
  CheckCircle,
  Copy
} from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [notifSound, setNotifSound] = useState(true);
  const [apiKey, setApiKey] = useState('NMPA_SECURE_TOKEN_503A120X902L');

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    triggerToast('Copied to Clipboard', 'System integration key copied successfully.', 'success');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    triggerToast('Settings Applied', 'Local terminal parameters updated successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Terminal Configurations & System Parameters</h2>
        <p className="text-sm text-slate-400 font-light mt-0.5">Customize notification channels and manage electronic data interchange (EDI) API integrations</p>
      </div>

      <div className="max-w-xl bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
        <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 select-none">
          <Settings2 className="w-5 h-5 text-sky-500" />
          Terminal settings
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-sm select-none">
          
          {/* Notification toggles */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Bell className="w-4 h-4 text-sky-500" />
              Operational Notifications
            </h4>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">System Audio Alerts</span>
                <span className="text-sm text-slate-450 mt-0.5 block font-light">Play audible chimes upon new customs clearance approvals</span>
              </div>
              <input 
                type="checkbox" 
                checked={notifSound}
                onChange={(e) => setNotifSound(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>


          {/* API Key management */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Key className="w-4 h-4 text-sky-500" />
              EDI API Integration credentials
            </h4>
            
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Integration Secret Token</span>
              <span className="text-sm text-slate-450 block font-light">Authenticate XML custom manifest interfaces</span>
              
              <div className="flex gap-2 items-center mt-2">
                <input 
                  type="text" 
                  readOnly
                  value={apiKey}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-slate-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Disk space indicators */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-4 h-4 text-sky-500" />
              Hardware status
            </h4>
            
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
              <div className="flex justify-between text-slate-450 font-bold">
                <span>Database Disk Occupancy (SQLite)</span>
                <span>4.2 MB of 10.0 GB</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '0.1%' }}></div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
          >
            <Save className="w-4 h-4" />
            Apply System Parameters
          </button>

        </form>
      </div>

    </div>
  );
};

export default Settings;
