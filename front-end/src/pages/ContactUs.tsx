import { useState } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";

export function ContactUs() {
  const fontRajdhani = { fontFamily: "'Rajdhani', sans-serif" };
  const fontMono = { fontFamily: "'Space Mono', monospace" };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: ""
  });
  
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    message: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: formData.name.trim() === "",
      email: formData.email.trim() === "",
      message: formData.message.trim() === ""
    };
    
    setErrors(newErrors);

    if (!newErrors.name && !newErrors.email && !newErrors.message) {
      // Simulate submission
      setTimeout(() => setSubmitted(true), 400);
    }
  };

  const inputStyle = {
    background: "#1a2235",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "14px",
    borderRadius: "6px",
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    transition: "border 0.2s ease"
  };

  const inputFocusStyle = {
    border: "1px solid rgba(245,197,24,0.4)"
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const getStyle = (fieldName: string) => {
    return focusedField === fieldName ? { ...inputStyle, ...inputFocusStyle } : inputStyle;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 max-w-5xl"
    >
      {/* HERO SECTION */}
      <div className="text-center mb-16">
        <h1 style={{ ...fontRajdhani, color: "#f5c518" }} className="text-[48px] font-bold tracking-wide uppercase mb-3">
          CONTACT
        </h1>
        <p style={{ ...fontMono, color: "#64748b" }} className="text-[14px]">
          Project queries, collaboration, or technical questions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* LEFT COLUMN - INFO CARDS */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:bg-[#1a2235] transition-colors">
            <span style={fontMono} className="text-[#64748b] text-[11px] tracking-wider uppercase mb-1 block">
              PROJECT TYPE
            </span>
            <span style={fontRajdhani} className="text-[#e2e8f0] text-lg font-semibold tracking-wide">
              B.E. / B.Tech — Computer Science
            </span>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:bg-[#1a2235] transition-colors">
            <span style={fontMono} className="text-[#64748b] text-[11px] tracking-wider uppercase mb-1 block">
              INSTITUTION
            </span>
            <div style={fontRajdhani} className="text-[#e2e8f0] text-lg font-semibold tracking-wide flex flex-col gap-1">
              <span>[Your College Name]</span>
              <span className="text-[#64748b]">[Department Name]</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:bg-[#1a2235] transition-colors">
            <span style={fontMono} className="text-[#64748b] text-[11px] tracking-wider uppercase mb-4 block">
              SOURCE CODE
            </span>
            <a 
              href="#"
              className="inline-block transition-colors"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                border: "1px solid #f5c518",
                color: "#f5c518",
                background: "transparent",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "1px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,197,24,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ⬡ VIEW ON GITHUB →
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN - CONTACT FORM */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 relative min-h-[400px]">
          {submitted ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 border border-[#f5c518]/30 rounded-xl bg-[#111827]"
            >
              <div className="relative w-16 h-16 rounded-full border-2 border-[#f5c518] flex items-center justify-center mb-6">
                <div 
                  className="w-4 h-8 border-b-2 border-r-2 border-[#f5c518]" 
                  style={{ transform: "rotate(45deg) translate(-2px, -2px)" }}
                />
              </div>
              <h2 style={fontRajdhani} className="text-[#f5c518] text-[24px] font-bold tracking-widest mb-2">
                MESSAGE RECEIVED
              </h2>
              <p style={fontMono} className="text-[#64748b] text-[12px]">
                We'll respond as soon as possible.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label style={fontMono} className="text-[#64748b] text-[11px] mb-2 block uppercase tracking-wider">
                  NAME
                </label>
                <input 
                  type="text" 
                  placeholder="Your name"
                  style={getStyle("name")}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {errors.name && (
                  <p style={fontMono} className="text-[#ef4444] text-[10px] mt-1 tracking-[1px] uppercase">
                    THIS FIELD IS REQUIRED
                  </p>
                )}
              </div>

              <div>
                <label style={fontMono} className="text-[#64748b] text-[11px] mb-2 block uppercase tracking-wider">
                  EMAIL
                </label>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  style={getStyle("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && (
                  <p style={fontMono} className="text-[#ef4444] text-[10px] mt-1 tracking-[1px] uppercase">
                    THIS FIELD IS REQUIRED
                  </p>
                )}
              </div>

              <div>
                <label style={fontMono} className="text-[#64748b] text-[11px] mb-2 block uppercase tracking-wider">
                  SUBJECT
                </label>
                <select 
                  style={{...getStyle("subject"), appearance: "none"}}
                  onFocus={() => setFocusedField("subject")}
                  onBlur={() => setFocusedField(null)}
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                >
                  <option>General Inquiry</option>
                  <option>Technical Issue</option>
                  <option>Collaboration</option>
                  <option>Feedback</option>
                </select>
              </div>

              <div>
                <label style={fontMono} className="text-[#64748b] text-[11px] mb-2 block uppercase tracking-wider">
                  MESSAGE
                </label>
                <textarea 
                  rows={5}
                  placeholder="Your message..."
                  style={{...getStyle("message"), resize: "vertical"}}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
                {errors.message && (
                  <p style={fontMono} className="text-[#ef4444] text-[10px] mt-1 tracking-[1px] uppercase">
                    THIS FIELD IS REQUIRED
                  </p>
                )}
              </div>

              <button 
                type="submit"
                style={{
                  ...fontRajdhani,
                  background: "#3b82f6",
                  color: "#ffffff",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  borderRadius: "6px",
                  padding: "12px 0",
                  width: "100%",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "8px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                <Send className="size-4" />
                SEND MESSAGE
              </button>

            </form>
          )}
        </div>

      </div>
    </motion.div>
  );
}
