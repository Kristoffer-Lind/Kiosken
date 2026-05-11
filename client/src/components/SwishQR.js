import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function buildSwishUrl(phone, amount, message) {
  const clean = phone.replace(/\D/g, '').replace(/^0/, '46');
  const data = JSON.stringify({
    version: 1,
    payee: { value: clean, editable: false },
    amount: { value: Math.round(amount * 100) / 100, editable: false },
    message: { value: message, editable: false },
  });
  return `swish://payment?data=${encodeURIComponent(data)}`;
}

export default function SwishQR({ phone, amount, message = 'Kiosken', size = 180 }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!phone || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, buildSwishUrl(phone, amount, message), {
      width: size, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(console.error);
  }, [phone, amount, message, size]);

  if (!phone) return null;
  return <canvas ref={canvasRef} style={{ borderRadius: 10, display: 'block' }} />;
}
