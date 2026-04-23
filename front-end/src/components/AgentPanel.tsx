import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Newspaper, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import type { StockData } from '../App';

interface AgentPanelProps {
  displayName?: string;
  sentimentAnalysis: StockData['sentimentAnalysis'];
  technicalAgent: StockData['technicalAgent'];
  isTechnicalAnalyzing?: boolean;
  isAnalyzing?: boolean;
  fusionAgent: StockData['fusionAgent'];
  isFusionAnalyzing?: boolean;
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
  displayName,
  sentimentAnalysis,
  technicalAgent,
  isTechnicalAnalyzing = false,
  isAnalyzing = false,
  fusionAgent,
  isFusionAnalyzing = false,
}: AgentPanelProps) {
  const regimeCfg = fusionAgent?.regime
    ? (REGIME_CONFIG[fusionAgent.regime.regime] ?? DEFAULT_REGIME_CONFIG)
    : DEFAULT_REGIME_CONFIG;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">AGENT ANALYSIS - STOCK CREW REPORTS</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ── MARKET REGIME ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className={`bg-gradient-to-br ${regimeCfg.bg} to-transparent rounded-xl border ${regimeCfg.border} p-5 backdrop-blur-sm group transition-all`}
          style={{ boxShadow: isFusionAnalyzing ? 'none' : `0 0 30px ${regimeCfg.color}33` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${regimeCfg.color}20` }}>
              {regimeCfg.icon}
            </div>
            <h3 className="font-semibold" style={{ color: regimeCfg.color }}>MARKET REGIME</h3>
          </div>

          {isFusionAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4" style={{ color: '#1E88E5' }}>
              <div className="size-8 rounded-full border-4 border-[#1E88E5]/20 border-t-[#1E88E5] animate-spin mb-3" />
              <p className="text-sm font-semibold tracking-wide animate-pulse">TRAINING HMM...</p>
              <p className="text-xs text-gray-400 mt-1">Fetching historical data</p>
            </div>
          ) : fusionAgent?.regime ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Regime:</span>
                <span className="font-bold text-lg uppercase" style={{ color: regimeCfg.color }}>
                  {fusionAgent.regime.regime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Confidence:</span>
                <span className="font-semibold text-sm">{fusionAgent.regime.confidence.toFixed(1)}%</span>
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
                style={{ backgroundColor: isFusionAnalyzing ? '#FFD600' : regimeCfg.color }}
              />
              <span>{isFusionAnalyzing ? 'Training Gaussian HMM...' : 'HMM Active'}</span>
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

        {/* ── TECHNICAL AGENT ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-[#9C27B0]/10 to-transparent rounded-xl border border-[#9C27B0]/30 p-5 backdrop-blur-sm group hover:shadow-[0_0_30px_rgba(156,39,176,0.2)] transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#9C27B0]/20">
              <BarChart2 className="size-5 text-[#9C27B0]" />
            </div>
            <h3 className="font-semibold text-[#9C27B0]">TECHNICAL</h3>
          </div>

          {isTechnicalAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4 text-[#9C27B0]">
              <div className="size-8 rounded-full border-4 border-[#9C27B0]/20 border-t-[#9C27B0] animate-spin mb-3" />
              <p className="text-sm font-semibold tracking-wide animate-pulse">COMPUTING INDICATORS...</p>
              <p className="text-xs text-gray-400 mt-1">RSI, MACD, MA Crossovers</p>
            </div>
          ) : technicalAgent ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-400">Signal:</span>
                 <span className={`font-semibold uppercase ${
                   technicalAgent.final_score >= 0.5 ? 'text-[#00E676]' :
                   technicalAgent.final_score > 0 ? 'text-[#AEEA00]' :
                   technicalAgent.final_score <= -0.5 ? 'text-[#FF1744]' :
                   technicalAgent.final_score < 0 ? 'text-[#FF9100]' :
                   'text-[#FFD600]'
                 }`}>
                   {technicalAgent.trend_signal}
                 </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Confidence:</span>
                <span className="font-semibold">{technicalAgent.confidence}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">RSI (14):</span>
                <span className="font-semibold text-sm">
                  {technicalAgent.rsi_value.toFixed(1)} 
                  <span className="text-xs ml-1 text-gray-400">
                    ({technicalAgent.rsi_score > 0 ? 'Bullish' : technicalAgent.rsi_score < 0 ? 'Bearish' : 'Neutral'})
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">Select a stock to run technicals.</p>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className={`size-2 rounded-full ${isTechnicalAnalyzing ? 'bg-[#FFD600]' : 'bg-[#00E676]'} animate-pulse`} />
              <span>{isTechnicalAnalyzing ? 'Running Models...' : 'Active'}</span>
            </div>
          </div>
        </motion.div>

        {/* ── FUSION / SPECIALIST AGENT ── */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-[#00E5FF]/10 to-transparent rounded-xl border border-[#00E5FF]/30 p-5 backdrop-blur-sm group hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#00E5FF]/20">
              <Activity className="size-5 text-[#00E5FF]" />
            </div>
            <h3 className="font-semibold text-[#00E5FF]">SPECIALIST</h3>
          </div>

          {isFusionAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4 text-[#00E5FF]">
              <div className="size-8 rounded-full border-4 border-[#00E5FF]/20 border-t-[#00E5FF] animate-spin mb-3" />
              <p className="text-sm font-semibold tracking-wide animate-pulse">RUNNING XGBOOST...</p>
              <p className="text-xs text-gray-400 mt-1">Decision Fusion in progress</p>
            </div>
          ) : fusionAgent ? (
             <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-400">Signal:</span>
                 <span className={`font-bold uppercase ${
                   fusionAgent.specialist.signal === 'BUY' ? 'text-[#00E676]' :
                   fusionAgent.specialist.signal === 'SELL' ? 'text-[#FF1744]' :
                   'text-[#FFD600]'
                 }`}>
                   {fusionAgent.specialist.signal}
                 </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Probability Up:</span>
                <span className="font-semibold">{(fusionAgent.specialist.probability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Regime Model:</span>
                <span className="font-semibold text-sm text-right">
                  {fusionAgent.specialist.regime_used} <br/>
                  <span className="text-xs text-gray-400">({fusionAgent.specialist.model_accuracy.toFixed(1)}% Acc)</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">Select a stock to run fusion.</p>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className={`size-2 rounded-full ${isFusionAnalyzing ? 'bg-[#FFD600]' : 'bg-[#00E676]'} animate-pulse`} />
              <span>{isFusionAnalyzing ? 'Fusing decisions...' : 'XGBoost Active'}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
