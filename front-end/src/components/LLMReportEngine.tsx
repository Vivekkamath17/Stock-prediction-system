/*
 * LLM REPORT ENGINE — Regime-Aware Multi-Agent Advisory System
 * ─────────────────────────────────────────────────────────────
 * This component reads agent outputs from existing frontend state.
 * NO user input required — data flows automatically when a stock
 * is selected and agents have completed their analysis.
 *
 * SETUP:
 *   1. Get free Groq API key: https://console.groq.com
 *      (Free tier: ~14,400 req/day on llama-3.3-70b-versatile)
 *   2. Add to front-end/.env: VITE_GROQ_API_KEY=gsk_your_key_here
 *   3. Start backend server (news CSV endpoint auto-serves from
 *      server/news.csv — no manual path needed)
 *   4. Select any stock in the UI → agents run → click VIEW DETAILS
 *
 * DATA FLOW:
 *   Stock selected → agents run (existing pipeline) →
 *   results rendered in UI → VIEW DETAILS clicked →
 *   this component reads existing state + fetches news CSV →
 *   builds prompt → calls Groq API → renders report →
 *   EXPORT REPORT → downloads styled HTML file
 *
 * NO FORMS. NO MANUAL INPUT. FULLY AUTOMATIC.
 */

import {
  useState, useRef, useCallback, useEffect,
  forwardRef, useImperativeHandle,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp, FileText, Download,
  Loader2, RefreshCw, AlertTriangle, CheckCircle,
  Clock,
} from 'lucide-react';
import type { StockData } from '../App';

// ── Groq API key — set VITE_GROQ_API_KEY in front-end/.env ────────
// Get free key at https://console.groq.com
const GROQ_API_KEY = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GROQ_API_KEY ?? '';

// ── Types ──────────────────────────────────────────────────────────
interface NewsRow { [key: string]: string }

export interface LLMReportEngineHandle {
  triggerViewDetails: () => void;
  triggerExport:      () => void;
}

export interface LLMReportEngineProps {
  ticker:          string;
  displayName?:    string;
  exchange?:       string;
  technicalOutput: StockData['technicalAgent'];
  regimeOutput:    StockData['regimeAgent'];
  sentimentOutput: StockData['sentimentAnalysis'];
  recommendation:  StockData['recommendation'];
  onReportGenerated?: (report: string) => void;
}

// ── Palette (matches existing mission-control UI exactly) ──────────
const C = {
  bg:      '#111827',
  bgDeep:  '#0a0e1a',
  bgInput: '#1a2235',
  gold:    '#f5c518',
  blue:    '#3b82f6',
  red:     '#ef4444',
  green:   '#22c55e',
  purple:  '#a855f7',
  border:  'rgba(255,255,255,0.08)',
  text:    '#e2e8f0',
  muted:   '#64748b',
} as const;

// ── Regime colour map ──────────────────────────────────────────────
function regimeColors(regime: string) {
  const r = regime?.toUpperCase() ?? '';
  if (r === 'BULL')     return { bg: 'rgba(34,197,94,0.15)',  text: C.green  };
  if (r === 'BEAR')     return { bg: 'rgba(239,68,68,0.15)',  text: C.red    };
  if (r === 'VOLATILE' || r === 'HIGHVOLATILITY')
                        return { bg: 'rgba(168,85,247,0.15)', text: C.purple };
  return               { bg: 'rgba(245,197,24,0.15)',  text: C.gold   };
}

