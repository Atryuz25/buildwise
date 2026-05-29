import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useToast } from '../../shared/components/ToastContext';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Register state
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'SETUP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('SITE_ENGINEER');
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.success && res.user) {
        localStorage.setItem('userRole', res.user.role.toLowerCase());
        localStorage.setItem('userId', res.user.id);
        showToast('Login successful', 'success');
        
        // Route according to exact role
        if (res.user.role === 'ADMIN') navigate('/dashboard/admin');
        else if (res.user.role === 'PROJECT_MANAGER') navigate('/dashboard');
        else navigate('/dashboard/engineer');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register/send-otp', { phone });
      setStep('OTP');
      showToast('OTP sent to your phone', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register/verify', {
        phone, otp, email, password, name, role
      });
      if (res.success && res.user) {
        localStorage.setItem('userRole', res.user.role.toLowerCase());
        localStorage.setItem('userId', res.user.id);
        showToast('Registration successful', 'success');
        
        // Route according to exact role
        if (res.user.role === 'ADMIN') navigate('/dashboard/admin');
        else if (res.user.role === 'PROJECT_MANAGER') navigate('/dashboard');
        else navigate('/dashboard/engineer');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left half: Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-center px-16 text-on-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 industrial-grid"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-on-primary rounded flex items-center justify-center text-primary font-bold text-xl">BW</div>
            <h1 className="font-page-title text-4xl font-bold">BuildWise</h1>
          </div>
          <p className="text-2xl font-bold mb-12 text-primary-fixed-dim">Reduce material wastage on every project.</p>
          
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[32px] text-secondary">precision_manufacturing</span>
              <div>
                <h3 className="font-bold text-lg">Steel Optimization</h3>
                <p className="text-on-primary-fixed-variant">FFD algorithms to minimize scrap to under 5%.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[32px] text-secondary">calculate</span>
              <div>
                <h3 className="font-bold text-lg">Exact Concrete Estimates</h3>
                <p className="text-on-primary-fixed-variant">Stop over-ordering. Calculate exact needs instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right half: Auth Form */}
      <div className="w-full lg:w-1/2 bg-surface-lowest flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          
          <div className="text-center">
            <h2 className="font-page-title text-3xl font-bold text-primary">
              {mode === 'LOGIN' ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <div className="mt-2 text-sm flex justify-center gap-2">
              <button 
                className={`font-bold pb-1 ${mode === 'LOGIN' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => setMode('LOGIN')}
              >
                Login
              </button>
              <span className="text-on-surface-variant">or</span>
              <button 
                className={`font-bold pb-1 ${mode === 'REGISTER' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => { setMode('REGISTER'); setStep('PHONE'); }}
              >
                Register
              </button>
            </div>
          </div>

          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-outline-variant rounded focus:border-primary-container focus:ring-1 text-lg font-bold"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-outline-variant rounded focus:border-primary-container focus:ring-1 text-lg font-bold"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="mt-8 border-t border-outline-variant pt-6">
                <p className="text-sm font-bold text-on-surface-variant mb-4 text-center">Quick Login (Demo)</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => { setEmail('admin@buildwise.com'); setPassword('password123'); }} className="py-2 px-2 text-xs font-bold border border-outline-variant rounded hover:bg-surface-variant text-primary">Admin</button>
                  <button type="button" onClick={() => { setEmail('pm@buildwise.com'); setPassword('password123'); }} className="py-2 px-2 text-xs font-bold border border-outline-variant rounded hover:bg-surface-variant text-primary">PM</button>
                  <button type="button" onClick={() => { setEmail('engineer@buildwise.com'); setPassword('password123'); }} className="py-2 px-2 text-xs font-bold border border-outline-variant rounded hover:bg-surface-variant text-primary">Engineer</button>
                </div>
              </div>
            </form>
          )}

          {mode === 'REGISTER' && step === 'PHONE' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Phone Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-on-surface-variant font-bold">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-outline-variant rounded focus:border-primary-container focus:ring-1 text-lg font-bold"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={phone.length !== 10 || isLoading}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {mode === 'REGISTER' && step === 'OTP' && (
            <form onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) setStep('SETUP'); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Enter OTP sent to +91 {phone}</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border border-outline-variant rounded focus:border-primary-container focus:ring-1 text-center text-2xl font-bold tracking-[0.5em]"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={otp.length !== 6}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                Verify OTP
              </button>
            </form>
          )}

          {mode === 'REGISTER' && step === 'SETUP' && (
            <form onSubmit={handleSetupSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Full Name</label>
                <input type="text" required className="w-full px-3 py-2 border border-outline-variant rounded" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Email Address</label>
                <input type="email" required className="w-full px-3 py-2 border border-outline-variant rounded" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
                <input type="password" required minLength={6} className="w-full px-3 py-2 border border-outline-variant rounded" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Role</label>
                <select className="w-full px-3 py-2 border border-outline-variant rounded bg-surface" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="SITE_ENGINEER">Site Engineer</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
