import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { buildSwishUrl } from './SwishQR';

export default function SwishFullscreen({ phone, amount, message, logoBase64, onClose }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!phone || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, buildSwishUrl(phone, amount, message), {
      width: 260, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(console.error);
  }, [phone, amount, message]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      {/* Shop logo */}
      {logoBase64 && (
        <img src={logoBase64} alt="logo" style={{ maxHeight: 100, maxWidth: 200, objectFit: 'contain', marginBottom: 28, borderRadius: 12 }} />
      )}

      {/* QR card */}
      <div style={{ background: '#fff', borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16 }}>Betala med Swish</div>
        <canvas ref={canvasRef} style={{ borderRadius: 10, display: 'block' }} />
        <div style={{ marginTop: 20, fontSize: 42, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>
          {amount.toFixed(2)} <span style={{ fontSize: 22, fontWeight: 700 }}>kr</span>
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{message}</div>
      </div>

      <button onClick={onClose} style={{ marginTop: 36, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 14, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
        ← Tillbaka
      </button>
    </div>
  );
}
