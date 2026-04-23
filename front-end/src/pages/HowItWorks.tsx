import { useEffect, useRef } from 'react';
import { Database, Cpu, Activity, MessageSquare, Zap, Target, BarChart2, AlertTriangle, ChevronDown } from 'lucide-react';
import StarfieldBg from '../components/StarfieldBg';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('animate-fade-up'); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const SectionHeading = ({ children }) => (
  <div style={{ marginBottom: 48 }}>
    <h2 style={{
      fontFamily: 'Rajdhani, sans-serif', fontSize: 36, fontWeight: 800,
      letterSpacing: 3, textTransform: 'uppercase', color: '#e2e8f0', margin: 0,
    }}>{children}</h2>
    <div style={{ width: 40, height: 3, background: '#FF6B35', marginTop: 10, borderRadius: 2 }} />
  </div>
);

const agents = [
  {
    icon: Activity, name: 'REGIME DETECTION AGENT', accent: '#9C27B0',
    bg: 'rgba(156,39,176,0.15)', glow: 'rgba(156,39,176,0.3)',
    desc: "The system's foundation. Uses Hidden Markov Models to classify the market into one of four states: Bull, Bear, Sideways, or High Volatility. Every other agent adjusts its interpretation based on the active regime.",
    badges: ['HMM', 'Clustering', '4 States'],
  },
  {
    icon: BarChart2, name: 'TECHNICAL ANALYSIS AGENT', accent: '#1E88E5',
    bg: 'rgba(30,136,229,0.15)', glow: 'rgba(30,136,229,0.3)',
    desc: 'Analyzes price action using RSI (momentum), MACD (trend direction), and 50/200-day moving average crossovers. Produces a scored signal from Strong Bullish to Strong Bearish with a confidence percentage.',
    badges: ['RSI-14', 'MACD', 'EMA 50/200'],
  },
  {
    icon: MessageSquare, name: 'SENTIMENT ANALYSIS AGENT', accent: '#00E676',
    bg: 'rgba(0,230,118,0.15)', glow: 'rgba(0,230,118,0.3)',
    desc: 'Scrapes financial news and processes it through FinBERT — a language model fine-tuned on financial text. Produces a sentiment polarity score from Very Negative to Very Positive that shifts the advisory signal.',
    badges: ['FinBERT', 'NLP', 'News + Social'],
  },
  {
    icon: Target, name: 'DECISION FUSION AGENT', accent: '#FF6B35',
    bg: 'rgba(255,107,53,0.15)', glow: 'rgba(255,107,53,0.3)',
    desc: 'The command center. Weights outputs from all three agents based on the active market regime. Issues the final advisory signal: Strong Buy / Buy / Hold / Sell / Strong Sell, with an LLM-generated detailed report via Groq.',
    badges: ['Weighted Fusion', 'LLM Report', 'llama-3.3-70b'],
  },
];

const steps = [
  { title: 'LAUNCH TARGET', body: 'Enter any stock name or ticker in the search bar. Select from the dropdown — all stocks are sourced from the database to ensure valid symbols.' },
  { title: 'AGENTS ACTIVATE', body: 'All three intelligence agents run simultaneously in the background: Regime, Technical, and Sentiment.' },
  { title: 'REGIME CLASSIFIED', body: 'The HMM model classifies the current market state. This becomes the lens through which all other signals are interpreted.' },
  { title: 'SIGNALS FUSED', body: 'The Decision Fusion Agent weighs all inputs, adjusting for the active regime, and produces a final directional signal with confidence score.' },
  { title: 'INTELLIGENCE REPORT', body: "Click VIEW DETAILS to trigger the LLM Report Engine. Groq's llama-3.3-70b synthesizes all agent outputs and your news feed into a structured advisory document." },
  { title: 'EXPORT STOCK LOG', body: 'Download a fully styled HTML advisory report with regime context, technical signals, sentiment analysis, and top news highlights.' },
];

const pipelineNodes = [
  { icon: Database, name: 'MARKET DATA', desc: 'yfinance · OHLCV' },
  { icon: Cpu, name: 'REGIME AGENT', desc: 'HMM · Clustering' },
  { icon: Activity, name: 'TECH AGENT', desc: 'RSI · MACD · EMA' },
  { icon: MessageSquare, name: 'SENTIMENT AGENT', desc: 'FinBERT · NLP' },
  { icon: Zap, name: 'FUSION AGENT', desc: 'Weighted Decision' },
  { icon: Target, name: 'ADVISORY OUTPUT', desc: 'Signal + Report' },
];