// ── Prompt builder ─────────────────────────────────────────────────
function buildPrompt(props: LLMReportEngineProps, headlines: NewsRow[]): string {
  const { ticker, displayName, exchange, technicalOutput, regimeOutput, sentimentOutput, recommendation } = props;

  const rsi        = technicalOutput?.rsi_value?.toFixed(1)  ?? 'N/A';
  const macd       = technicalOutput?.macd_score != null ? (technicalOutput.macd_score > 0 ? 'Bullish' : technicalOutput.macd_score < 0 ? 'Bearish' : 'Neutral') : 'N/A';
  const trend      = technicalOutput?.trend_signal ?? recommendation?.trend ?? 'N/A';
  const regime     = regimeOutput?.regime ?? recommendation?.trend ?? 'N/A';
  const confidence = recommendation?.confidenceScore?.toFixed(0) ?? 'N/A';
  const risk       = recommendation?.riskLevel ?? 'N/A';
  const sentScore  = sentimentOutput?.score?.toFixed(2) ?? 'N/A';
  const sentLabel  = sentimentOutput?.newsStatus ?? 'N/A';

  const techStr = technicalOutput
    ? JSON.stringify(technicalOutput, null, 2)
    : '(Technical agent data not yet available)';

  const regimeStr = regimeOutput
    ? JSON.stringify(regimeOutput, null, 2)
    : '(Regime agent data not yet available)';

  const sentStr = sentimentOutput
    ? JSON.stringify(sentimentOutput, null, 2)
    : '(Sentiment agent data not yet available)';

  const newsBlock = headlines.length
    ? headlines.map((h, i) => {
        const hl  = h['headline'] || h['title'] || h['news'] || Object.values(h)[0] || '';
        const src = h['source'] || h['publisher'] || 'N/A';
        const dt  = h['date']   || h['published_date'] || h['publishedat'] || 'N/A';
        const sc  = h['sentiment_score'] || h['score'] || 'N/A';
        return `${i + 1}. "${hl}"\n    Source: ${src} | Date: ${dt} | Sentiment: ${sc}`;
      }).join('\n')
    : '(News feed unavailable — no CSV data loaded)';

  return `You are an expert quantitative stock market analyst AI embedded in a professional multi-agent advisory system. Your job is to synthesize outputs from three specialized AI agents and produce a detailed, actionable advisory report.

ANALYSIS TARGET
Stock: ${displayName || ticker} (${ticker}) | Exchange: ${exchange ?? 'NSE'} | Report Generated: ${new Date().toUTCString()}

━━━ TECHNICAL ANALYSIS AGENT ━━━
${techStr}
Key Metrics → RSI: ${rsi} | MACD: ${macd} | Trend: ${trend}

━━━ MARKET REGIME AGENT ━━━
${regimeStr}
Key Metrics → Regime: ${regime} | Confidence: ${confidence}% | Risk: ${risk}

━━━ SENTIMENT ANALYSIS AGENT ━━━
${sentStr}
Key Metrics → Score: ${sentScore} | Polarity: ${sentLabel}

━━━ LIVE NEWS FEED (from regime agent — top 10 by sentiment impact) ━━━
${newsBlock}

━━━ REPORT INSTRUCTIONS ━━━
Write a complete advisory report with EXACTLY these 9 sections.
Use the section headings in ALL CAPS exactly as written below.
Be specific — reference the actual numbers and data provided above.
Do not be generic. Every insight must trace back to the data.

EXECUTIVE SUMMARY
3–4 sentences. Plain language. What is the overall situation for ${ticker} right now, combining all three agent signals?

MARKET REGIME ANALYSIS
Explain what the ${regime} regime means. What does the HMM state imply about persistence and likely transitions? How does this regime specifically affect ${ticker}?

TECHNICAL SIGNALS
Interpret RSI ${rsi} precisely (overbought/oversold/neutral zone). Explain what ${macd} MACD means for near-term price action. What does ${trend} signal for entry/exit timing?

SENTIMENT ANALYSIS
Explain the ${sentScore} sentiment score in context. What themes are driving the ${sentLabel} polarity? How strongly is news sentiment aligning or conflicting with the technical signals?

KEY NEWS HIGHLIGHTS
Pick the 3–5 most impactful headlines from the news feed above. For each: quote the headline, explain why it matters specifically for ${displayName || ticker}, and what directional pressure it creates.

RISK ASSESSMENT
Explain why risk is currently ${risk.toUpperCase()} for ${displayName || ticker}. List 3 specific risk factors visible in the data. What would need to change for risk to decrease?

FINAL ADVISORY SIGNAL
State clearly: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
Confidence: X%
Reasoning: one paragraph tying regime + technical + sentiment together into the final signal. Be decisive.

RECOMMENDED ACTION PLAN
Bullet 1: What to do NOW based on current signals
Bullet 2: What specific indicator to WATCH for signal change
Bullet 3: What INVALIDATES this advisory (the stop-loss trigger)

DISCLAIMER
Standard: AI-generated analysis, not financial advice, past performance does not guarantee future results.`;
}

