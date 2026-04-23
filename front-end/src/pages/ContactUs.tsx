import { useState, useRef, useEffect } from 'react';
import { Rocket, Building2, Github, Send } from 'lucide-react';
import StarfieldBg from '../components/StarfieldBg';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a2235',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#e2e8f0',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
        fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b',
      }}>{label}</label>
      {children}
      {error && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FF1744', letterSpacing: 1 }}>
          THIS FIELD IS REQUIRED
        </span>
      )}
    </div>
  );
}

function FocusInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...style }}
      onFocus={e => { e.target.style.borderColor = '#FF6B35'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function FocusSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: 'pointer', ...style }}
      onFocus={e => { e.target.style.borderColor = '#FF6B35'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function FocusTextarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical', minHeight: 120, ...style }}
      onFocus={e => { e.target.style.borderColor = '#FF6B35'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

export function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!email.trim()) newErrors.email = true;
    if (!subject) newErrors.subject = true;
    if (!message.trim()) newErrors.message = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmittedEmail(email);
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setSubject(''); setMessage('');
    setErrors({}); setSubmitted(false); setSubmittedEmail('');
  };

  return (
    <div style={{ background: '#0A1128', minHeight: '100vh', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <StarfieldBg />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{
          padding: '120px 24px 60px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 16px',
            background: 'linear-gradient(135deg, #FF6B35, #1E88E5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Contact</h1>
          <p style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: 14, color: '#64748b' }}>
            Questions, collaboration, or technical queries
          </p>
        </section>

        {/* MAIN CONTENT */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 32, alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Card 1 — Project Type */}
              <div style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Rocket size={20} color="#FF6B35" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Project Type</span>
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>Veermata Jijabai Technological Institute</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Developers: Vivek Kamath, Tanmay More</div>
              </div>

              {/* Card 2 — Institution */}
              <div style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Building2 size={20} color="#1E88E5" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Institution</span>
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>Veermata Jijabai Technological Institute</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>B.E. / B.Tech — Computer Science</div>
              </div>

              {/* Card 3 — Source Code */}
              <div style={{
                background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Github size={20} color="#e2e8f0" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Source Code</span>
                </div>
                <a href="https://github.com/Vivekkamath17/Stock-prediction-system" style={{
                  display: 'block', width: '100%', padding: '10px 0', textAlign: 'center',
                  border: '1px solid #FF6B35', borderRadius: 8, color: '#FF6B35',
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2,
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >VIEW ON GITHUB →</a>
              </div>

              {/* Status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#00E676',
                  animation: 'pulse-ring 2s infinite', flexShrink: 0,
                }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b' }}>All Systems Operational</span>
              </div>
            </div>

            {/* RIGHT COLUMN — Form */}
            <div style={{
              background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '32px 28px',
            }}>
              {!submitted ? (
                <>
                  <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#FF6B35', letterSpacing: 2, margin: '0 0 6px' }}>Send a Message</h2>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>We'll respond as soon as possible</p>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <FormField label="Name" error={errors.name ? 'required' : undefined}>
                      <FocusInput type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
                    </FormField>
                    <FormField label="Email" error={errors.email ? 'required' : undefined}>
                      <FocusInput type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </FormField>
                    <FormField label="Subject" error={errors.subject ? 'required' : undefined}>
                      <FocusSelect value={subject} onChange={e => setSubject(e.target.value)}>
                        <option value="" style={{ background: '#1a2235' }}>Select a subject...</option>
                        <option value="general" style={{ background: '#1a2235' }}>General Inquiry</option>
                        <option value="technical" style={{ background: '#1a2235' }}>Technical Issue</option>
                        <option value="collab" style={{ background: '#1a2235' }}>Collaboration</option>
                        <option value="feedback" style={{ background: '#1a2235' }}>Feedback / Suggestions</option>
                      </FocusSelect>
                    </FormField>
                    <FormField label="Message" error={errors.message ? 'required' : undefined}>
                      <FocusTextarea rows={5} placeholder="Your message..." value={message} onChange={e => setMessage(e.target.value)} />
                    </FormField>
                    <button type="submit" style={{
                      height: 48, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #FF6B35, #e55a2b)', border: 'none', borderRadius: 8, cursor: 'pointer',
                      color: 'white', fontFamily: 'Rajdhani, sans-serif', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,107,53,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      SEND MESSAGE <Send size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', border: '2px solid #00E676',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'scale-in 0.4s ease forwards',
                  }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <path d="M8 18l8 8 12-14" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 28, color: '#00E676', margin: 0, textTransform: 'uppercase', letterSpacing: 2 }}>Message Received</h2>
                  <p style={{ fontSize: 15, color: '#94a3b8', margin: 0 }}>We'll get back to you shortly.</p>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#FF6B35' }}>{submittedEmail}</div>
                  <button
                    onClick={resetForm}
                    style={{
                      padding: '10px 24px', border: '1px solid #1E88E5', borderRadius: 8, background: 'transparent',
                      color: '#1E88E5', fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                      marginTop: 8, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,136,229,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
