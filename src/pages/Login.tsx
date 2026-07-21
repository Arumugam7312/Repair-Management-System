import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, ShieldAlert, KeyRound, LogIn, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), rememberMe })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid email or password sequence');
      }

      // Save token and invoke login success handler
      localStorage.setItem('repairhub_token', data.token);
      onLoginSuccess(data.user, data.token);

      // Role-based redirection
      if (data.user.role === 'Customer') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'Login credentials mismatch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="staff-login-container">
      <div className="max-w-md w-full space-y-8 bg-white border border-gray-200 p-8 rounded-2xl shadow-xl">
        
        {/* Title Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 font-sans font-bold text-2xl tracking-tight" id="login-logo">
            <Wrench className="h-7 w-7 text-blue-600" />
            <span className="text-gray-900 font-extrabold">RepairHub</span>
            <span className="bg-blue-600 text-white text-[10px] uppercase px-2 py-0.5 rounded-sm tracking-widest font-bold">Pro</span>
          </Link>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Staff Console Login</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Access repair diagnostics, workshop inventory logs, billing invoices, and financial reports.
          </p>
        </div>

        {/* Demo playtest credentials helper */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-blue-800 uppercase tracking-wider text-[10px]">
            <KeyRound className="h-4 w-4" />
            <span>Developer Sandbox Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-gray-650">
            <div>
              <span className="font-semibold text-gray-900 block">Admin Role:</span>
              <span className="font-mono bg-blue-100/50 px-1 py-0.5 rounded">admin@repairhubpro.com</span>
              <span className="block text-[10px]">Pass: <code className="font-bold">admin123</code></span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">Technician Role:</span>
              <span className="font-mono bg-blue-100/50 px-1 py-0.5 rounded">tech1@repairhubpro.com</span>
              <span className="block text-[10px]">Pass: <code className="font-bold">tech123</code></span>
            </div>
          </div>
        </div>

        {/* Login form */}
        <form className="space-y-6" onSubmit={handleStaffLogin} id="staff-login-form">
          {error && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-xs text-red-700 flex items-start space-x-2">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@repairhubpro.com"
                className="w-full bg-white border border-gray-250 rounded-lg px-3.5 py-2.5 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                id="login-email-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Secure Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-250 rounded-lg px-3.5 py-2.5 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                id="login-password-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded-sm"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-gray-750">
                Remember my session
              </label>
            </div>

            <div className="text-xs">
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-500" onClick={() => alert('Demo Reset Token sent to console logs.')}>
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
            id="login-submit-btn"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <Link to="/track" className="text-xs font-semibold text-blue-600 hover:text-blue-500">
            Are you a customer? Track repair status here
          </Link>
        </div>

      </div>
    </div>
  );
}