// ── Section renderer — gold headings, body text ────────────────────
function ReportBody({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12.5, color: C.text, lineHeight: 1.9 }}>
      {text.split('\n').map((line, i) => {
        const isHeading = /^[A-Z][A-Z\s\/]{3,}$/.test(line.trim()) && line.trim().length < 60;
        if (isHeading) {
          return (
            <div key={i} style={{
              color: C.gold, fontWeight: 700, fontSize: 11,
              letterSpacing: '2px', marginTop: 22, marginBottom: 4,
              fontFamily: "'Space Mono', monospace",
            }}>
              {line}
            </div>
          );
        }
        return (
          <div key={i} style={{ minHeight: line.trim() === '' ? 10 : 'auto' }}>
            {line || '\u00A0'}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export const LLMReportEngine = forwardRef<LLMReportEngineHandle, LLMReportEngineProps>(
  (props, ref) => {
    const { ticker, displayName, exchange, regimeOutput, recommendation, onReportGenerated } = props;

    // State
    const [report,      setReport]      = useState('');
    const [error,       setError]       = useState('');
    const [isLoading,   setIsLoading]   = useState(false);
    const [panelOpen,   setPanelOpen]   = useState(false);
    const [hasReport,   setHasReport]   = useState(false);
    const [headlines,   setHeadlines]   = useState<NewsRow[]>([]);
    const [newsMissing, setNewsMissing] = useState(false);
    const [tokenUsage,  setTokenUsage]  = useState<{ total: number; prompt: number; completion: number } | null>(null);
    const [genTime,     setGenTime]     = useState<number>(0);
    const [toast,       setToast]       = useState('');
    const [retryIn,     setRetryIn]     = useState(0);

    const toastRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryRef   = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Toast ────────────────────────────────────────────────────
    const showToast = (msg: string) => {
      setToast(msg);
      if (toastRef.current) clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(''), 2500);
    };

    useEffect(() => () => {
      if (toastRef.current) clearTimeout(toastRef.current);
      if (retryRef.current) clearInterval(retryRef.current);
    }, []);

    // ── Fetch news from backend ──────────────────────────────────
    const fetchNews = async (): Promise<NewsRow[]> => {
      try {
        const res = await fetch('http://localhost:5000/api/news-headlines', { signal: AbortSignal.timeout(6000) });
        const json = await res.json();
        if (json.headlines && json.headlines.length > 0) {
          setNewsMissing(false);
          return json.headlines as NewsRow[];
        }
        setNewsMissing(true);
        return [];
      } catch {
        setNewsMissing(true);
        return [];
      }
    };

    // ── Core: call Groq ──────────────────────────────────────────
    const callGroq = useCallback(async (hdl: NewsRow[]) => {
      if (!GROQ_API_KEY) {
        setError('API_KEY_MISSING');
        return;
      }

      const agentsReady = props.technicalOutput || props.regimeOutput || props.sentimentOutput;
      if (!agentsReady) {
        setError('NO_AGENT_DATA');
        return;
      }

      setIsLoading(true);
      setError('');
      const t0 = Date.now();

      try {
        const prompt = buildPrompt(props, hdl);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1800,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            setError('RATE_LIMIT');
            // auto-retry countdown
            let secs = 60;
            setRetryIn(secs);
            retryRef.current = setInterval(() => {
              secs -= 1;
              setRetryIn(secs);
              if (secs <= 0) {
                clearInterval(retryRef.current!);
                setRetryIn(0);
                // auto-retry once
                callGroq(hdl);
              }
            }, 1000);
          } else if (res.status === 401) {
            setError('INVALID_KEY');
          } else {
            setError(`API_ERROR:${res.status}:${data?.error?.message ?? 'Unknown error'}`);
          }
          return;
        }

        const content: string = data.choices?.[0]?.message?.content ?? '';
        setReport(content);
        setHasReport(true);
        setPanelOpen(true);
        setGenTime(Math.round((Date.now() - t0) / 100) / 10);
        if (data.usage) setTokenUsage({ total: data.usage.total_tokens, prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens });
        onReportGenerated?.(content);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`NETWORK_ERROR:${msg}`);
      } finally {
        setIsLoading(false);
      }
    }, [props, onReportGenerated]);

    // ── VIEW DETAILS ─────────────────────────────────────────────
    const triggerViewDetails = useCallback(async () => {
      if (!props.ticker) { setError('NO_AGENT_DATA'); setPanelOpen(true); return; }
      if (retryRef.current) clearInterval(retryRef.current);

      // Fetch news first (soft-fail)
      const hdl = await fetchNews();
      setHeadlines(hdl);
      await callGroq(hdl);
      // Scroll to panel
      setTimeout(() => {
        document.getElementById('llm-report-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }, [props.ticker, callGroq]);

    // ── EXPORT ───────────────────────────────────────────────────
    const triggerExport = useCallback(() => {
      if (!hasReport) return;

      const t   = ticker || 'STOCK';
      const dt  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fn  = `${t}_Advisory_Report_${dt}.html`;

      const regime  = regimeOutput?.regime ?? recommendation?.trend ?? 'N/A';
      const conf    = recommendation?.confidenceScore?.toFixed(0) ?? '—';
      const risk    = recommendation?.riskLevel ?? '—';
      const rc      = regimeColors(regime);

      /* final signal extraction */
      const m = report.match(/FINAL ADVISORY SIGNAL[\s\S]*?\n([\s\S]*?)(?:\n\n|\nRECOMMENDED)/i);
      const sigText = m ? m[1].trim().slice(0, 100) : '';

      const sigColor = /STRONG BUY/i.test(sigText) ? C.green
                     : /BUY/i.test(sigText)         ? '#86efac'
                     : /STRONG SELL/i.test(sigText) ? C.red
                     : /SELL/i.test(sigText)        ? '#fca5a5'
                     : C.gold;

      const formattedReport = report
        .split('\n')
        .map(line => {
          const isH = /^[A-Z][A-Z\s\/]{3,}$/.test(line.trim()) && line.trim().length < 60;
          if (isH) return `<div class="sh">${line}</div>`;
          if (line.trim() === '') return '<div class="gap"></div>';
          return `<p>${line}</p>`;
        }).join('');

      const newsRows = headlines.slice(0, 10).map((h, i) => {
        const hl  = h['headline'] || h['title'] || h['news'] || Object.values(h)[0] || '';
        const src = h['source'] || 'N/A';
        const dt2 = h['date']   || h['published_date'] || 'N/A';
        const sc  = h['sentiment_score'] || h['score'] || '';
        const scNum = parseFloat(sc);
        const scColor = isNaN(scNum) ? C.muted : scNum >= 0 ? C.green : C.red;
        return `<tr><td>${i + 1}</td><td>${hl}</td><td>${src}</td><td>${dt2}</td><td style="color:${scColor}">${sc}</td></tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t} Advisory Report — ${new Date().toLocaleDateString('en-IN')}</title>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0e1a;color:#e2e8f0;font-family:'Space Mono',monospace;padding:40px 20px;line-height:1.7}
.wrap{max-width:860px;margin:0 auto}
h1{font-family:'Rajdhani',sans-serif;font-size:2.2rem;letter-spacing:4px;color:${C.gold};margin-bottom:4px}
.sub{color:${C.muted};font-size:11px;letter-spacing:3px;margin-bottom:32px}
.summary{display:flex;flex-wrap:wrap;gap:20px;background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:24px;margin-bottom:28px;align-items:center}
.pill{padding:6px 16px;border-radius:20px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px}
.conf-wrap{flex:1;min-width:160px}.conf-label{font-size:10px;color:${C.muted};letter-spacing:1px;margin-bottom:6px}
.conf-bar{height:8px;background:#1a2235;border-radius:4px;overflow:hidden}
.conf-fill{height:100%;background:linear-gradient(90deg,rgba(245,197,24,.5),${C.gold});border-radius:4px}
.conf-pct{text-align:right;font-size:11px;color:${C.gold};margin-top:4px}
.report-body{background:#111827;border-left:4px solid ${C.gold};border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:28px;margin-bottom:28px}
.sh{color:${C.gold};font-weight:700;font-size:11px;letter-spacing:2px;display:block;margin-top:24px;margin-bottom:6px;text-transform:uppercase}
p{color:#e2e8f0;font-size:12.5px;margin-bottom:4px}
.gap{height:10px}
table{width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden;margin-bottom:28px}
th{background:#1a2235;color:${C.gold};font-family:'Rajdhani',sans-serif;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:2px}
td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.05);font-size:11.5px;vertical-align:top}
tr:last-child td{border:none}
.sec-title{font-family:'Rajdhani',sans-serif;color:${C.gold};letter-spacing:3px;font-size:13px;margin-bottom:12px;text-transform:uppercase}
footer{text-align:center;border-top:1px solid rgba(255,255,255,.08);padding-top:20px;margin-top:20px;color:${C.muted};font-size:10px;letter-spacing:2px;line-height:2}
</style>
</head>
<body>
<div class="wrap">
<h1>⚡ ${t} ADVISORY REPORT</h1>
<p class="sub">${exchange ?? 'NSE'} · ${new Date().toUTCString()} · REGIME-AWARE MULTI-AGENT SYSTEM</p>

<div class="summary">
  <div><div class="conf-label">REGIME</div>
  <span class="pill" style="background:${rc.bg};color:${rc.text}">${regime.toUpperCase()}</span></div>
  <div class="conf-wrap"><div class="conf-label">MISSION CONFIDENCE</div>
  <div class="conf-bar"><div class="conf-fill" style="width:${conf}%"></div></div>
  <div class="conf-pct">${conf}%</div></div>
  <div><div class="conf-label">RISK LEVEL</div>
  <span class="pill" style="background:rgba(239,68,68,.15);color:${C.red}">${risk?.toUpperCase()}</span></div>
  <div><div class="conf-label">FINAL SIGNAL</div>
  <span class="pill" style="background:rgba(245,197,24,.1);color:${sigColor}">${sigText || 'SEE REPORT'}</span></div>
</div>

<div class="report-body">${formattedReport}</div>

${headlines.length > 0 ? `<p class="sec-title">TOP NEWS HEADLINES</p>
<table><thead><tr><th>#</th><th>Headline</th><th>Source</th><th>Date</th><th>Sentiment</th></tr></thead>
<tbody>${newsRows}</tbody></table>` : ''}

<footer>
  Generated by Regime-Aware Multi-Agent Advisory System<br>
  Model: llama-3.3-70b-versatile via Groq API<br>
  NOT FINANCIAL ADVICE — AI-generated analysis only
</footer>
</div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fn;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`REPORT EXPORTED → ${fn}`);
    }, [hasReport, report, headlines, ticker, exchange, regimeOutput, recommendation]);

    // Expose to parent via ref
    useImperativeHandle(ref, () => ({ triggerViewDetails, triggerExport }), [triggerViewDetails, triggerExport]);

    // ── Error message renderer ───────────────────────────────────
    const ErrorPanel = () => {
      if (!error) return null;

      let title = '';
      let body: string[] = [];

      if (error === 'API_KEY_MISSING') {
        title = 'API KEY NOT CONFIGURED';
        body  = ['Add VITE_GROQ_API_KEY=gsk_... to front-end/.env', 'Get a free key at console.groq.com', 'Then restart the dev server.'];
      } else if (error === 'NO_AGENT_DATA') {
        title = 'WAITING FOR AGENT DATA — RUN ANALYSIS FIRST';
        body  = ['Select a stock ticker in the search bar above.', 'Wait for all three agents to complete.'];
      } else if (error === 'RATE_LIMIT') {
        title = `RATE LIMIT — RETRY IN ${retryIn}s`;
        body  = ['Groq free tier limit reached.', retryIn > 0 ? `Auto-retrying in ${retryIn} seconds...` : 'Retrying now...'];
      } else if (error === 'INVALID_KEY') {
        title = 'INVALID API KEY — CHECK GROQ CONSOLE';
        body  = ['Verify VITE_GROQ_API_KEY in front-end/.env', 'Keys begin with gsk_'];
      } else if (error.startsWith('API_ERROR:')) {
        const [, code, msg] = error.split(':');
        title = `GROQ API ERROR ${code}`;
        body  = [msg];
      } else if (error.startsWith('NETWORK_ERROR:')) {
        title = 'NETWORK ERROR';
        body  = [error.replace('NETWORK_ERROR:', ''), 'Check your internet connection.'];
      }

      return (
        <div style={{
          borderLeft: `4px solid ${C.red}`, background: 'rgba(239,68,68,0.07)',
          borderRadius: 8, padding: '14px 18px', marginTop: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.red, fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 6 }}>
            <AlertTriangle size={14} /> {title}
          </div>
          {body.map((b, i) => (
            <p key={i} style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>{b}</p>
          ))}
          {error !== 'RATE_LIMIT' && (
            <button
              onClick={triggerViewDetails}
              style={{ marginTop: 10, background: 'none', border: `1px solid ${C.red}`, borderRadius: 6, padding: '6px 14px', color: C.red, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: '1.5px', fontSize: 12 }}
            >
              RETRY
            </button>
          )}
        </div>
      );
    };

    // ── Render ───────────────────────────────────────────────────
    return (
      <>
        {/* Google Fonts */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=Space+Mono:wght@400;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          .rpt-scroll::-webkit-scrollbar { width: 4px; }
          .rpt-scroll::-webkit-scrollbar-track { background: #1a2235; }
          .rpt-scroll::-webkit-scrollbar-thumb { background: ${C.gold}; border-radius: 2px; }
        `}</style>

        {/* Bottom-right toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
                background: C.gold, color: '#0a0e1a',
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
                fontSize: 12, letterSpacing: '2px',
                padding: '12px 20px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(245,197,24,0.4)',
              }}
            >
              <CheckCircle size={15} /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Panel — animated slide-down */}
        <AnimatePresence>
          {(panelOpen || error) && (
            <motion.div
              id="llm-report-panel"
              key="report-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.gold}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {/* Panel header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <FileText size={16} color={C.gold} />
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '2px', color: C.gold }}>
                      ADVISORY INTELLIGENCE REPORT
                    </span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: C.muted }}>
                      {displayName || ticker} ({ticker}) · {exchange ?? 'NSE'} · {new Date().toLocaleDateString('en-IN')}
                    </span>
                    <span style={{ background: 'rgba(245,197,24,0.1)', border: `1px solid ${C.gold}`, borderRadius: 4, padding: '2px 8px', fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.gold, letterSpacing: '1px' }}>
                      llama-3.3-70b
                    </span>
                    {newsMissing && (
                      <span style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${C.red}`, borderRadius: 4, padding: '2px 8px', fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.red, letterSpacing: '1px' }}>
                        ⚠ NEWS FEED UNAVAILABLE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setPanelOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gold, display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1px' }}
                  >
                    COLLAPSE <ChevronUp size={16} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '0 24px 20px' }}>
                  {isLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', color: C.muted, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: C.gold }} />
                      GENERATING REPORT... querying llama-3.3-70b-versatile via Groq
                    </div>
                  )}

                  <ErrorPanel />

                  {report && !isLoading && (
                    <>
                      {/* Regime badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '16px 0 12px' }}>
                        {(() => {
                          const regime = regimeOutput?.regime ?? recommendation?.trend ?? '';
                          const rc = regimeColors(regime);
                          const risk = recommendation?.riskLevel ?? '';
                          const conf = recommendation?.confidenceScore?.toFixed(0) ?? '—';
                          const trend = props.technicalOutput?.trend_signal ?? '';
                          const pills = [
                            { label: regime.toUpperCase(), s: rc },
                            { label: `CONFIDENCE: ${conf}%`, s: { bg: 'rgba(245,197,24,0.1)', text: C.gold } },
                            { label: `RISK: ${risk.toUpperCase()}`, s: { bg: 'rgba(239,68,68,0.1)', text: C.red } },
                            { label: trend, s: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' } },
                          ].filter(p => p.label && p.label !== 'RISK: ');
                          return pills.map((p, i) => (
                            <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: '1.5px', background: p.s.bg, color: p.s.text }}>
                              {p.label}
                            </span>
                          ));
                        })()}
                      </div>

                      {/* Scrollable report body */}
                      <div
                        className="rpt-scroll"
                        style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 6 }}
                      >
                        <ReportBody text={report} />
                      </div>

                      {/* Footer meta */}
                      <div style={{
                        marginTop: 16, paddingTop: 12,
                        borderTop: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 8,
                      }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: C.muted }}>
                          {tokenUsage && (
                            <>Tokens used: <span style={{ color: C.gold }}>{tokenUsage.total.toLocaleString()}</span>
                            {' '}(prompt: {tokenUsage.prompt.toLocaleString()} · completion: {tokenUsage.completion.toLocaleString()}){' '}</>
                          )}
                          {genTime > 0 && (
                            <><Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Generated in {genTime}s</>
                          )}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={triggerViewDetails}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', border: `1px solid ${C.blue}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: C.blue, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1.5px' }}
                          >
                            <RefreshCw size={12} /> REFRESH
                          </button>
                          <button
                            onClick={triggerExport}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,197,24,0.1)', border: `1px solid ${C.gold}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: C.gold, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '1.5px' }}
                          >
                            <Download size={12} /> EXPORT
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

LLMReportEngine.displayName = 'LLMReportEngine';

// ── Invisible trigger wrapper (re-exports handle type) ─────────────
export type { LLMReportEngineHandle };
