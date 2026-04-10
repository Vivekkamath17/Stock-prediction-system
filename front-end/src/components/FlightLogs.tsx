import { motion } from 'motion/react';
import { ScrollText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { RegimeType } from '../App';

interface FlightLogsProps {
  ticker: string;
  regime: RegimeType;
}

// Generate mock historical data
const generateHistoricalData = (regime: RegimeType) => {
  const data = [];
  let price = 100;
  
  for (let i = 0; i < 30; i++) {
    const change = regime === 'bull' ? Math.random() * 3 - 0.5 :
                   regime === 'bear' ? Math.random() * 2 - 2.5 :
                   regime === 'volatile' ? Math.random() * 6 - 3 :
                   Math.random() * 2 - 1;
    
    price += change;
    
    data.push({
      date: `Day ${i + 1}`,
      price: Math.round(price * 100) / 100,
      advisory: price + (Math.random() * 4 - 2),
    });
  }
  
  return data;
};

export function FlightLogs({ ticker, regime }: FlightLogsProps) {
  const data = generateHistoricalData(regime);
  const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'];

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
          {timeRanges.map((range) => (
            <button
              key={range}
              className="px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#1E88E5] transition-all"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0A1128]/50 rounded-xl p-4 border border-white/5">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="advisoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#48484A" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#AEAEB2" 
              tick={{ fill: '#AEAEB2', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#AEAEB2" 
              tick={{ fill: '#AEAEB2', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1C1C1E', 
                border: '1px solid #48484A',
                borderRadius: '8px',
                color: '#F4F4F9'
              }}
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
              name="Advisory Prediction"
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
            <span className="text-sm text-gray-400">Advisory Prediction</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
