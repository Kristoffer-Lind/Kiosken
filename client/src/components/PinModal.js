import React, { useState, useEffect } from 'react';
import { api } from '../api';

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', borderRadius: 20, padding: 32, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  title: { fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: '#1e293b' },
  dots: { display: 'flex', justifyContent: 'center', gap: 12, margin: '20px 0' },
  dot: (filled) => ({ width: 16, height: 16, borderRadius: '50%', background: filled ? '#2563eb' : '#e2e8f0', transition: 'background 0.15s' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  btn: { padding: '18px 0', fontSize: 24, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#1e293b', transition: 'background 0.1s' },
  btnDel: { padding: '18px 0', fontSize: 18, background: '#fee2e2', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#dc2626', gridColumn: 'span 1' },
  error: { color: '#dc2626', textAlign: 'center', fontSize: 14, marginTop: 8 },
  close: { width: '100%', marginTop: 16, padding: 12, background: 'none', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', color: '#64748b', fontSize: 15 },
};

export default function PinModal({ onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      api.verifyPin(pin).then(({ ok }) => {
        if (ok) {
          onSuccess();
        } else {
          setError('Fel PIN, försök igen');
          setShake(true);
          setTimeout(() => { setPin(''); setShake(false); }, 500);
        }
      }).catch(() => setError('Nätverksfel'));
    }
  }, [pin, onSuccess]);

  const press = (d) => {
    setError('');
    if (pin.length < 4) setPin(p => p + d);
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.box, ...(shake ? { animation: 'shake 0.4s' } : {}) }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
        <div style={S.title}>Admin PIN</div>
        <div style={S.dots}>
          {[0,1,2,3].map(i => <div key={i} style={S.dot(i < pin.length)} />)}
        </div>
        <div style={S.grid}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} style={S.btn} onMouseDown={() => press(String(d))}
              onTouchStart={(e) => { e.preventDefault(); press(String(d)); }}>
              {d}
            </button>
          ))}
          <div />
          <button style={S.btn} onMouseDown={() => press('0')}
            onTouchStart={(e) => { e.preventDefault(); press('0'); }}>0</button>
          <button style={S.btnDel} onMouseDown={() => setPin(p => p.slice(0,-1))}
            onTouchStart={(e) => { e.preventDefault(); setPin(p => p.slice(0,-1)); }}>⌫</button>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <button style={S.close} onClick={onClose}>Avbryt</button>
      </div>
    </div>
  );
}
