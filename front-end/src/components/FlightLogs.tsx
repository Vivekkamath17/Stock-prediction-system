import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { RegimeType } from '../App';

interface FlightLogsProps {
  ticker: string;
  displayName?: string;
  regime: RegimeType;
}

export function FlightLogs({ ticker, displayName, regime }: FlightLogsProps) {
  const [chartData, setChartData] = useState<{ date: string; price: number; advisory: number }[]>([]);
  const [activePeriod, setActivePeriod] = useState('1mo');
  const [loading, setLoading] = useState(false);

  const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'];
  const PERIOD_MAP: Record<string, string> = {
    '1M': '1mo',
    '3M': '3mo',
    '6M': '6mo',
    '1Y': '1y',
    'ALL': 'max'
  };

  const fetchPriceHistory = async (period: string) => {
    if (!ticker) return;
    setLoading(true);
    try {
      // Assuming exchange is NSE by default for now
      const res = await fetch(`/api/price-history?ticker=${ticker}&exchange=NSE&period=${period}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        // Option B: 5-Day moving average for Advisory Prediction
        const prices = data.data.prices as number[];
        const dates = data.data.dates as string[];
        
        const rollingAvg = prices.map((pr, i) => {
          const slice = prices.slice(Math.max(0, i - 4), i + 1);
          return slice.reduce((a, b) => a + b, 0) / slice.length;
        });

        const formattedData = dates.map((date, i) => ({
          date,
          price: prices[i],
          advisory: Math.round(rollingAvg[i] * 100) / 100
        }));

        setChartData(formattedData);
      }
    } catch (e) {
      console.error('Price history fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory(activePeriod);
  }, [ticker, activePeriod]);

  const handlePeriod = (label: string) => {
    const p = PERIOD_MAP[label];
    setActivePeriod(p);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-[#1C1C1E]/80 to-transparent rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ScrollText className="size-5 text-[#1E88E5]" />
          <h2 className="text-xl font-semibold">MISSION HISTORY - {ticker}</h2>
        </div>
        
        <div className="flex gap-2">
          {timeRanges.map((range) => {
            const isActive = PERIOD_MAP[range] === activePeriod;
            return (
              <button
                key={range}
                onClick={() => handlePeriod(range)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  isActive 
                    ? 'bg-[#1E88E5]/20 border-[#1E88E5] text-[#1E88E5]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0A1128]/50 rounded-xl p-4 border border-white/5 relative">
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A1128]/40 backdrop-blur-[2px] rounded-xl"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 text-[#1E88E5] animate-spin" />
                <span className="text-sm text-[#1E88E5] font-mono tracking-widest uppercase animate-pulse">Syncing Telemetry...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#48484A" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#AEAEB2" 
              tick={{ fill: '#AEAEB2', fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              stroke="#AEAEB2" 
              tick={{ fill: '#AEAEB2', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1C1C1E', 
                border: '1px solid #48484A',
                borderRadius: '8px',
                color: '#F4F4F9'
              }}
              labelStyle={{ color: '#AEAEB2' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#1E88E5" 
              strokeWidth={2}
              fill="url(#priceGradient)"
              name="Actual Price"
            />
            <Line 
              type="monotone" 
              dataKey="advisory" 
              stroke="#FF6B35" 
              strokeWidth={2}
              dot={false}
              name="5-Day MA"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#1E88E5]" />
            <span className="text-sm text-gray-400">Actual Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#FF6B35] border-dashed" style={{ borderTop: '2px dashed #FF6B35', height: 0 }} />
            <span className="text-sm text-gray-400">5-Day MA</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
