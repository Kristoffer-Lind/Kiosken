import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const BASE = process.env.REACT_APP_API_URL || '';
const TABS = ['Produkter', 'Kategorier', 'Ordrar', 'Statistik', 'Inställningar'];

export default function AdminMode({ settings, setSettings, onExit }) {
  const [tab, setTab] = useState('Produkter');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1e40af', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ← Kiosken
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 18 }}>Admin</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', background: '#fff', borderBottom: '2px solid #e2e8f0', padding: '0 4px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap',
            color: tab === t ? '#1e40af' : '#64748b',
            borderBottom: tab === t ? '2px solid #1e40af' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'Produkter' && <ProductsTab />}
        {tab === 'Kategorier' && <CategoriesTab />}
        {tab === 'Ordrar' && <OrdersTab />}
        {tab === 'Statistik' && <StatisticsTab />}
        {tab === 'Inställningar' && <SettingsTab settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (p) => {
    await api.toggleAvailable(p.id, !p.available);
    load();
  };

  const del = async (id) => {
    if (window.confirm('Ta bort produkten?')) {
      await api.deleteProduct(id);
      load();
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={h2}>Produkter</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={addBtn}>+ Ny produkt</button>
      </div>

      {showForm && (
        <ProductForm
          categories={categories}
          initial={editing}
          onSave={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {products.map(p => (
        <div key={p.id} style={{ ...card, opacity: p.available ? 1 : 0.55 }}>
          {p.image_url && (
            <img src={`${BASE}${p.image_url}`} alt={p.name}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, marginRight: 12, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{p.category_name || '—'}</div>
            <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 15 }}>{Number(p.price).toFixed(2)} kr</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => toggle(p)} style={smBtn(p.available ? '#fef9c3' : '#f0fdf4')}>
              {p.available ? '🔴 Slut' : '🟢 Aktiv'}
            </button>
            <button onClick={() => { setEditing(p); setShowForm(true); }} style={smBtn('#f1f5f9')}>✏️</button>
            <button onClick={() => del(p.id)} style={smBtn('#fee2e2')}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductForm({ categories, initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price || '');
  const [catId, setCatId] = useState(initial?.category_id || '');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !price) return alert('Namn och pris krävs');
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('price', price);
    if (catId) fd.append('category_id', catId);
    if (image) fd.append('image', image);
    try {
      if (initial) await api.updateProduct(initial.id, fd);
      else await api.createProduct(fd);
      onSave();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#eff6ff', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #bfdbfe' }}>
      <h3 style={{ marginBottom: 12, color: '#1e40af' }}>{initial ? 'Redigera produkt' : 'Ny produkt'}</h3>
      <input style={inp} placeholder="Produktnamn" value={name} onChange={e => setName(e.target.value)} />
      <input style={inp} placeholder="Pris (kr)" type="number" step="0.5" value={price} onChange={e => setPrice(e.target.value)} />
      <select style={inp} value={catId} onChange={e => setCatId(e.target.value)}>
        <option value="">Ingen kategori</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }}>Bild (valfritt)</label>
        <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 14 }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...addBtn, flex: 1 }}>{saving ? 'Sparar...' : 'Spara'}</button>
        <button onClick={onCancel} style={{ ...smBtn('#f1f5f9'), padding: '10px 18px' }}>Avbryt</button>
      </div>
    </div>
  );
}

// ─── Categories ──────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');

  const load = () => api.getCategories().then(setCats);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name) return;
    await api.createCategory({ name, sort_order: order ? Number(order) : 0 });
    setName(''); setOrder(''); load();
  };

  const del = async (id) => {
    if (window.confirm('Ta bort kategori? Produkter i den okategoriseras.')) {
      await api.deleteCategory(id); load();
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={h2}>Kategorier</h2>
      <div style={{ background: '#eff6ff', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #bfdbfe' }}>
        <input style={inp} placeholder="Kategorinamn" value={name} onChange={e => setName(e.target.value)} />
        <input style={inp} placeholder="Sorteringsordning (valfritt)" type="number" value={order} onChange={e => setOrder(e.target.value)} />
        <button onClick={add} style={addBtn}>+ Lägg till</button>
      </div>
      {cats.map(c => (
        <div key={c.id} style={card}>
          <div style={{ flex: 1, fontWeight: 600 }}>{c.name}</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginRight: 12 }}>Ordning: {c.sort_order}</div>
          <button onClick={() => del(c.id)} style={smBtn('#fee2e2')}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

// ─── Orders ──────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => api.getOrders({ from: from || undefined, to: to || undefined }).then(setOrders);
  useEffect(() => { load(); }, []);

  const total = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={h2}>Ordrar</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input style={{ ...inp, flex: 1, margin: 0 }} type="date" value={from} onChange={e => setFrom(e.target.value)} placeholder="Från" />
        <input style={{ ...inp, flex: 1, margin: 0 }} type="date" value={to} onChange={e => setTo(e.target.value)} placeholder="Till" />
        <button onClick={load} style={addBtn}>Filtrera</button>
      </div>
      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#166534', fontWeight: 600 }}>{orders.length} ordrar</span>
        <span style={{ color: '#166534', fontWeight: 700, fontSize: 18 }}>{total.toFixed(2)} kr</span>
      </div>
      {orders.map(o => (
        <div key={o.id} style={{ ...card, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>#{o.id} · {new Date(o.created_at).toLocaleString('sv-SE')}</span>
            <span style={{ fontWeight: 700, color: '#1e40af', fontSize: 16 }}>{Number(o.total).toFixed(2)} kr</span>
          </div>
        </div>
      ))}
      {!orders.length && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Inga ordrar ännu</div>}
    </div>
  );
}

// ─── Statistics ───────────────────────────────────────────────────────────────

function StatisticsTab() {
  const [stats, setStats] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => api.getStatistics({ from: from || undefined, to: to || undefined }).then(setStats);
  useEffect(() => { load(); }, []);

  if (!stats) return <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Laddar...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={h2}>Statistik</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ ...inp, flex: 1, margin: 0 }} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input style={{ ...inp, flex: 1, margin: 0 }} type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={load} style={addBtn}>Visa</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatCard label="Ordrar" value={stats.summary.order_count} />
        <StatCard label="Total omsättning" value={Number(stats.summary.total_revenue).toFixed(2) + ' kr'} highlight />
      </div>

      <h3 style={{ ...h2, fontSize: 16, marginBottom: 10 }}>Per kategori</h3>
      {stats.by_category.map((c, i) => (
        <div key={i} style={{ ...card, marginBottom: 8 }}>
          <div style={{ flex: 1, fontWeight: 600 }}>{c.category_name}</div>
          <div style={{ color: '#64748b', marginRight: 16, fontSize: 13 }}>{c.qty_sold} st</div>
          <div style={{ fontWeight: 700, color: '#1e40af' }}>{Number(c.revenue).toFixed(2)} kr</div>
        </div>
      ))}

      <h3 style={{ ...h2, fontSize: 16, marginTop: 20, marginBottom: 10 }}>Per produkt</h3>
      {stats.by_product.map((p, i) => (
        <div key={i} style={{ ...card, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.product_name}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{p.category_name}</div>
          </div>
          <div style={{ color: '#64748b', marginRight: 16, fontSize: 13 }}>{p.qty_sold} st</div>
          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14 }}>{Number(p.revenue).toFixed(2)} kr</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? '#eff6ff' : '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: highlight ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 22, color: highlight ? '#1e40af' : '#1e293b' }}>{value}</div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsTab({ settings, setSettings }) {
  const [shopName, setShopName] = useState(settings.shop_name || '');
  const [swish, setSwish] = useState(settings.swish_number || '');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const data = { swish_number: swish, shop_name: shopName };
    if (pin && newPin) {
      if (newPin.length < 4) return alert('Nytt PIN måste vara minst 4 siffror');
      data.pin = pin;
      data.new_pin = newPin;
    }
    try {
      await api.updateSettings(data);
      setSettings(s => ({ ...s, swish_number: swish, shop_name: shopName }));
      setPin(''); setNewPin('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={h2}>Inställningar</h2>
      <label style={label}>Kioskens namn</label>
      <input style={inp} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Kiosken" />

      <label style={label}>Swish-nummer (för QR-kod)</label>
      <input style={inp} value={swish} onChange={e => setSwish(e.target.value)} placeholder="07XXXXXXXX" type="tel" />

      <div style={{ background: '#fef9c3', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #fde68a' }}>
        <h3 style={{ marginBottom: 12, fontSize: 15, color: '#92400e' }}>Ändra PIN</h3>
        <input style={inp} type="password" inputMode="numeric" maxLength={6} placeholder="Nuvarande PIN" value={pin} onChange={e => setPin(e.target.value)} />
        <input style={inp} type="password" inputMode="numeric" maxLength={6} placeholder="Nytt PIN (minst 4 siffror)" value={newPin} onChange={e => setNewPin(e.target.value)} />
        <div style={{ fontSize: 12, color: '#78350f' }}>Lämna tomt om du inte vill ändra PIN.</div>
      </div>

      <button onClick={save} style={addBtn}>{saved ? '✓ Sparat!' : 'Spara inställningar'}</button>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const h2 = { fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 16 };
const card = { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const inp = { display: 'block', width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, marginBottom: 10, background: '#fff' };
const label = { display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: 500 };
const addBtn = { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 15, fontWeight: 600, cursor: 'pointer' };
const smBtn = (bg) => ({ background: bg, border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 14, fontWeight: 600 });