export function HowItWorks() {
  const archRef = useInView();
  const modulesRef = useInView();
  const briefingRef = useInView();
  const disclaimerRef = useInView();

  return (
    <div style={{ background: '#0A1128', minHeight: '100vh', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <StarfieldBg />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '0 24px',
        }}>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 20px',
            background: 'linear-gradient(135deg, #FF6B35, #1E88E5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>How the System Works</h1>
          <p style={{
            fontSize: 18, color: '#94a3b8', lineHeight: 1.7,
            maxWidth: 600, margin: '0 0 40px',
          }}>
            A regime-aware multi-agent intelligence system that adapts to changing market conditions
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
            {['⚡ 3 AI AGENTS', '📡 REAL-TIME DATA', '🎯 5+ INDICATORS'].map(label => (
              <div key={label} style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '2px solid #FF6B35', borderRadius: 8, padding: '10px 20px',
                fontFamily: 'Rajdhani, sans-serif', fontSize: 13, letterSpacing: 2,
                textTransform: 'uppercase', color: '#e2e8f0',
                animation: 'pulse-ring 2s infinite',
              }}>{label}</div>
            ))}
          </div>
          <div style={{ animation: 'bob 2s ease-in-out infinite', color: '#64748b' }}>
            <ChevronDown size={28} />
          </div>
        </section>

        {/* SECTION A: STOCK ARCHITECTURE */}
        <section style={{ background: '#0d1530', padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }} ref={archRef}>
            <SectionHeading>Stock Architecture</SectionHeading>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {pipelineNodes.map((node, i) => {
                const Icon = node.icon;
                return (
                  <div key={node.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.25)',
                      borderRadius: 12, padding: '20px 24px', minWidth: 140, textAlign: 'center',
                      transition: 'all 0.3s', cursor: 'default',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#1E88E5'; e.currentTarget.style.boxShadow='0 0 20px rgba(30,136,229,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(30,136,229,0.25)'; e.currentTarget.style.boxShadow='none'; }}
                    >
                      <Icon size={28} color="#1E88E5" style={{ marginBottom: 8 }} />
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#FFD600', fontWeight: 700, marginBottom: 4 }}>{node.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 10, color: '#64748b' }}>{node.desc}</div>
                    </div>
                    {i < pipelineNodes.length - 1 && (
                      <div style={{ color: '#FF6B35', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>→</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION B: INTELLIGENCE MODULES */}
        <section style={{ background: '#0A1128', padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }} ref={modulesRef}>
            <SectionHeading>Intelligence Modules</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {agents.map(agent => {
                const Icon = agent.icon;
                return (
                  <div key={agent.name} style={{
                    background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                    border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 16, padding: 28,
                    transition: 'all 0.3s', cursor: 'default',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 8px 32px ${agent.glow}`; e.currentTarget.style.borderColor=agent.glow; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: agent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} color={agent.accent} />
                      </div>
                      <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 17, fontWeight: 700, color: agent.accent, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{agent.name}</h3>
                    </div>
                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 16px' }}>{agent.desc}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {agent.badges.map(b => (
                        <span key={b} style={{
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 4, padding: '3px 10px',
                          fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 10, color: '#94a3b8',
                        }}>{b}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION C: STOCK BRIEFING */}
        <section style={{ background: '#0d1530', padding: '80px 0' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }} ref={briefingRef}>
            <SectionHeading>Stock Briefing</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? 0 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF6B35, #1E88E5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
                    }}>{i + 1}</div>
                    {i < steps.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 40, borderLeft: '2px dashed rgba(255,107,53,0.3)', marginTop: 4, marginBottom: 4 }} />
                    )}
                  </div>
                  <div style={{
                    background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    padding: '20px 24px', flex: 1, marginBottom: i < steps.length - 1 ? 8 : 0,
                  }}>
                    <h4 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 17, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: 1 }}>{step.title}</h4>
                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section style={{ background: '#0A1128', padding: '60px 24px' }}>
          <div ref={disclaimerRef} style={{
            maxWidth: 700, margin: '0 auto',
            background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #FF6B35',
            borderRadius: 12, padding: '24px 28px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <AlertTriangle size={20} color="#FF6B35" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
              This system provides AI-generated analysis for educational purposes only. Not financial advice.
              Always conduct independent research before making investment decisions.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
