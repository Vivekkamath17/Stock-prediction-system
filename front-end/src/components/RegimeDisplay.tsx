import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle } from 'lucide-react';

interface RegimeDisplayProps {
  regimeData?: any;
  technicalData?: any;
  isLoading?: boolean;
}

const regimeMapping: Record<string, any> = {
  BULL: {
    label: 'BULL MARKET',
    icon: TrendingUp,
    color: '#22c55e',
    bgGradient: 'from-[#22c55e]/20 to-transparent',
    description: 'Strong upward momentum',
  },
  BEAR: {
    label: 'BEAR MARKET',
    icon: TrendingDown,
    color: '#ef4444',
    bgGradient: 'from-[#ef4444]/20 to-transparent',
    description: 'Downward pressure detected',
  },
  SIDEWAYS: {
    label: 'SIDEWAYS MARKET',
    icon: Minus,
    color: '#f5c518',
    bgGradient: 'from-[#f5c518]/20 to-transparent',
    description: 'Lateral movement, consolidation phase',
  },
  HIGHVOLATILITY: {
    label: 'HIGH VOLATILITY',
    icon: Zap,
    color: '#a855f7',
    bgGradient: 'from-[#a855f7]/20 to-transparent',
    description: 'Elevated risk, sharp swings expected',
  },
  HIGH_VOLATILITY: {
    label: 'HIGH VOLATILITY',
    icon: Zap,
    color: '#a855f7',
    bgGradient: 'from-[#a855f7]/20 to-transparent',
    description: 'Elevated risk, sharp swings expected',
  },
};

export function RegimeDisplay({ regimeData, technicalData, isLoading }: RegimeDisplayProps) {
  // Determine state
  const rawRegime = regimeData?.regime?.replace('_', '').toUpperCase();
  const hasError = !isLoading && (!regimeData || !regimeData.regime);
  
  // Calculate confidence from technical agent
  const rawConfidence = technicalData?.confidence ?? 0;
  const confidence = Math.round(rawConfidence);

  // Setup UI config based on state
  let config = {
    label: 'ANALYZING...',
    description: 'Awaiting regime detection',
    color: '#64748b',
    bgGradient: 'from-[#64748b]/10 to-transparent',
    icon: null as React.ElementType | null,
    isPulsing: true,
    showConfidence: false
  };

  if (hasError && !isLoading) {
    config = {
      label: 'DATA UNAVAILABLE',
      description: 'Could not fetch regime data. Try again.',
      color: '#64748b',
      bgGradient: 'from-[#64748b]/10 to-transparent',
      icon: null,
      isPulsing: false,
      showConfidence: true // user requested "Confidence: 0%"
    };
  } else if (!isLoading && rawRegime && regimeMapping[rawRegime]) {
    const mapped = regimeMapping[rawRegime];
    config = {
      label: mapped.label,
      description: mapped.description,
      color: mapped.color,
      bgGradient: mapped.bgGradient,
      icon: mapped.icon,
      isPulsing: false,
      showConfidence: true
    };
  }
  
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl border border-white/10 p-6 backdrop-blur-sm`}
    >
      <h2 className="text-xl font-semibold mb-4 text-white">MARKET REGIME ANALYSIS</h2>

      <div className="bg-[#1C1C1E]/50 rounded-xl p-6 border border-white/5 relative overflow-hidden">
        {/* Loading shimmer overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ width: '200%', left: '-100%' }}
          />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: config.isPulsing ? [1, 1.05, 1] : 1,
                  opacity: config.isPulsing ? [0.5, 1, 0.5] : 1
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="p-4 rounded-full flex items-center justify-center border border-white/5"
                style={{ backgroundColor: `${config.color}20`, height: '64px', width: '64px' }}
              >
                {Icon ? (
                  <Icon className="size-8" style={{ color: config.color }} />
                ) : (
                  <div className="size-full rounded-full animate-pulse" style={{ backgroundColor: `${config.color}40` }} />
                )}
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold tracking-wider" style={{ color: config.color }}>
                  {config.label}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{config.description}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Confidence</p>
              <p className="text-3xl font-bold" style={{ color: '#f5c518' }}>
                {config.showConfidence ? `${confidence}%` : '--'}
              </p>
            </div>
          </div>

          {/* Confidence Bar */}
          <div>
            <div className="h-3 bg-[#1C1C1E] rounded-full overflow-hidden border border-white/10 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: config.showConfidence ? `${confidence}%` : '0%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${config.isPulsing ? 'animate-pulse' : ''}`}
                style={{
                  background: `linear-gradient(90deg, #f5c518, #f5c518AA)`,
                  boxShadow: config.showConfidence ? `0 0 10px #f5c518` : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
