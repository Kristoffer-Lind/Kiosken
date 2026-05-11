import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function PinModal({ onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    api.verifyPin(pin).then(({ ok, token }) => {
      if (ok && token) { onSuccess(token); }
      else {
        setError('Fel PIN-kod');
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); setError(''); }, 600);
      }
    }).catch(() => setError('Nätverksfel'));
  }, [pin, onSuccess]);

  const press = (d) => { setError(''); if (pin.length < 4) setPin(p => p + d); };
  const del = () => setPin(p => p.slice(0, -1));

  const keyStyle = {
    padding: '18px 0', fontSize: 22, fontWeight: 700,
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
    cursor: 'pointer', color: '#0f172a', touchAction: 'manipulation',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 28, padding: '36px 32px', width: 320, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: shake ? 'shake 0.5s' : undefined }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}`}</style>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#0f172a', letterSpacing: '-0.5px' }}>Admin</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>Ange PIN-kod</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pin.length ? '#0f172a' : '#e2e8f0', transition: 'background 0.15s' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => press(String(d))} style={keyStyle}>{d}</button>
          ))}
          <div />
          <button onClick={() => press('0')} style={keyStyle}>0</button>
          <button onClick={del} style={{ ...keyStyle, color: '#64748b', fontSize: 18 }}>⌫</button>
        </div>
        {error && <div style={{ textAlign: 'center', color: '#dc2626', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
        <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '13px 0', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 14, cursor: 'pointer', color: '#94a3b8', fontSize: 15, fontWeight: 600, touchAction: 'manipulation' }}>
          Avbryt
        </button>
      </div>
    </div>
  );
}
