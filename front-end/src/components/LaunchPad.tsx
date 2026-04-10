import { useState, useEffect } from 'react';
import { Search, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface LaunchPadProps {
  onSearch: (ticker: string, name?: string) => void;
  selectedTicker: string;
}

interface StockEntry {
  id: string;
  Stock: string;
  Ticker: string;
}

export function LaunchPad({ onSearch, selectedTicker }: LaunchPadProps) {
  const [input, setInput] = useState('');
  const [popularStocks, setPopularStocks] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const { data, error } = await supabase
          .from('Stocks')
          .select('*')
          .limit(7);
        
        if (error) throw error;
        if (data) setPopularStocks(data);
      } catch (err) {
        console.error('Error fetching popular stocks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStocks();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Find name if matches loaded stocks, else pass empty
      const matched = popularStocks.find(s => s.Ticker === input.toUpperCase());
      onSearch(input.toUpperCase(), matched ? matched.Stock : input.toUpperCase());
    }
  };

  const handleQuickSelect = (stock: StockEntry) => {
    setInput(stock.Ticker);
    onSearch(stock.Ticker, stock.Stock);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1E88E5]/10 to-[#FF6B35]/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="size-5 text-[#FF6B35]" />
        <h2 className="text-xl font-semibold">SELECT MISSION TARGET</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Stock Ticker (e.g., AAPL)"
              className="w-full pl-12 pr-4 py-3 bg-[#1C1C1E] border-2 border-[#48484A] rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5] focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(30,136,229,0.3)]"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1744] rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,107,53,0.5)] transition-all"
          >
            GO
          </motion.button>
        </div>
      </form>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400">Popular:</span>
        {loading ? (
          <div className="size-4 rounded-full border-2 border-t-transparent border-[#FF6B35] animate-spin" />
        ) : popularStocks.map((stock) => (
          <motion.button
            key={stock.id || stock.Ticker}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickSelect(stock)}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-all ${
              selectedTicker === stock.Ticker
                ? 'bg-[#1E88E5]/20 border-[#1E88E5] text-[#1E88E5]'
                : 'bg-white/5 border-white/10 hover:border-white/30'
            }`}
          >
            {stock.Ticker}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
