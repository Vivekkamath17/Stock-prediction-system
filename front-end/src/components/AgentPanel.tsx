import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Newspaper, AlertTriangle, Activity } from 'lucide-react';
import type { StockData } from '../App';

interface AgentPanelProps {
  sentimentAnalysis: StockData['sentimentAnalysis'];
  riskAnalysis: StockData['riskAnalysis'];
  isAnalyzing?: boolean;
  regimeAgent: StockData['regimeAgent'];
  isRegimeAnalyzing?: boolean;
}

// Visual config for each regime label returned by the Python HMM agent
const REGIME_CONFIG: Record<string, { color: string; bg: string; border: string; icon: JSX.Element; desc: string }> = {
  Bull: {
    color: '#00E676',
    bg: 'from-[#00E676]/10',
    border: 'border-[#00E676]/30',
    icon: <TrendingUp className="size-5 text-[#00E676]" />,
    desc: 'Upward trending market with positive momentum.',
  },
  Bear: {
    color: '#FF1744',
    bg: 'from-[#FF1744]/10',
    border: 'border-[#FF1744]/30',
    icon: <TrendingDown className="size-5 text-[#FF1744]" />,
    desc: 'Downward trending market. Exercise caution.',
  },
  HighVolatility: {
    color: '#FF6D00',
    bg: 'from-[#FF6D00]/10',
    border: 'border-[#FF6D00]/30',
    icon: <Activity className="size-5 text-[#FF6D00]" />,
    desc: 'High volatility detected. Risk is elevated.',
  },
  Sideways: {
    color: '#FFD600',
    bg: 'from-[#FFD600]/10',
    border: 'border-[#FFD600]/30',
    icon: <Activity className="size-5 text-[#FFD600]" />,
    desc: 'Market moving sideways. Wait for breakout signals.',
  },
};

const DEFAULT_REGIME_CONFIG = {
  color: '#6B7280',
  bg: 'from-[#6B7280]/10',
  border: 'border-[#6B7280]/30',
  icon: <Activity className="size-5 text-[#6B7280]" />,
  desc: 'Calculating regime...',
};

