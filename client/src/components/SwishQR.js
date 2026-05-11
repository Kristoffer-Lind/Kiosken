import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function SwishQR({ phone, amount, message = 'Kiosken' }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!phone || !canvasRef.current) return;
    const clean = phone.replace(/\D/g, '').replace(/^0/, '46');
    const data = JSON.stringify({
      version: 1,
      payee: { value: clean, editable: false },
      amount: { value: Math.round(amount * 100) / 100, editable: false },
      message: { value: message, editable: false },
    });
    const swishUrl = `swish://payment?data=${encodeURIComponent(data)}`;
    QRCode.toCanvas(canvasRef.current, swishUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    }).catch(console.error);
  }, [phone, amount, message]);

  if (!phone) return null;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>
        Scanna med Swish
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 12, display: 'block', margin: '0 auto' }} />
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
        {phone} · {amount.toFixed(2)} kr
      </div>
    </div>
  );
}
