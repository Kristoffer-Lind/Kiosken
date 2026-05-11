import React, { useState, useEffect } from 'react';
import KioskMode from './pages/KioskMode';
import AdminMode from './pages/AdminMode';
import PinModal from './components/PinModal';
import { api, setAdminToken, getAdminToken } from './api';

export default function App() {
  const [mode, setMode] = useState('kiosk');
  const [showPin, setShowPin] = useState(false);
  const [settings, setSettings] = useState({ shop_name: 'Kiosken', swish_number: '', logo_base64: '' });

  useEffect(() => {
    api.getSettings().then(s => setSettings(s)).catch(() => {});
  }, []);

  const handleAdminAccess = () => {
    if (getAdminToken()) { setMode('admin'); }
    else { setShowPin(true); }
  };

  const handlePinSuccess = (token) => {
    setAdminToken(token);
    setShowPin(false);
    setMode('admin');
  };

  const handleExitAdmin = () => {
    setMode('kiosk');
  };

  const handleSessionExpired = () => {
    setMode('kiosk');
    setShowPin(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      {showPin && (
        <PinModal onSuccess={handlePinSuccess} onClose={() => setShowPin(false)} />
      )}
      {mode === 'kiosk' ? (
        <KioskMode settings={settings} onAdminClick={handleAdminAccess} />
      ) : (
        <AdminMode
          settings={settings}
          setSettings={setSettings}
          onExit={handleExitAdmin}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </div>
  );
}
