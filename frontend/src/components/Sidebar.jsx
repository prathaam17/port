import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Ship, 
  Warehouse, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  FileSpreadsheet, 
  Users2, 
  Settings2,
  Anchor
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  // Define sidebar links configurations
  const allLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Customs Officer', 'Gate Officer', 'Finance', 'Shipping Agent'] },
    { to: '/cargo', label: 'Cargo Inventory', icon: Ship, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Shipping Agent'] },
    { to: '/shipping-portal', label: 'Shipping Agent Portal', icon: Anchor, roles: ['Super Admin', 'Shipping Agent'] },
    { to: '/warehouse', label: 'Warehouse / Yard', icon: Warehouse, roles: ['Super Admin', 'Warehouse Manager'] },
    { to: '/customs', label: 'Customs Clearance', icon: ShieldAlert, roles: ['Super Admin', 'Customs Officer'] },
    { to: '/gate', label: 'Gate Operations', icon: Activity, roles: ['Super Admin', 'Gate Officer', 'Shipping Agent'] },
    { to: '/billing', label: 'Billing & Invoices', icon: FileSpreadsheet, roles: ['Super Admin', 'Finance', 'Shipping Agent'] },
    { to: '/reports', label: 'Reports & Stats', icon: TrendingUp, roles: ['Super Admin', 'Warehouse Manager', 'Customs Officer', 'Gate Officer', 'Finance', 'Shipping Agent'] },
    { to: '/users', label: 'User Directory', icon: Users2, roles: ['Super Admin'] },
    { to: '/settings', label: 'Settings', icon: Settings2, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Customs Officer', 'Gate Officer', 'Finance', 'Shipping Agent'] }
  ];

  // Filter links for the logged-in user
  const userLinks = allLinks.filter(link => link.roles.includes(user.role));

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen pt-32 transition-all duration-300 bg-white border-r border-slate-200 text-slate-600 no-print
      ${isOpen ? 'w-64' : 'w-20'}
    `}>
      <div className="h-full px-3 py-4 overflow-y-auto flex flex-col justify-between">
        <ul className="space-y-2 font-medium">
          {userLinks.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className="w-full block"
                >
                  {({ isActive }) => (
                    <div className={`flex items-center p-3 transition-all duration-200 group
                      ${isActive 
                        ? 'bg-sky-50 text-sky-700 font-bold border-l-4 border-sky-600 rounded-r-xl rounded-l-none shadow-sm' 
                        : 'hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent rounded-xl'
                      }
                    `}>
                      <Icon className={`w-5 h-5 transition duration-75 
                        group-hover:scale-110 ${isActive ? 'text-sky-600' : 'text-slate-500'}
                      `} />
                      <span className={`ms-3 transition-opacity duration-300 truncate
                        ${isOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}
                      `}>
                        {link.label}
                      </span>
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* NMPA Badge footer */}
        <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 transition-all duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 p-0 overflow-hidden border-none'}
        `}>
          <Anchor className="w-6 h-6 text-sky-600" />
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">Seaport Terminal</span>
            <span className="text-sm font-semibold text-slate-600">NMPA v1.2</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
