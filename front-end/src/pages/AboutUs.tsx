import { motion } from "motion/react";

export function AboutUs() {
  const fontRajdhani = { fontFamily: "'Rajdhani', sans-serif" };
  const fontMono = { fontFamily: "'Space Mono', monospace" };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 max-w-5xl"
    >
      {/* HERO SECTION */}
      <div className="text-center mb-16">
        <h1 style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[48px] font-bold tracking-wide uppercase mb-3">
          ABOUT THE PROJECT
        </h1>
        <p style={{ ...fontMono, color: "#64748b" }} className="text-[14px]">
          Final Year Capstone — AI-Powered Stock Advisory System
        </p>
      </div>

      {/* SECTION A - PROJECT OVERVIEW */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
              <h2 style={fontRajdhani} className="text-2xl tracking-[0.2em] font-semibold text-white uppercase">
                PROJECT OVERVIEW
              </h2>
            </div>
            
            <p className="text-[#e2e8f0] leading-relaxed text-base">
              The Regime-Aware Multi-Agent Stock Advisory System demonstrates
              how specialized AI agents can collaborate to produce context-aware
              financial analysis — adapting to changing market conditions in
              real time.
            </p>
            <p className="text-[#64748b] leading-relaxed text-base">
              Rather than predicting exact prices, the system detects the
              current market regime and issues risk-adjusted advisory signals
              calibrated to that specific environment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "3", label: "AI AGENTS" },
              { val: "5+", label: "INDICATORS" },
              { val: "LIVE", label: "DATA" },
              { val: "LLM", label: "REPORTS" }
            ].map((stat, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#1a2235] transition-colors">
                <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[36px] font-bold leading-none mb-2">
                  {stat.val}
                </span>
                <span style={fontMono} className="text-[#64748b] text-[12px] tracking-wider uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION B - TECHNOLOGY STACK */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
          <h2 style={fontRajdhani} className="text-2xl tracking-[0.2em] font-semibold text-white uppercase">
            TECHNOLOGY STACK
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#111827] border border-white/5 rounded-xl p-8 md:p-12">
          
          <div>
            <h3 style={fontRajdhani} className="text-[#e2e8f0] text-xl font-bold tracking-widest mb-6 border-b border-white/10 pb-4">
              BACKEND
            </h3>
            <ul className="space-y-4">
              {[
                "Python 3.11",
                "Flask / Express",
                "yfinance",
                "pandas_ta",
                "hmmlearn",
                "FinBERT (HuggingFace)",
                "Groq API"
              ].map((tech, i) => (
                <li key={i} className="flex items-center gap-3 text-[#e2e8f0]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#f5c518] inline-block" />
                  <span style={fontMono} className="text-[14px]">{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={fontRajdhani} className="text-[#e2e8f0] text-xl font-bold tracking-widest mb-6 border-b border-white/10 pb-4">
              FRONTEND
            </h3>
            <ul className="space-y-4">
              {[
                "React 18",
                "Recharts / Chart.js",
                "React Router",
                "Rajdhani + Space Mono"
              ].map((tech, i) => (
                <li key={i} className="flex items-center gap-3 text-[#e2e8f0]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#f5c518] inline-block" />
                  <span style={fontMono} className="text-[14px]">{tech}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* SECTION C - MISSION STATEMENT */}
      <section className="w-full text-center py-12" style={{
        borderLeft: "2px solid #f5c518",
        borderRight: "2px solid #f5c518",
        background: "rgba(17, 24, 39, 0.5)"
      }}>
        <p style={{ ...fontMono, color: "#f5c518" }} className="text-[18px] md:text-[22px] leading-relaxed max-w-3xl mx-auto italic px-6">
          "We don't predict exact prices.<br/>
          We detect regimes and provide<br/>
          risk-adjusted, agent-based advisory signals."
        </p>
      </section>

    </motion.div>
  );
}
