import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import type { RegimeType } from '../App';

interface RegimeDisplayProps {
  regime: RegimeType;
  confidence: number;
  regimeHistory: Array<{ date: string; regime: RegimeType }>;
}

const regimeConfig = {
  bull: {
    label: 'BULL MARKET',
    icon: TrendingUp,
    color: '#00E676',
    bgGradient: 'from-[#00E676]/20 to-[#00E676]/5',
    description: 'Strong upward momentum detected',
  },
  bear: {
    label: 'BEAR MARKET',
    icon: TrendingDown,
    color: '#FF1744',
    bgGradient: 'from-[#FF1744]/20 to-[#FF1744]/5',
    description: 'Downward pressure in the market',
  },
  sideways: {
    label: 'SIDEWAYS MARKET',
    icon: Minus,
    color: '#FFD600',
    bgGradient: 'from-[#FFD600]/20 to-[#FFD600]/5',
    description: 'Lateral movement, consolidation phase',
  },
  volatile: {
    label: 'VOLATILE MARKET',
    icon: Zap,
    color: '#9C27B0',
    bgGradient: 'from-[#9C27B0]/20 to-[#9C27B0]/5',
    description: 'High turbulence and unpredictability',
  },
};

export function RegimeDisplay({ regime, confidence, regimeHistory }: RegimeDisplayProps) {
  const config = regimeConfig[regime];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl border border-white/10 p-6 backdrop-blur-sm`}
    >
      <h2 className="text-xl font-semibold mb-4">MARKET REGIME ANALYSIS</h2>

      <div className="bg-[#1C1C1E]/50 rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: regime === 'volatile' ? [0, 360] : 0,
              }}
              transition={{
                duration: regime === 'volatile' ? 2 : 1.5,
                repeat: Infinity,
              }}
              className="p-4 rounded-full"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="size-8" style={{ color: config.color }} />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: config.color }}>
                {config.label}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{config.description}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Confidence</p>
            <p className="text-3xl font-bold" style={{ color: config.color }}>
              {Math.round(confidence)}%
            </p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mb-6">
          <div className="h-3 bg-[#1C1C1E] rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${config.color}, ${config.color}AA)`,
                boxShadow: `0 0 10px ${config.color}`,
              }}
            />
          </div>
        </div>

        {/* Regime History */}
        <div>
          <p className="text-sm text-gray-400 mb-3">Regime History:</p>
          <div className="flex gap-2">
            {regimeHistory.map((item, idx) => {
              const historyConfig = regimeConfig[item.regime];
              return (
                <div key={idx} className="flex-1">
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-xs font-semibold border border-white/10"
                    style={{ backgroundColor: `${historyConfig.color}20` }}
                  >
                    {item.date}
                  </div>
                  <div
                    className="h-1 rounded-full mt-1"
                    style={{ backgroundColor: historyConfig.color }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
