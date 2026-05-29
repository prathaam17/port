import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Activity, 
  LayoutGrid,
  Users,
  Crown,
  Settings,
  Warehouse,
  FileCheck,
  Key,
  IndianRupee,
  Ship,
  Eye,
  EyeOff
} from 'lucide-react';
import heroImage from '../assets/hero.jpg';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Query parameter alert if session expired
  useEffect(() => {
    if (location.search.includes('expired=true')) {
      triggerToast('Session Expired', 'Your connection expired. Please authenticate again.', 'error');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      triggerToast('Missing Fields', 'Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      triggerToast('Access Authorized', `Welcome back, ${username}!`, 'success');
      navigate(from, { replace: true });
    } else {
      triggerToast('Login Failed', result.error, 'error');
    }
  };

  // Test account shortcut helper
  const handleRoleAutofill = async (roleName, u, p) => {
    setUsername(u);
    setPassword(p);
    triggerToast('Autofill Active', `Configured credentials for ${roleName}.`, 'info');
    
    // Slight timeout to show values before auto-submitting
    setTimeout(async () => {
      setLoading(true);
      const result = await login(u, p);
      setLoading(false);
      if (result.success) {
        triggerToast('Access Authorized', `Logged in as ${roleName} (${u})`, 'success');
        navigate(from, { replace: true });
      } else {
        triggerToast('Login Failed', result.error, 'error');
      }
    }, 400);
  };

  const testAccounts = [
    { label: 'Shipping Agent', u: 'shipping', p: 'password123', icon: Ship },
    { label: 'Operations', u: 'ops', p: 'password123', icon: Settings },
    { label: 'Warehouse', u: 'warehouse', p: 'password123', icon: Warehouse },
    { label: 'Customs', u: 'customs', p: 'password123', icon: FileCheck },
    { label: 'Finance', u: 'finance', p: 'password123', icon: IndianRupee },
    { label: 'Gate Officer', u: 'gate', p: 'password123', icon: Key },
    { label: 'Super Admin', u: 'admin', p: 'password123', icon: Crown }
  ];


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100/50 flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Main Container Card */}
      <div className="max-w-[1200px] w-full grid md:grid-cols-12 bg-white rounded-[28px] overflow-hidden shadow-2xl border border-slate-200/80">
        
        {/* Left Side: Branding / Seaport Illustration info with FULL COVER BACKGROUND */}
        <div 
          className="md:col-span-6 relative p-8 md:p-12 flex flex-col justify-between text-white bg-cover bg-center min-h-[550px] md:min-h-[700px] overflow-hidden"
          style={{ backgroundImage: `url(${heroImage})` }}
        >

          {/* Top Row: Official NMPA logo banner */}
          <div className="relative z-10 select-none mb-8">
            <img 
              src="/nmpa_logo.png" 
              alt="New Mangalore Port Authority" 
              className="h-36 w-auto object-contain max-w-[380px]" 
            />
          </div>

          {/* Middle Section: Titles and Features */}
          <div className="relative z-10 flex-grow flex flex-col justify-start pt-2">
            <h2 className="text-4xl md:text-[40px] font-extrabold leading-tight text-white mb-2 tracking-tight">
              Enterprise Port Logistics <br />
              <span className="text-amber-200">Management System</span>
            </h2>
            
            {/* Gold Accent Line */}
            <div className="w-16 h-[3.5px] bg-amber-400 mb-6 rounded-full"></div>

            <p className="text-sm md:text-[15px] text-slate-200 leading-relaxed font-light mb-8 max-w-lg">
              Secure administrative terminal for ship docking, customs clearance approval, yard cargo tracking, gate passes, and invoicing for the New Mangalore Port Authority.
            </p>

            {/* Horizontal Feature Pills Block matching reference image exactly */}
            <div className="grid grid-cols-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md divide-x divide-white/20 p-4 mb-8">
              {/* Secure Network Access */}
              <div className="flex items-center gap-3 px-1.5 sm:px-3">
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">Secure</span>
                  <span className="text-[10px] text-slate-200 leading-tight">Network Access</span>
                </div>
              </div>
              {/* Real-time Port Operations */}
              <div className="flex items-center gap-3 px-2 sm:px-4">
                <Activity className="w-5 h-5 text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">Real-time</span>
                  <span className="text-[10px] text-slate-200 leading-tight">Port Operations</span>
                </div>
              </div>
              {/* Role-based Dashboard */}
              <div className="flex items-center gap-3 px-2 sm:px-4">
                <Users className="w-5 h-5 text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">Role-based</span>
                  <span className="text-[10px] text-slate-200 leading-tight">Dashboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Authorization Lock Warning */}
          <div className="relative z-10 mt-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#004899] border border-sky-400/20 text-white rounded-lg text-xs font-bold shadow-lg">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Authorized Network Access Only</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal Authentication</h3>
              <p className="text-sm text-slate-500 mt-1.5 font-light">Connect your terminal credentials below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Username field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
                  Username
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-10 bg-white border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 text-sm transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 transition"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Remember Me</span>
                </label>
                <a href="#forgot" className="text-xs text-sky-600 hover:text-sky-700 font-bold hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-sky-600/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Decrypting Session...' : 'Authenticate Terminals'}
              </button>
            </form>

            {/* Quick Login Divider */}
            <div className="relative my-8 flex items-center justify-center select-none">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-3 bg-white text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Or Login With Role
              </span>
            </div>

            {/* Autofill quick links grid (3-column layout matching mockup) */}
            <div className="grid grid-cols-3 gap-3">
              {testAccounts.map((account, index) => {
                const IconComponent = account.icon;
                const isLast = index === 6;
                return (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => handleRoleAutofill(account.label, account.u, account.p)}
                    className={`flex items-center justify-center gap-2 px-2 py-3 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-500 rounded-xl text-xs font-bold text-slate-700 transition shadow-sm cursor-pointer
                      ${isLast ? 'col-start-2 col-span-1' : ''}
                    `}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{account.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer information */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span className="font-medium text-slate-500">Secure &bull; Reliable &bull; Efficient</span>
            </div>
            <span className="font-light">&copy; {new Date().getFullYear()} New Mangalore Port Authority</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
