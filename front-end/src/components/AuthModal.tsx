import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Rocket, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: (user: any) => void;
}

type AuthView = 'login' | 'register' | 'email-confirmation';

export function AuthModal({ isOpen, onClose, onAuthChange }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const resetState = () => {
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const switchView = (v: AuthView) => {
    resetState();
    setView(v);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (authError) throw authError;
      onAuthChange(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
            phone: regPhone,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
      if (data.user && !data.session) {
        // Email confirmation required
        setView('email-confirmation');
      } else if (data.user) {
        onAuthChange(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ 
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 17, 40, 0.85)', 
            backdropFilter: 'blur(12px)' 
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(135deg, #0d1a3a 0%, #111827 100%)',
              border: '1px solid rgba(255,107,53,0.25)',
              borderRadius: '1.25rem',
              boxShadow: '0 0 60px rgba(255,107,53,0.12), 0 25px 60px rgba(0,0,0,0.6)',
              width: '100%',
              maxWidth: '420px',
              padding: '2rem',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                padding: '0.375rem',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <X size={16} />
            </button>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Rocket style={{ color: '#FF6B35', width: 28, height: 28 }} />
              </motion.div>
              <div>
                <p style={{ fontSize: '0.7rem', color: '#FF6B35', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
                  MARKET MISSION CONTROL
                </p>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', letterSpacing: '0.05em' }}>
                  {view === 'login' ? 'Commander Authentication' : view === 'email-confirmation' ? 'Verification Required' : 'Mission Enrollment'}
                </p>
              </div>
            </div>

            {/* Tab switcher */}
            {view !== 'email-confirmation' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.25rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0.75rem',
              padding: '0.25rem',
              marginBottom: '1.5rem',
            }}>
              {(['login', 'register'] as AuthView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    background: view === v ? 'linear-gradient(135deg, #FF6B35 0%, #ff8c5a 100%)' : 'transparent',
                    color: view === v ? '#fff' : '#6b7280',
                    boxShadow: view === v ? '0 2px 12px rgba(255,107,53,0.35)' : 'none',
                  }}
                >
                  {v === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
            )}

            {/* Error / Success banners */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    background: 'rgba(255,23,68,0.08)',
                    border: '1px solid rgba(255,23,68,0.25)',
                    borderRadius: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    marginBottom: '1rem',
                    color: '#ff5c7a',
                    fontSize: '0.8rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    background: 'rgba(0,230,118,0.08)',
                    border: '1px solid rgba(0,230,118,0.25)',
                    borderRadius: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    marginBottom: '1rem',
                    color: '#00E676',
                    fontSize: '0.8rem',
                  }}
                >
                  <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <AuthInput
                    icon={<Mail size={15} />}
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    required
                  />
                  <AuthInput
                    icon={<Lock size={15} />}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    required
                    suffix={
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  <SubmitButton loading={loading} label="SIGN IN" />
                </motion.form>
              ) : view === 'register' ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleRegister}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
                >
                  <AuthInput icon={<User size={15} />} type="text" placeholder="Full Name" value={regName} onChange={setRegName} required />
                  <AuthInput icon={<Phone size={15} />} type="tel" placeholder="Phone Number" value={regPhone} onChange={setRegPhone} />
                  <AuthInput icon={<Mail size={15} />} type="email" placeholder="Email" value={regEmail} onChange={setRegEmail} required />
                  <AuthInput
                    icon={<Lock size={15} />}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={regPassword}
                    onChange={setRegPassword}
                    required
                    suffix={
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  <AuthInput
                    icon={<Lock size={15} />}
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={regConfirmPassword}
                    onChange={setRegConfirmPassword}
                    required
                    suffix={
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  <SubmitButton loading={loading} label="REGISTER" />
                </motion.form>
              ) : (
                <motion.div
                  key="email-confirmation"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 8px' }}
                >
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M2 7l10 7 10-7"/>
                  </svg>
                  <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '24px', color: '#e2e8f0', fontWeight: 700, margin: 0 }}>Check Your Email</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>We've sent a confirmation link to:</p>
                  <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '13px', color: '#f5c518', fontWeight: 700 }}>{regEmail}</div>
                  <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>Click the link in the email to activate your account before signing in.</p>
                  <p style={{ fontSize: '11px', color: '#64748b', fontFamily: '"Space Mono", monospace', margin: 0 }}>Didn't receive it? Check your spam folder.</p>
                  <button
                    onClick={() => switchView('login')}
                    style={{
                      width: '100%', padding: '0.75rem', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #FF6B35 0%, #ff5500 100%)', color: '#fff', marginTop: '16px'
                    }}
                  >
                    BACK TO SIGN IN
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer hint */}
            {view !== 'email-confirmation' && (
            <p style={{ textAlign: 'center', fontSize: '0.73rem', color: '#4b5563', marginTop: '1.25rem' }}>
              {view === 'login' ? "New user? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchView(view === 'login' ? 'register' : 'login')}
                style={{ color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                {view === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

interface AuthInputProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  suffix?: React.ReactNode;
}

function AuthInput({ icon, type, placeholder, value, onChange, required, suffix }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      background: focused ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${focused ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '0.625rem',
      padding: '0 0.875rem',
      transition: 'all 0.2s',
    }}>
      <span style={{ color: focused ? '#FF6B35' : '#4b5563', flexShrink: 0, transition: 'color 0.2s' }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#fff',
          fontSize: '0.85rem',
          padding: '0.75rem 0',
        }}
      />
      {suffix}
    </div>
  );
}

interface SubmitButtonProps {
  loading: boolean;
  label: string;
}

function SubmitButton({ loading, label }: SubmitButtonProps) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      style={{
        width: '100%',
        padding: '0.75rem',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: 'none',
        borderRadius: '0.625rem',
        background: loading
          ? 'rgba(255,107,53,0.3)'
          : 'linear-gradient(135deg, #FF6B35 0%, #ff5500 100%)',
        color: '#fff',
        boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.4)',
        transition: 'all 0.2s',
        marginTop: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', fontSize: '1rem' }}
          >🚀</motion.span>
          Processing...
        </>
      ) : label}
    </motion.button>
  );
}
