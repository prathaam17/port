import React, { useContext } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
        <span className="mt-4 font-semibold tracking-wider text-sky-600">CONNECTING TO NMPA NETWORK...</span>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl text-rose-500 font-bold">!</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Security Override Required</h1>
        <p className="text-slate-500 max-w-md mb-6">
          Your current session role (<strong className="text-sky-600">{user.role}</strong>) does not hold authorization clearances for the requested terminal directory.
        </p>
        <Link to="/" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-semibold text-white transition">
          Return to Hub Terminal
        </Link>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
const _unused = Link;
