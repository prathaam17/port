import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]); // Array of active toast objects

  // Helper to trigger a toast banner on screen
  const triggerToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Auto-remove toast after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await API.get('/reports/notifications');
      const data = res.data;
      
      // Calculate unread count
      const unreads = data.filter(n => !n.isRead && (n.roleTarget === 'All' || n.roleTarget === user.role));
      
      // Check if we received new notifications to trigger a toast
      if (notifications.length > 0 && data.length > 0) {
        const currentLatestId = notifications[0]?.id;
        const newItems = data.filter(n => n.id > currentLatestId && (n.roleTarget === 'All' || n.roleTarget === user.role));
        
        newItems.forEach(item => {
          triggerToast(item.title, item.message, 'info');
        });
      }
      
      setNotifications(data);
      setUnreadCount(unreads.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put('/reports/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      triggerToast('Notifications Cleared', 'All messages marked as read.', 'success');
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  // Start background poller if logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      toasts, 
      triggerToast, 
      removeToast, 
      markAllRead,
      refetch: fetchNotifications 
    }}>
      {children}
      
      {/* Dynamic Toast Portal Rendering */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full no-print">
        {toasts.map(t => (
          <div 
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`cursor-pointer p-4 rounded-xl shadow-xl flex flex-col gap-1 border transition-all duration-300 transform translate-y-0 hover:scale-102 hover:shadow-2xl animate-bounce-slow
              ${t.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : ''}
              ${t.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : ''}
              ${t.type === 'info' ? 'bg-sky-600/90 text-white border-sky-500' : ''}
            `}
          >
            <div className="flex justify-between items-center font-bold text-sm">
              <span>{t.title}</span>
              <button className="text-slate-800 opacity-60 hover:opacity-100 font-normal">×</button>
            </div>
            <p className="text-sm font-light">{t.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
