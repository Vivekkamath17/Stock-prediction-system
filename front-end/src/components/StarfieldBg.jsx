import { useEffect, useRef } from 'react';

export default function StarfieldBg() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 120; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 1.5 + 0.5;
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.6 + 0.1};
        animation: twinkle ${Math.random() * 4 + 2}s ease-in-out infinite alternate;
        animation-delay: ${Math.random() * 4}s;
      `;
      container.appendChild(star);
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      background: '#0A1128',
      pointerEvents: 'none',
      overflow: 'hidden',
    }} ref={containerRef} />
  );
}
