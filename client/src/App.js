import React, { useState, useEffect } from 'react';
import KioskMode from './pages/KioskMode';
import AdminMode from './pages/AdminMode';
import PinModal from './components/PinModal';
import { api } from './api';

export default function App() {
  const [mode, setMode] = useState('kiosk'); // 'kiosk' | 'admin'
  const [showPin, setShowPin] = useState(false);
  const [settings, setSettings] = useState({ shop_name: 'Kiosken', swish_number: '' });

  useEffect(() => {
    api.getSettings().then(s => setSettings(s)).catch(() => {});
  }, []);

  const handleAdminAccess = () => setShowPin(true);

  const handlePinSuccess = () => {
    setShowPin(false);
    setMode('admin');
  };

  const handleExitAdmin = () => setMode('kiosk');

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {showPin && (
        <PinModal
          onSuccess={handlePinSuccess}
          onClose={() => setShowPin(false)}
        />
      )}
      {mode === 'kiosk' ? (
        <KioskMode
          settings={settings}
          onAdminClick={handleAdminAccess}
        />
      ) : (
        <AdminMode
          settings={settings}
          setSettings={setSettings}
          onExit={handleExitAdmin}
        />
      )}
    </div>
  );
}
