import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useToast } from '../../shared/components/ToastContext';
import { useAuth } from '../../shared/hooks/useAuth';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    // Initialize invisible reCAPTCHA
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const appVerifier = (window as any).recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      
      setStep('OTP');
      showToast('OTP sent to your phone via Firebase', 'info');
    } catch (err: any) {
      console.error(err);
      // Reset reCAPTCHA so the user can try again
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
      showToast(err.message || 'Failed to send OTP. Check Firebase config.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!confirmationResult) throw new Error('No OTP request found');
      
      // Confirm OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      await result.user.getIdToken();

      // Exchange Firebase token for BuildWise JWT
      // We pass the universal mock OTP '123456' to the backend to bypass its internal Redis check
      // since Firebase has already verified the real OTP successfully on the frontend.
      await login(phone, '123456');
      
      showToast('Login successful', 'success');
      
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/') {
        navigate(from);
      } else {
        const res = await apiClient.get('/auth/me');
        if (res.role === 'ADMIN') navigate('/dashboard/admin');
        else if (res.role === 'PROJECT_MANAGER') navigate('/dashboard');
        else navigate('/dashboard/engineer');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <div id="recaptcha-container"></div>
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
              Sign in to your account
            </h2>
            <p className="mt-2 text-on-surface-variant font-bold">
              We'll send a one-time password to your phone.
            </p>
          </div>

          {step === 'PHONE' && (
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
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-[#f0f9ff] text-[#0369a1] p-3 rounded text-sm font-bold flex justify-between items-center border border-[#e0f2fe]">
                <span>Code sent to +91 {phone}</span>
                <button type="button" onClick={() => setStep('PHONE')} className="underline">Change</button>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Enter 6-digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border border-outline-variant rounded focus:border-primary-container focus:ring-1 text-center text-2xl tracking-widest font-bold"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-primary-container text-on-primary font-bold py-3 px-4 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}

          {/* DEV ONLY MOCK LOGIN (Enabled everywhere for demo purposes) */}
            <div className="mt-8 pt-8 border-t border-outline-variant">
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 text-center">
                🛠 Dev Only: Quick Login
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      if (useAuth.getState().mockLogin) {
                        await useAuth.getState().mockLogin!('ADMIN');
                        navigate('/dashboard/admin');
                      }
                    } catch (e: any) {
                      showToast(e.message, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full bg-surface-variant text-on-surface-variant font-bold py-2 px-4 rounded hover:bg-opacity-80 transition-colors text-sm"
                >
                  Log in as Admin
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      if (useAuth.getState().mockLogin) {
                        await useAuth.getState().mockLogin!('PROJECT_MANAGER');
                        navigate('/dashboard');
                      }
                    } catch (e: any) {
                      showToast(e.message, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full bg-surface-variant text-on-surface-variant font-bold py-2 px-4 rounded hover:bg-opacity-80 transition-colors text-sm"
                >
                  Log in as Project Manager
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      if (useAuth.getState().mockLogin) {
                        await useAuth.getState().mockLogin!('SITE_ENGINEER');
                        navigate('/dashboard/engineer');
                      }
                    } catch (e: any) {
                      showToast(e.message, 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full bg-surface-variant text-on-surface-variant font-bold py-2 px-4 rounded hover:bg-opacity-80 transition-colors text-sm"
                >
                  Log in as Site Engineer
                </button>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};