export function AgentPanel({
  sentimentAnalysis,
  riskAnalysis,
  isAnalyzing = false,
  regimeAgent,
  isRegimeAnalyzing = false,
}: AgentPanelProps) {
  const regimeCfg = regimeAgent
    ? (REGIME_CONFIG[regimeAgent.regime] ?? DEFAULT_REGIME_CONFIG)
    : DEFAULT_REGIME_CONFIG;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">AGENT ANALYSIS - MISSION CREW REPORTS</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── REGIME AGENT ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className={`bg-gradient-to-br ${regimeCfg.bg} to-transparent rounded-xl border ${regimeCfg.border} p-5 backdrop-blur-sm group transition-all`}
          style={{ boxShadow: isRegimeAnalyzing ? 'none' : `0 0 30px ${regimeCfg.color}33` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${regimeCfg.color}20` }}>
              {regimeCfg.icon}
            </div>
            <h3 className="font-semibold" style={{ color: regimeCfg.color }}>REGIME</h3>
          </div>

          {isRegimeAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4" style={{ color: '#1E88E5' }}>
              <div className="size-8 rounded-full border-4 border-[#1E88E5]/20 border-t-[#1E88E5] animate-spin mb-3" />
              <p className="text-sm font-semibold tracking-wide animate-pulse">TRAINING HMM...</p>
              <p className="text-xs text-gray-400 mt-1">Fetching 3y historical data</p>
            </div>
          ) : regimeAgent ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Regime:</span>
                <span className="font-bold text-lg uppercase" style={{ color: regimeCfg.color }}>
                  {regimeAgent.regime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Symbol:</span>
                <span className="font-semibold text-sm">{regimeAgent.ticker}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{regimeCfg.desc}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">Select a stock to detect regime.</p>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div
                className="size-2 rounded-full animate-pulse"
                style={{ backgroundColor: isRegimeAnalyzing ? '#FFD600' : regimeCfg.color }}
              />
              <span>{isRegimeAnalyzing ? 'Training Gaussian HMM...' : 'HMM Active'}</span>
            </div>
          </div>
        </motion.div>

        {/* ── SENTIMENT AGENT ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-[#FF6B35]/10 to-transparent rounded-xl border border-[#FF6B35]/30 p-5 backdrop-blur-sm group hover:shadow-[0_0_30px_rgba(255,107,53,0.2)] transition-all relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#FF6B35]/20">
              <Newspaper className="size-5 text-[#FF6B35]" />
            </div>
            <h3 className="font-semibold text-[#FF6B35]">SENTIMENT</h3>
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4 text-[#FF6B35]">
              <div className="size-8 rounded-full border-4 border-[#FF6B35]/20 border-t-[#FF6B35] animate-spin mb-3" />
              <p className="text-sm font-semibold tracking-wide animate-pulse">AI SCRAPING NEWS...</p>
              <p className="text-xs text-gray-400 mt-1">Contacting FinBERT + Gemini</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Score:</span>
                <span className={`font-semibold ${
                  sentimentAnalysis.score > 0 ? 'text-[#00E676]' : sentimentAnalysis.score < 0 ? 'text-[#FF1744]' : 'text-[#FFD600]'
                }`}>
                  {sentimentAnalysis.score > 0 ? '+' : ''}{sentimentAnalysis.score.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">News:</span>
                <div className="flex items-center gap-1">
                  <div className={`size-2 rounded-full ${
                    sentimentAnalysis.newsStatus.toLowerCase() === 'positive' ? 'bg-[#00E676]' :
                    sentimentAnalysis.newsStatus.toLowerCase() === 'negative' ? 'bg-[#FF1744]' :
                    'bg-[#FFD600]'
                  }`} />
                  <span className="capitalize text-sm">{sentimentAnalysis.newsStatus}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Social:</span>
                <div className="flex items-center gap-1">
                  <div className={`size-2 rounded-full ${
                    sentimentAnalysis.socialStatus === 'positive' ? 'bg-[#00E676]' :
                    sentimentAnalysis.socialStatus === 'negative' ? 'bg-[#FF1744]' :
                    'bg-[#FFD600]'
                  }`} />
                  <span className="capitalize text-sm">{sentimentAnalysis.socialStatus}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className={`size-2 rounded-full ${isAnalyzing ? 'bg-[#FFD600]' : 'bg-[#00E676]'} animate-pulse`} />
              <span>{isAnalyzing ? 'Querying FinBERT...' : 'Active'}</span>
            </div>
          </div>
        </motion.div>

        {/* ── RISK AGENT ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-[#9C27B0]/10 to-transparent rounded-xl border border-[#9C27B0]/30 p-5 backdrop-blur-sm group hover:shadow-[0_0_30px_rgba(156,39,176,0.2)] transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#9C27B0]/20">
              <AlertTriangle className="size-5 text-[#9C27B0]" />
            </div>
            <h3 className="font-semibold text-[#9C27B0]">RISK</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Level:</span>
              <span className={`font-semibold uppercase ${
                riskAnalysis.level === 'high' ? 'text-[#FF1744]' :
                riskAnalysis.level === 'medium' ? 'text-[#FFD600]' :
                'text-[#00E676]'
              }`}>
                {riskAnalysis.level}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Volatility:</span>
              <span className="font-semibold">{riskAnalysis.volatility.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Alerts:</span>
              <span className="font-semibold">
                {riskAnalysis.alerts.length > 0 ? riskAnalysis.alerts.length : 'None'}
              </span>
            </div>
          </div>

          {riskAnalysis.alerts.length > 0 && (
            <div className="mt-3 p-2 bg-[#FF1744]/10 border border-[#FF1744]/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="size-4 text-[#FF1744] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">{riskAnalysis.alerts[0]}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="size-2 rounded-full bg-[#00E676] animate-pulse" />
              <span>Active</span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
