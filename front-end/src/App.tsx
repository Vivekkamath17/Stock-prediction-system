import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { LaunchPad } from './components/LaunchPad';
import { RegimeDisplay } from './components/RegimeDisplay';
import { AgentPanel } from './components/AgentPanel';
import { CommandCenter } from './components/CommandCenter';
import { FlightLogs } from './components/FlightLogs';
import { Starfield } from './components/Starfield';
import { AuthModal } from './components/AuthModal';
import { LLMReportEngine } from './components/LLMReportEngine';
import type { LLMReportEngineHandle } from './components/LLMReportEngine';
import { supabase } from './lib/supabase';

import { HowItWorks } from './pages/HowItWorks';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';

export type RegimeType = 'bull' | 'bear' | 'sideways' | 'volatile';

export interface StockData {
  ticker: string;
  displayName?: string;
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
  technicalAgent: {
    rsi_value: number;
    rsi_score: number;
    macd_score: number;
    ma_score: number;
    final_score: number;
    trend_signal: string;
    confidence: number;
  } | null;
  recommendation: {
    trend: 'upward' | 'downward' | 'sideways';
    confidenceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
  };
}

const generateMockData = (ticker: string, displayName?: string): StockData => {
  const regimes: RegimeType[] = ['bull', 'bear', 'sideways', 'volatile'];
  const regime = regimes[Math.floor(Math.random() * regimes.length)];
  
  return {
    ticker,
    displayName: displayName || ticker,
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
    technicalAgent: null,
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

  // Ref to LLMReportEngine — used to call view/export from CommandCenter buttons
  const llmEngineRef = useRef<LLMReportEngineHandle>(null);
  const handleViewDetails = () => llmEngineRef.current?.triggerViewDetails();
  const handleExportReport = () => llmEngineRef.current?.triggerExport();

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
  const [isTechnicalAnalyzing, setIsTechnicalAnalyzing] = useState(false);

  const handleSearch = async (ticker: string, name?: string) => {
    setSelectedTicker(ticker);
    setStockData(generateMockData(ticker, name));

    // Fire all agents in parallel
    setIsAnalyzing(true);
    setIsRegimeAnalyzing(true);
    setIsTechnicalAnalyzing(true);

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

    // ---- Technical Agent ----
    const technicalPromise = (async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/technical/${ticker}`);
        const result = await response.json();
        if (result.success && result.data) {
          setStockData(prev => {
            if (!prev) return prev;
            return { ...prev, technicalAgent: result.data };
          });
        }
      } catch (err) {
        console.error('Technical fetch failed:', err);
      } finally {
        setIsTechnicalAnalyzing(false);
      }
    })();

    await Promise.allSettled([sentimentPromise, regimePromise, technicalPromise]);
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
      <div className="min-h-screen bg-[#0A1128] text-white relative">
        <Starfield />
        
        <div className="relative z-10">
          <Header
            currentRegime={stockData?.regimeAgent?.regime || ''}
            user={user}
            onAuthClick={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />
          
          <Routes>
            <Route path="/" element={
              <main className="container mx-auto px-4 py-8 space-y-8">
                <LaunchPad onSearch={handleSearch} selectedTicker={selectedTicker} user={user} />
                
                {stockData && (
                  <>
                    <RegimeDisplay 
                      regimeData={stockData.regimeAgent}
                      technicalData={stockData.technicalAgent}
                      isLoading={isRegimeAnalyzing || isTechnicalAnalyzing}
                    />
                    
                    <AgentPanel
                      displayName={stockData.displayName}
                      sentimentAnalysis={stockData.sentimentAnalysis}
                      technicalAgent={stockData.technicalAgent}
                      isTechnicalAnalyzing={isTechnicalAnalyzing}
                      isAnalyzing={isAnalyzing}
                      regimeAgent={stockData.regimeAgent}
                      isRegimeAnalyzing={isRegimeAnalyzing}
                    />
                    
                    <CommandCenter
                      recommendation={stockData.recommendation}
                      onViewDetails={handleViewDetails}
                      onExportReport={handleExportReport}
                    />
                    
                    <LLMReportEngine
                      ref={llmEngineRef}
                      ticker={stockData.ticker}
                      displayName={stockData.displayName}
                      exchange="NSE"
                      technicalOutput={stockData.technicalAgent}
                      regimeOutput={stockData.regimeAgent}
                      sentimentOutput={stockData.sentimentAnalysis}
                      recommendation={stockData.recommendation}
                    />
                    
                    <FlightLogs 
                      ticker={stockData.ticker} 
                      displayName={stockData.displayName} 
                      regime={stockData.regime} 
                    />
                  </>
                )}
              </main>
            } />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
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
