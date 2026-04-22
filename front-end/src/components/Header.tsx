import { Rocket, Settings, LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink, Link } from 'react-router-dom';
import type { RegimeType } from '../App';

interface HeaderProps {
  currentRegime?: string;
  user: any | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

const regimeConfig: Record<string, any> = {
  BULL: {
    label: 'BULL MARKET - Launch Sequence',
    color: 'text-[#00E676]',
    icon: '🟢',
  },
  BEAR: {
    label: 'BEAR MARKET - Descent Protocol',
    color: 'text-[#FF1744]',
    icon: '🔴',
  },
  SIDEWAYS: {
    label: 'SIDEWAYS MARKET - Orbital Hold',
    color: 'text-[#FFD600]',
    icon: '🟡',
  },
  HIGHVOLATILITY: {
    label: 'VOLATILE MARKET - Turbulence Alert',
    color: 'text-[#9C27B0]',
    icon: '🟣',
  },
  HIGH_VOLATILITY: {
    label: 'VOLATILE MARKET - Turbulence Alert',
    color: 'text-[#9C27B0]',
    icon: '🟣',
  },
};

export function Header({ currentRegime, user, onAuthClick, onLogout }: HeaderProps) {
  const regimeData = currentRegime ? regimeConfig[currentRegime.replace('_', '').toUpperCase()] : null;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Commander';

  const navLinkStyle = {
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'color 0.2s ease, border-color 0.2s ease',
    textDecoration: 'none',
    paddingBottom: '4px',
    borderBottom: '2px solid transparent',
  };

  return (
    <header className="border-b border-white/10 bg-[#0A1128]/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: currentRegime === 'BULL' ? -45 : currentRegime === 'BEAR' ? 45 : 0,
                y: currentRegime === 'BULL' ? -2 : currentRegime === 'BEAR' ? 2 : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <Rocket className="size-8 text-[#FF6B35]" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">MARKET MISSION CONTROL</h1>
              <p className="text-xs text-gray-400 tracking-wide">Regime-Aware Multi-Agent Advisory System</p>
            </div>
          </Link>
          
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="hidden md:flex">
            <NavLink
              to="/how-it-works"
              style={({ isActive }) => ({
                ...navLinkStyle,
                color: isActive ? '#f5c518' : '#64748b',
                borderBottomColor: isActive ? '#f5c518' : 'transparent',
              })}
            >HOW IT WORKS</NavLink>
            <NavLink
              to="/about"
              style={({ isActive }) => ({
                ...navLinkStyle,
                color: isActive ? '#f5c518' : '#64748b',
                borderBottomColor: isActive ? '#f5c518' : 'transparent',
              })}
            >ABOUT US</NavLink>
            <NavLink
              to="/contact"
              style={({ isActive }) => ({
                ...navLinkStyle,
                color: isActive ? '#f5c518' : '#64748b',
                borderBottomColor: isActive ? '#f5c518' : 'transparent',
              })}
            >CONTACT US</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              /* Logged-in state */
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  background: 'rgba(255,107,53,0.08)',
                  border: '1px solid rgba(255,107,53,0.2)',
                  borderRadius: '0.625rem',
                }}>
                  <UserCircle2 style={{ color: '#FF6B35', width: 16, height: 16 }} />
                  <span style={{ color: '#e5e7eb', fontSize: '0.8rem', fontWeight: 600 }}>{displayName}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  title="Sign out"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.4rem 0.75rem',
                    background: 'rgba(255,23,68,0.08)',
                    border: '1px solid rgba(255,23,68,0.2)',
                    borderRadius: '0.625rem',
                    color: '#ff5c7a',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                  }}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  Logout
                </motion.button>
              </>
            ) : (
              /* Guest state */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAuthClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #ff5500 100%)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 14px rgba(255,107,53,0.35)',
                }}
              >
                <LogIn style={{ width: 15, height: 15 }} />
                SIGN IN
              </motion.button>
            )}
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="size-5" />
            </button>
          </div>
        </div>

        {regimeData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-lg border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${regimeData.color}`}>
                <span>{regimeData.icon}</span>
                <span className="hidden sm:inline font-mono tracking-widest">{regimeData.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#00E676] animate-pulse" />
              <span className="text-sm text-gray-400">All Agents Active</span>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
