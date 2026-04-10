import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { LaunchPad } from './components/LaunchPad';
import { RegimeDisplay } from './components/RegimeDisplay';
import { AgentPanel } from './components/AgentPanel';
import { CommandCenter } from './components/CommandCenter';
import { FlightLogs } from './components/FlightLogs';
import { Starfield } from './components/Starfield';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabase';

export type RegimeType = 'bull' | 'bear' | 'sideways' | 'volatile';

export interface StockData {
  ticker: string;
  regime: RegimeType;
  confidence: number;
  regimeHistory: Array<{ date: string; regime: RegimeType }>;
  regimeAgent: {
    regime: string;
    ticker: string;
  } | null;
  sentimentAnalysis: {
    score: number;
    newsStatus: 'positive' | 'negative' | 'neutral';
    socialStatus: 'positive' | 'negative' | 'neutral';
  };
  riskAnalysis: {
    level: 'low' | 'medium' | 'high';
    volatility: number;
    alerts: string[];
  };
  recommendation: {
    trend: 'upward' | 'downward' | 'sideways';
    confidenceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
  };
}

const generateMockData = (ticker: string): StockData => {
  const regimes: RegimeType[] = ['bull', 'bear', 'sideways', 'volatile'];
  const regime = regimes[Math.floor(Math.random() * regimes.length)];
  
  return {
    ticker,
    regime,
    confidence: 75 + Math.random() * 20,
    regimeHistory: [
      { date: '2024-01', regime: 'bull' },
      { date: '2024-02', regime: 'bull' },
      { date: '2024-03', regime: 'sideways' },
      { date: '2024-04', regime: 'bull' },
      { date: '2024-05', regime: 'volatile' },
      { date: '2024-06', regime: regime },
    ],
    regimeAgent: null,
    sentimentAnalysis: {
      score: regime === 'bull' ? 0.5 + Math.random() * 0.4 : -0.5 + Math.random() * 0.4,
      newsStatus: regime === 'bull' ? 'positive' : regime === 'bear' ? 'negative' : 'neutral',
      socialStatus: regime === 'bull' ? 'positive' : regime === 'bear' ? 'negative' : 'neutral',
    },
    riskAnalysis: {
      level: regime === 'volatile' ? 'high' : 'medium',
      volatility: 10 + Math.random() * 20,
      alerts: regime === 'volatile' ? ['High volatility detected'] : [],
    },
    recommendation: {
      trend: regime === 'bull' ? 'upward' : regime === 'bear' ? 'downward' : 'sideways',
      confidenceScore: 70 + Math.random() * 25,
      riskLevel: regime === 'volatile' ? 'high' : 'medium',
      summary: regime === 'bull' 
        ? 'Regime & sentiment analysis suggests bullish momentum with moderate risk.'
        : regime === 'bear'
        ? 'Bearish regime detected. Exercise caution in current market conditions.'
        : 'Market showing sideways movement. Wait for clearer signals before major position changes.',
    },
  };
};

export default function App() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Bootstrap auth state from Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegimeAnalyzing, setIsRegimeAnalyzing] = useState(false);

  const handleSearch = async (ticker: string, name?: string) => {
    setSelectedTicker(ticker);
    setStockData(generateMockData(ticker));

    // Fire both agents in parallel
    setIsAnalyzing(true);
    setIsRegimeAnalyzing(true);

    // ---- Sentiment Agent ----
    const sentimentPromise = (async () => {
      try {
        const searchName = name || ticker;
        const response = await fetch(`http://localhost:5000/api/sentiment/${ticker}/${searchName}`);
        const result = await response.json();
        if (result.success && result.data) {
          setStockData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              sentimentAnalysis: {
                ...prev.sentimentAnalysis,
                score: result.data.score,
                newsStatus: result.data.newsStatus,
              },
              recommendation: {
                ...prev.recommendation,
                summary: `Sentiment AI action: ${result.data.action}. Combined with HMM regime analysis.`,
              },
            };
          });
        }
      } catch (err) {
        console.error('Sentiment fetch failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    })();

    // ---- Regime Agent ----
    const regimePromise = (async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/regime/${ticker}`);
        const result = await response.json();
        if (result.success && result.data) {
          setStockData(prev => {
            if (!prev) return prev;
            return { ...prev, regimeAgent: result.data };
          });
        }
      } catch (err) {
        console.error('Regime fetch failed:', err);
      } finally {
        setIsRegimeAnalyzing(false);
      }
    })();

    await Promise.allSettled([sentimentPromise, regimePromise]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Show a tiny loading shimmer while we check session (avoids flash)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-white relative overflow-hidden flex items-center justify-center">
        <Starfield />
        <div style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>
          <div style={{
            fontSize: '2rem',
            animation: 'spin 1.5s linear infinite',
            display: 'inline-block',
            marginBottom: '0.75rem',
          }}>🚀</div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', letterSpacing: '0.1em' }}>INITIALIZING MISSION CONTROL...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A1128] text-white relative overflow-hidden">
        <Starfield />
        
        <div className="relative z-10">
          <Header
            currentRegime={stockData?.regime}
            user={user}
            onAuthClick={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />
          
          <main className="container mx-auto px-4 py-8 space-y-8">
            <LaunchPad onSearch={handleSearch} selectedTicker={selectedTicker} />
            
            {stockData && (
              <>
                <RegimeDisplay 
                  regime={stockData.regime}
                  confidence={stockData.confidence}
                  regimeHistory={stockData.regimeHistory}
                />
                
                <AgentPanel
                  sentimentAnalysis={stockData.sentimentAnalysis}
                  riskAnalysis={stockData.riskAnalysis}
                  isAnalyzing={isAnalyzing}
                  regimeAgent={stockData.regimeAgent}
                  isRegimeAnalyzing={isRegimeAnalyzing}
                />
                
                <CommandCenter recommendation={stockData.recommendation} />
                
                <FlightLogs ticker={stockData.ticker} regime={stockData.regime} />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Auth modal renders on top — does NOT block dashboard access */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthChange={(newUser) => setUser(newUser)}
      />
    </>
  );
}
