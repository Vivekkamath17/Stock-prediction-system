import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface LaunchPadProps {
  onSearch: (ticker: string, name?: string, yfinanceTicker?: string) => void;
  selectedTicker: string;
  user?: any;
}

interface StockEntry {
  id: string;
  Stock: string;
  Ticker: string;
  yfinance_ticker?: string;
}

export function LaunchPad({ onSearch, selectedTicker, user }: LaunchPadProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);

  // Favourites state
  const [favourites, setFavourites] = useState<any[]>([]);
  const [showAddFav, setShowAddFav] = useState(false);
  const [favSearch, setFavSearch] = useState("");
  const [favSuggestions, setFavSuggestions] = useState<StockEntry[]>([]);

  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  const handleOpenAddFav = () => {
    if (addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowAddFav(true);
  };
  
  const loadFavourites = async () => {
    if (!user) {
      setFavourites([]);
      return;
    }
    const { data } = await supabase
      .from('favourites')
      .select('id, stock_id, Stocks(id, Stock, Ticker, yfinance_ticker)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setFavourites(data);
  };

  useEffect(() => {
    loadFavourites();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showAddFav) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        addBtnRef.current && !addBtnRef.current.contains(target) &&
        !target.closest('.add-fav-panel')
      ) {
        setShowAddFav(false);
        setFavSearch("");
        setFavSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAddFav]);

  const handleSearchInput = async (value: string) => {
    setQuery(value);
    setSelectedStock(null);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const { data, error } = await supabase
      .from('Stocks')
      .select('id, Stock, Ticker, yfinance_ticker')
      .ilike('Stock', `%${value}%`)
      .limit(8);

    if (!error && data) {
      setSuggestions(data);
      setShowDropdown(true);
    }
  };

  const handleSelectStock = (stockRow: StockEntry) => {
    setQuery(stockRow.Stock);
    setSelectedStock(stockRow);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleGo = () => {
    if (!selectedStock) return;
    onSearch(selectedStock.Ticker, selectedStock.Stock, selectedStock.yfinance_ticker);
  };

  // Add favourite search logic
  const handleFavSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFavSearch(value);
    if (value.length < 2) { setFavSuggestions([]); return; }
    const { data } = await supabase
      .from('Stocks')
      .select('id, Stock, Ticker, yfinance_ticker')
      .ilike('Stock', `%${value}%`)
      .limit(8);
    if (data) setFavSuggestions(data);
  };

  const addFavourite = async (stock: StockEntry) => {
    if (!user) return;
    if (favourites.some(f => f.stock_id === stock.id)) return;
    const { error } = await supabase
      .from('favourites')
      .insert({ user_id: user.id, stock_id: stock.id });
    if (!error) {
      loadFavourites();
      setFavSearch("");
      setFavSuggestions([]);
      setShowAddFav(false);
    }
  };

  const removeFavourite = async (favId: string) => {
    await supabase.from('favourites').delete().eq('id', favId);
    loadFavourites();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1E88E5]/10 to-[#FF6B35]/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="size-5 text-[#FF6B35]" />
        <h2 className="text-xl font-semibold">SELECT STOCK TARGET</h2>
      </div>

      <style>{`
        .search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 9999;
          background: #1a2235;
          border: 1px solid rgba(245, 197, 24, 0.3);
          border-radius: 8px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          max-height: 300px;
          overflow-y: auto;
        }
        .search-dropdown::-webkit-scrollbar { width: 4px; }
        .search-dropdown::-webkit-scrollbar-track { background: #111827; }
        .search-dropdown::-webkit-scrollbar-thumb { background: rgba(245,197,24,0.3); border-radius: 2px; }
        
        .suggestion-row {
          background: #1a2235;
          padding: 13px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: background 0.15s;
        }
        .suggestion-row:hover {
          background: #222d45;
        }
        .suggestion-name {
          font-family: Rajdhani, sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .suggestion-ticker {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #f5c518;
          background: rgba(245, 197, 24, 0.12);
          border: 1px solid rgba(245, 197, 24, 0.3);
          border-radius: 3px;
          padding: 2px 10px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: 12px;
        }
        .suggestion-empty {
          padding: 16px 18px;
          color: #64748b;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          text-align: center;
          background: #1a2235;
        }
        
        /* FAVOURITES CSS */
        .favourites-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px;
        }
        .fav-label {
          font-family: Rajdhani, sans-serif; font-size: 13px; color: #64748b;
          letter-spacing: 1px; text-transform: uppercase; margin-right: 4px;
        }
        .fav-pill {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px; padding: 4px 10px 4px 12px;
          cursor: pointer; transition: all 0.15s; position: relative;
        }
        .fav-pill:hover {
          background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5);
        }
        .fav-pill-active {
          background: rgba(59, 130, 246, 0.25) !important; border-color: #3b82f6 !important;
        }
        .fav-pill-name {
          font-family: Rajdhani, sans-serif; font-size: 13px; font-weight: 600;
          color: #e2e8f0; letter-spacing: 1px;
        }
        .fav-remove-btn {
          background: none; border: none; color: #64748b; font-size: 14px; cursor: pointer; padding: 0 2px;
          line-height: 1; opacity: 0; transition: opacity 0.15s;
        }
        .fav-pill:hover .fav-remove-btn { opacity: 1; color: #ef4444; }
        .fav-add-btn {
          background: transparent; border: 1px dashed rgba(245, 197, 24, 0.4);
          color: #f5c518; border-radius: 20px; padding: 4px 12px;
          font-family: Rajdhani, sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 1.5px; cursor: pointer; transition: all 0.15s;
        }
        .fav-add-btn:hover {
          background: rgba(245,197,24,0.08); border-style: solid;
        }
        .fav-login-hint {
          font-family: 'Space Mono', monospace; font-size: 11px; color: #64748b; font-style: italic;
        }
        .add-fav-input {
          width: 100%; background: #0f1729; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-family: Rajdhani, sans-serif;
          font-size: 14px; outline: none; margin-bottom: 8px;
        }
        .add-fav-input:focus {
          border-color: rgba(245,197,24,0.5);
        }
        .add-fav-results {
          max-height: 220px; overflow-y: auto; background: #1a2235;
        }
        .add-fav-row {
          display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; cursor: pointer; border-radius: 4px;
          transition: background 0.15s;
        }
        .add-fav-row:hover { background: rgba(255,255,255,0.06); }
        .add-fav-row-disabled { opacity: 0.5; cursor: default; }
        .add-fav-name { font-family: Rajdhani, sans-serif; font-size: 14px; color: #e2e8f0; }
        .add-fav-ticker {
          font-family: 'Space Mono', monospace; font-size: 11px; color: #f5c518; background: rgba(245, 197, 24, 0.12);
          border: 1px solid rgba(245, 197, 24, 0.3); border-radius: 3px; padding: 2px 10px; margin-left: auto;
        }
        .add-fav-check { color: #22c55e; margin-left: 8px; }
        .add-fav-empty { text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #64748b; padding: 12px; }
        .add-fav-done {
          width: 100%; margin-top: 8px; padding: 8px; background: transparent; border: none;
          border-top: 1px solid rgba(255,255,255,0.06); color: #f5c518; font-family: Rajdhani, sans-serif; font-size: 12px;
          font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer;
        }
        .add-fav-done:hover { color: white; }
      `}</style>
      
      <div className="mb-4 search-container" style={{ position: 'relative', zIndex: 9999 }}>
        <div className="flex gap-3">
          <div className="flex-1 group" style={{ position: 'relative', zIndex: 9999 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGo();
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Enter Stock Name (e.g., Tata Consultancy)"
              className="w-full pl-12 pr-4 py-3 bg-[#1C1C1E] border-2 border-[#48484A] rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5] focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(30,136,229,0.3)]"
            />
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="search-dropdown"
                >
                  {suggestions.length === 0 ? (
                    <div className="suggestion-empty">
                      NO STOCKS FOUND
                    </div>
                  ) : (
                    suggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectStock(item)}
                        className="suggestion-row"
                      >
                        <span className="suggestion-name">
                          {item.Stock}
                        </span>
                        <span className="suggestion-ticker">
                          {item.Ticker}
                        </span>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            type="button"
            onClick={handleGo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              selectedStock
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1744] hover:shadow-[0_0_20px_rgba(255,107,53,0.5)] cursor-pointer'
                : 'bg-[#FF6B35]/50 text-white/50 cursor-not-allowed'
            }`}
          >
            GO
          </motion.button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="favourites-row">
          <span className="fav-label">Favourites:</span>

          {favourites.map((fav) => {
            if (!fav.Stocks) return null;
            const isActive = selectedTicker === fav.Stocks.Ticker;
            return (
              <div className={`fav-pill ${isActive ? 'fav-pill-active' : ''}`} key={fav.id}>
                <span
                  className="fav-pill-name"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuery(fav.Stocks.Stock);
                    setSelectedStock(fav.Stocks);
                    onSearch(fav.Stocks.Ticker, fav.Stocks.Stock, fav.Stocks.yfinance_ticker);
                  }}
                >
                  {fav.Stocks.Ticker.replace('.NS','').replace('.BO','')}
                </span>
                <button
                  className="fav-remove-btn"
                  onClick={(e) => { e.stopPropagation(); removeFavourite(fav.id); }}
                  title="Remove from favourites"
                >
                  ×
                </button>
              </div>
            );
          })}

          {user && (
            <div className="fav-dropdown-container">
              <button ref={addBtnRef} className="fav-add-btn" onClick={handleOpenAddFav}>
                + ADD
              </button>
              {showAddFav && typeof document !== 'undefined' && createPortal(
                <div
                  className="add-fav-panel"
                  style={{
                    position: 'fixed',
                    top: panelPos.top,
                    left: panelPos.left,
                    zIndex: 99999,
                    background: '#1a2235',
                    border: '1px solid rgba(245, 197, 24, 0.4)',
                    borderRadius: '8px',
                    padding: '12px',
                    width: '320px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95)'
                  }}
                >
                  <input
                    placeholder="Search stocks to add..."
                    value={favSearch}
                    onChange={handleFavSearch}
                    autoFocus
                    className="add-fav-input"
                  />
                  <div className="add-fav-results">
                    {favSuggestions.map(stock => {
                      const isAdded = favourites.some(f => f.stock_id === stock.id);
                      return (
                        <div 
                          className={`add-fav-row ${isAdded ? 'add-fav-row-disabled' : ''}`} 
                          key={stock.id}
                          onClick={() => !isAdded && addFavourite(stock)}
                        >
                          <span className="add-fav-name">{stock.Stock}</span>
                          <span className="add-fav-ticker">
                            {stock.Ticker.replace('.NS','').replace('.BO','')}
                          </span>
                          {isAdded && <span className="add-fav-check">✓</span>}
                        </div>
                      );
                    })}
                    {favSuggestions.length === 0 && favSearch.length >= 2 && (
                      <div className="add-fav-empty">No stocks found</div>
                    )}
                  </div>
                  <button 
                    className="add-fav-done"
                    onClick={() => { setShowAddFav(false); setFavSearch(""); setFavSuggestions([]); }}
                  >
                    DONE
                  </button>
                </div>,
                document.body
              )}
            </div>
          )}

          {!user && (
            <span className="fav-login-hint">Sign in to save favourites</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
