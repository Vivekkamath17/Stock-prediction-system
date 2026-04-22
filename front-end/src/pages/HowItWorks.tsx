import { motion } from "motion/react";
import { ArrowRight, ArrowDown } from "lucide-react";

export function HowItWorks() {
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
          HOW THE SYSTEM WORKS
        </h1>
        <p style={{ ...fontMono, color: "#64748b" }} className="text-[16px]">
          A regime-aware multi-agent approach to stock advisory
        </p>
      </div>

      {/* SECTION A - MISSION ARCHITECTURE */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
          <h2 style={fontRajdhani} className="text-2xl tracking-[0.2em] font-semibold text-white uppercase">
            MISSION ARCHITECTURE
          </h2>
        </div>

        {/* Pipeline Diagram */}
        <div className="flex flex-col items-center bg-[#111827] rounded-xl border border-white/10 p-10 py-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full">
            
            <div className="flex flex-col items-center w-full max-w-[200px]" style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #f5c518",
              borderRadius: "6px",
              padding: "12px 16px"
            }}>
              <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[14px] uppercase font-bold tracking-wider mb-2">MARKET DATA</span>
              <span style={fontMono} className="text-[11px] text-[#64748b] text-center">Live Quotes</span>
            </div>

            <ArrowRight className="hidden md:block text-[#f5c518] size-6" />
            <ArrowDown className="block md:hidden text-[#f5c518] size-6" />

            <div className="flex flex-col items-center w-full max-w-[200px]" style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #f5c518",
              borderRadius: "6px",
              padding: "12px 16px"
            }}>
              <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[14px] uppercase font-bold tracking-wider mb-2">REGIME AGENT</span>
              <span style={fontMono} className="text-[11px] text-[#64748b] text-center">HMM Detection</span>
            </div>

            <ArrowRight className="hidden md:block text-[#f5c518] size-6" />
            <ArrowDown className="block md:hidden text-[#f5c518] size-6" />

            <div className="flex flex-col items-center w-full max-w-[200px]" style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #f5c518",
              borderRadius: "6px",
              padding: "12px 16px"
            }}>
              <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[14px] uppercase font-bold tracking-wider mb-2">TECH AGENT</span>
              <span style={fontMono} className="text-[11px] text-[#64748b] text-center">RSI, MACD, MA</span>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full mt-6 md:mt-12">
            
            <div className="flex flex-col items-center w-full max-w-[200px]" style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #f5c518",
              borderRadius: "6px",
              padding: "12px 16px"
            }}>
              <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[14px] uppercase font-bold tracking-wider mb-2">SENTIMENT AGENT</span>
              <span style={fontMono} className="text-[11px] text-[#64748b] text-center">FinBERT NLP</span>
            </div>

            <ArrowRight className="hidden md:block text-[#f5c518] size-6" />
            <ArrowDown className="block md:hidden text-[#f5c518] size-6" />

            <div className="flex flex-col items-center w-full max-w-[200px]" style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #f5c518",
              borderRadius: "6px",
              padding: "12px 16px",
              boxShadow: "0 0 15px rgba(245,197,24,0.15)"
            }}>
              <span style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[14px] uppercase font-bold tracking-wider mb-2">FUSION AGENT</span>
              <span style={fontMono} className="text-[11px] text-[#64748b] text-center">FINAL SIGNAL</span>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION B - INTELLIGENCE MODULES */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
          <h2 style={fontRajdhani} className="text-2xl tracking-[0.2em] font-semibold text-white uppercase">
            INTELLIGENCE MODULES
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "REGIME DETECTION",
              badge: "HMM + Clustering",
              text: "Detects whether the market is in a Bull, Bear, Sideways, or High Volatility state using Hidden Markov Models."
            },
            {
              title: "TECHNICAL ANALYSIS",
              badge: "RSI · MACD · EMA",
              text: "Scores trend direction using RSI, MACD crossovers, and 50/200-day moving average signals."
            },
            {
              title: "SENTIMENT ANALYSIS",
              badge: "FinBERT · NLP",
              text: "Classifies financial news using FinBERT to produce a sentiment polarity score that adjusts the final signal."
            },
            {
              title: "DECISION FUSION",
              badge: "Weighted Ensemble",
              text: "Combines all three agent scores under the active regime to produce a final: Strong Buy / Buy / Hold / Sell / Strong Sell."
            }
          ].map((card, idx) => (
            <div key={idx} className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
              <span style={{
                ...fontMono,
                background: "rgba(245,197,24,0.12)",
                color: "#f5c518",
                border: "1px solid rgba(245,197,24,0.25)",
                fontSize: "10px",
                borderRadius: "3px",
                padding: "2px 8px",
                display: "inline-block",
                marginBottom: "16px"
              }}>
                {card.badge}
              </span>
              <h3 style={fontRajdhani} className="text-lg text-white font-bold tracking-widest mb-3">
                {card.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-[#64748b]">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION C - HOW TO USE */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-[#f5c518] rounded-full" />
          <h2 style={fontRajdhani} className="text-2xl tracking-[0.2em] font-semibold text-white uppercase">
            HOW TO USE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            { num: "1", title: "ENTER A TICKER", text: "Type any NSE/BSE/US stock symbol" },
            { num: "2", title: "AGENTS ACTIVATE", text: "All three agents run automatically" },
            { num: "3", title: "REGIME DETECTED", text: "Market state is classified by HMM" },
            { num: "4", title: "SIGNALS FUSED", text: "Technical + Sentiment + Regime combined" },
            { num: "5", title: "VIEW DETAILS", text: "LLM generates a full advisory report" },
            { num: "6", title: "EXPORT", text: "Download report as a styled HTML file" },
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[40px] leading-none font-bold opacity-80">
                {step.num}
              </div>
              <div className="mt-1">
                <h4 style={fontRajdhani} className="text-white text-lg tracking-wider font-semibold mb-1">
                  {step.title}
                </h4>
                <p className="text-[#64748b] text-sm">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DISCLAIMER */}
      <div style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: "4px solid #f5c518",
        padding: "20px 24px",
        borderRadius: "6px"
      }} className="mt-20">
        <p className="text-[#64748b] text-sm leading-relaxed">
          <strong>DISCLAIMER:</strong> This system is for educational purposes only. 
          AI-generated signals are not financial advice. 
          Always conduct independent research before investing.
        </p>
      </div>

    </motion.div>
  );
}
