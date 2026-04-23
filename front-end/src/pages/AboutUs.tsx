import { useRef, useEffect } from 'react';
import { Rocket, Server, Monitor } from 'lucide-react';
import StarfieldBg from '../components/StarfieldBg';

function useInView() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('animate-fade-up'); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
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

const metrics = [
  { value: '3', label: 'AI AGENTS', glow: '#1E88E5' },
  { value: '5+', label: 'INDICATORS', glow: '#FF6B35' },
  { value: 'LIVE', label: 'MARKET DATA', glow: '#00E676' },
  { value: 'LLM', label: 'REPORT ENGINE', glow: '#9C27B0' },
];

const backendStack = ['Python 3.11', 'Flask / FastAPI', 'yfinance', 'pandas · pandas_ta', 'hmmlearn', 'FinBERT (HuggingFace)', 'Groq API (llama-3.3-70b)'];
const frontendStack = ['React 18', 'Recharts / Chart.js', 'React Router v6', 'Supabase (Auth + DB)', 'Rajdhani + JetBrains Mono'];

export function AboutUs() {
  const overviewRef = useInView();
  const stackRef = useInView();
  const commandRef = useInView();

  return (
    <div style={{ background: '#0A1128', minHeight: '100vh', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <StarfieldBg />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px',
        }}>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 16px',
            background: 'linear-gradient(135deg, #FF6B35, #1E88E5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>About the Project</h1>
          <p style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 14, color: '#64748b', marginBottom: 6 }}>
            Final Year Engineering Capstone
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 14, color: '#64748b', marginBottom: 40 }}>
            AI-Powered Regime-Aware Stock Advisory System
          </p>
          <Rocket size={48} color="#FF6B35" className="animate-bob" style={{ animation: 'bob 3s ease-in-out infinite' }} />
        </section>

        {/* SECTION A: STOCK OVERVIEW */}
        <section style={{ background: '#0d1530', padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }} ref={overviewRef}>
            <SectionHeading>Stock Overview</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
              {/* Left */}
              <div>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20 }}>
                  The Regime-Aware Multi-Agent Stock Advisory System is a final-year engineering project that demonstrates how multiple specialized AI agents can collaborate to produce smarter, more context-aware financial analysis than any single model.
                </p>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 28 }}>
                  Unlike conventional prediction tools that output a single number, this system first detects the prevailing market regime using Hidden Markov Models, then applies technical, sentiment, and risk analysis calibrated to that specific market environment.
                </p>
                <blockquote style={{
                  borderLeft: '3px solid #FF6B35', paddingLeft: 20, margin: 0,
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 13,
                  color: '#FF6B35', fontStyle: 'italic', lineHeight: 1.8,
                }}>
                  "We don't predict exact prices.<br />
                  We detect regimes and provide<br />
                  risk-adjusted advisory signals."
                </blockquote>
              </div>
              {/* Right — metric cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {metrics.map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${m.glow}`,
                    borderRadius: 12, padding: '20px 16px', textAlign: 'center',
                    height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      fontFamily: 'Rajdhani, sans-serif', fontSize: 42, fontWeight: 800,
                      background: 'linear-gradient(135deg, #FF6B35, #1E88E5)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                    }}>{m.value}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginTop: 6 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: TECHNOLOGY STACK */}
        <section style={{ background: '#0A1128', padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }} ref={stackRef}>
            <SectionHeading>Technology Stack</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Backend */}
              <div style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Server size={20} color="#FF6B35" />
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, textTransform: 'uppercase', color: '#FF6B35', margin: 0, letterSpacing: 1 }}>Backend</h3>
                </div>
                {backendStack.map((item, i) => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: i < backendStack.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E88E5', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
                  </div>
                ))}
              </div>
              {/* Frontend */}
              <div style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Monitor size={20} color="#FF6B35" />
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, textTransform: 'uppercase', color: '#FF6B35', margin: 0, letterSpacing: 1 }}>Frontend</h3>
                </div>
                {frontendStack.map((item, i) => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: i < frontendStack.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B35', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION C: STOCK COMMAND */}
        <section style={{ background: '#0d1530', padding: '80px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} ref={commandRef}>
            <SectionHeading>Stock Command</SectionHeading>
            <div style={{
              maxWidth: 600, width: '100%',
              background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '40px 36px',
              textAlign: 'center',
            }}>
              <Rocket size={36} color="#FF6B35" style={{ animation: 'bob 3s ease-in-out infinite', marginBottom: 16 }} />
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: 2 }}>Veermata Jijabai Technological Institute</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>B.E. / B.Tech — Computer Science</p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, color: '#e2e8f0', marginBottom: 4 }}>Developers</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Vivek Kamath, Tanmay More</div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://github.com/Vivekkamath17/Stock-prediction-system" style={{
                  padding: '10px 20px', border: '1px solid #FF6B35', borderRadius: 8,
                  color: '#FF6B35', textDecoration: 'none',
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
                  transition: 'all 0.2s',
                }}>🔗 GITHUB REPO →</a>
                <a href="#" style={{
                  padding: '10px 20px', border: '1px solid #1E88E5', borderRadius: 8,
                  color: '#1E88E5', textDecoration: 'none',
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
                  transition: 'all 0.2s',
                }}>📄 PROJECT REPORT →</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
