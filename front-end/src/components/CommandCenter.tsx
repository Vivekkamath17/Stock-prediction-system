import { motion } from 'motion/react';
import { Target, TrendingUp, TrendingDown, ArrowRight, Download, BarChart3 } from 'lucide-react';
import type { StockData } from '../App';

interface CommandCenterProps {
  recommendation: StockData['recommendation'];
  onViewDetails?: () => void;
  onExportReport?: () => void;
}

export function CommandCenter({ recommendation, onViewDetails, onExportReport }: CommandCenterProps) {
  const trendConfig = {
    upward: {
      icon: TrendingUp,
      label: '⬆️ UPWARD',
      color: '#00E676',
    },
    downward: {
      icon: TrendingDown,
      label: '⬇️ DOWNWARD',
      color: '#FF1744',
    },
    sideways: {
      icon: ArrowRight,
      label: '➡️ SIDEWAYS',
      color: '#FFD600',
    },
  };

  const riskConfig = {
    high: { label: '🔴 HIGH', color: '#FF1744' },
    medium: { label: '🟡 MEDIUM', color: '#FFD600' },
    low: { label: '🟢 LOW', color: '#00E676' },
  };

  const config = trendConfig[recommendation.trend];
  const TrendIcon = config.icon;
  const risk = riskConfig[recommendation.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-[#1E88E5]/10 via-[#FF6B35]/5 to-transparent rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="size-5 text-[#FF6B35]" />
        <h2 className="text-xl font-semibold">FINAL ADVISORY - STOCK RECOMMENDATION</h2>
      </div>

      <div className="bg-[#1C1C1E]/50 rounded-xl p-8 border border-white/5">

        {/* Summary */}
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-gray-300 leading-relaxed italic">
            "{recommendation.summary}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            id="cmd-view-details"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewDetails}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1E88E5] to-[#1E88E5]/80 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(30,136,229,0.5)] transition-all"
          >
            <BarChart3 className="size-5" />
            VIEW DETAILS
          </motion.button>
          <motion.button
            id="cmd-export-report"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExportReport}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/20 rounded-lg font-semibold hover:bg-white/10 transition-all"
          >
            <Download className="size-5" />
            EXPORT REPORT
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
