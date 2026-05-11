import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const BASE = process.env.REACT_APP_API_URL || '';
const TABS = ['Produkter', 'Kategorier', 'Ordrar', 'Statistik', 'Inställningar'];

export default function AdminMode({ settings, setSettings, onExit }) {
  const [tab, setTab] = useState('Produkter');
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0f172a', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600, letterSpacing: '-0.1px' }}>
          ← Kiosken
        </button>
        <span style={{ flex: 1, fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.4px' }}>Admin</span>
      </header>

      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap', color: tab === t ? '#0f172a' : '#94a3b8', borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent', letterSpacing: '-0.1px' }}>
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

// ─── Products ─────────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const load = useCallback(() => { Promise.all([api.getProducts(), api.getCategories()]).then(([p, c]) => { setProducts(p); setCategories(c); }); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={H2}>Produkter <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>{products.length} st</span></h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={PrimaryBtn}>+ Ny produkt</button>
      </div>

      {showForm && <ProductForm categories={categories} initial={editing} onSave={() => { setShowForm(false); setEditing(null); load(); }} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{ ...Card, opacity: p.available ? 1 : 0.5, display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
            {p.image_url && <img src={`${BASE}${p.image_url}`} alt={p.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, marginRight: 14, flexShrink: 0 }} />}
            {!p.image_url && <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: 10, marginRight: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛍️</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{p.name}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 1 }}>{p.category_name || 'Ingen kategori'}</div>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 16, marginTop: 2, letterSpacing: '-0.3px' }}>{Number(p.price).toFixed(2)} kr</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmBtn bg={p.available ? '#fef9c3' : '#f0fdf4'} onClick={() => api.toggleAvailable(p.id, !p.available).then(load)}>{p.available ? '🔴' : '🟢'}</SmBtn>
              <SmBtn bg="#f1f5f9" onClick={() => { setEditing(p); setShowForm(true); }}>✏️</SmBtn>
              <SmBtn bg="#fff1f2" onClick={() => window.confirm('Ta bort produkten?') && api.deleteProduct(p.id).then(load)}>🗑️</SmBtn>
            </div>
          </div>
        ))}
      </div>
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
    fd.append('name', name); fd.append('price', price);
    if (catId) fd.append('category_id', catId);
    if (image) fd.append('image', image);
    try { initial ? await api.updateProduct(initial.id, fd) : await api.createProduct(fd); onSave(); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ ...Card, background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: 20, marginBottom: 20 }}>
      <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1e40af', marginBottom: 16, letterSpacing: '-0.3px' }}>{initial ? 'Redigera produkt' : 'Ny produkt'}</h3>
      <input style={Inp} placeholder="Produktnamn" value={name} onChange={e => setName(e.target.value)} />
      <input style={Inp} placeholder="Pris (kr)" type="number" step="0.5" value={price} onChange={e => setPrice(e.target.value)} />
      <select style={Inp} value={catId} onChange={e => setCatId(e.target.value)}>
        <option value="">Ingen kategori</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ marginBottom: 16 }}>
        <label style={LabelStyle}>Bild (valfritt)</label>
        <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 14, color: '#475569' }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...PrimaryBtn, flex: 1 }}>{saving ? 'Sparar…' : 'Spara'}</button>
        <button onClick={onCancel} style={{ ...GhostBtn }}>Avbryt</button>
      </div>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const load = () => api.getCategories().then(setCats);
  useEffect(() => { load(); }, []);

  const startEdit = (c) => { setEditingId(c.id); setEditName(c.name); setEditOrder(String(c.sort_order)); };
  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    await api.updateCategory(id, { name: editName.trim(), sort_order: editOrder ? Number(editOrder) : 0 });
    setEditingId(null);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 16 }}>Kategorier</h2>
      <div style={{ ...Card, background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: 20, marginBottom: 20 }}>
        <input style={Inp} placeholder="Kategorinamn" value={name} onChange={e => setName(e.target.value)} />
        <input style={Inp} placeholder="Sorteringsordning (t.ex. 1, 2, 3)" type="number" value={order} onChange={e => setOrder(e.target.value)} />
        <button onClick={async () => { if (!name) return; await api.createCategory({ name, sort_order: order ? Number(order) : 0 }); setName(''); setOrder(''); load(); }} style={PrimaryBtn}>+ Lägg till</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cats.map(c => (
          <div key={c.id} style={{ ...Card, padding: '14px 16px' }}>
            {editingId === c.id ? (
              <div>
                <input style={{ ...Inp, marginBottom: 8 }} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                <input style={{ ...Inp, marginBottom: 10 }} placeholder="Sorteringsordning" type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(c.id)} style={{ ...PrimaryBtn, flex: 1 }}>Spara</button>
                  <button onClick={() => setEditingId(null)} style={GhostBtn}>Avbryt</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginRight: 10 }}>#{c.sort_order}</div>
                <SmBtn bg="#f1f5f9" onClick={() => startEdit(c)}>✏️</SmBtn>
                <span style={{ width: 8 }} />
                <SmBtn bg="#fff1f2" onClick={() => window.confirm('Ta bort kategori?') && api.deleteCategory(c.id).then(load)}>🗑️</SmBtn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const load = () => api.getOrders({ from: from || undefined, to: to || undefined }).then(o => { setOrders(o); setSelected(new Set()); });
  useEffect(() => { load(); }, []);
  const total = orders.reduce((s, o) => s + Number(o.total), 0);

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSelected = orders.length > 0 && selected.size === orders.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map(o => o.id)));

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Ta bort ${selected.size} order${selected.size > 1 ? 'ar' : ''}?`)) return;
    await api.deleteOrders([...selected]);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 16 }}>Ordrar</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ ...Inp, flex: 1, margin: 0 }} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input style={{ ...Inp, flex: 1, margin: 0 }} type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={load} style={PrimaryBtn}>Visa</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <StatCard label="Antal ordrar" value={orders.length} />
        <StatCard label="Total" value={total.toFixed(2) + ' kr'} highlight />
      </div>

      {orders.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Markera alla
          </label>
          {selected.size > 0 && (
            <button onClick={deleteSelected} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              🗑️ Ta bort {selected.size} st
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orders.map(o => (
          <div key={o.id} onClick={() => toggleSelect(o.id)} style={{ ...Card, display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', border: selected.has(o.id) ? '2px solid #dc2626' : '2px solid transparent', background: selected.has(o.id) ? '#fff5f5' : '#fff' }}>
            <input type="checkbox" checked={selected.has(o.id)} onChange={() => {}} onClick={e => e.stopPropagation()} style={{ width: 18, height: 18, marginRight: 14, cursor: 'pointer', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Order #{o.id}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{new Date(o.created_at).toLocaleString('sv-SE')}</div>
            </div>
            <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 17, letterSpacing: '-0.3px' }}>{Number(o.total).toFixed(2)} kr</div>
          </div>
        ))}
        {!orders.length && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Inga ordrar</div>}
      </div>
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
  if (!stats) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Laddar…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 16 }}>Statistik</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...Inp, flex: 1, margin: 0 }} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input style={{ ...Inp, flex: 1, margin: 0 }} type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={load} style={PrimaryBtn}>Visa</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <StatCard label="Ordrar" value={stats.summary.order_count} />
        <StatCard label="Omsättning" value={Number(stats.summary.total_revenue).toFixed(2) + ' kr'} highlight />
      </div>

      <SectionTitle>Per kategori</SectionTitle>
      {stats.by_category.map((c, i) => (
        <div key={i} style={{ ...Card, display: 'flex', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.category_name}</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginRight: 16 }}>{c.qty_sold} st</div>
          <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 15, letterSpacing: '-0.3px' }}>{Number(c.revenue).toFixed(2)} kr</div>
        </div>
      ))}

      <SectionTitle style={{ marginTop: 24 }}>Per produkt</SectionTitle>
      {stats.by_product.map((p, i) => (
        <div key={i} style={{ ...Card, display: 'flex', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.product_name}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{p.category_name}</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginRight: 16 }}>{p.qty_sold} st</div>
          <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 14, letterSpacing: '-0.3px' }}>{Number(p.revenue).toFixed(2)} kr</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? '#eff6ff' : '#fff', borderRadius: 16, padding: '16px 18px', border: highlight ? '1.5px solid #bfdbfe' : '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: highlight ? '#1e40af' : '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

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
      data.pin = pin; data.new_pin = newPin;
    }
    try {
      await api.updateSettings(data);
      setSettings(s => ({ ...s, swish_number: swish, shop_name: shopName }));
      setPin(''); setNewPin(''); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 20 }}>Inställningar</h2>
      <div style={Card}>
        <label style={LabelStyle}>Kioskens namn</label>
        <input style={Inp} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Kiosken" />
        <label style={LabelStyle}>Swish-nummer (för QR-kod vid betalning)</label>
        <input style={Inp} value={swish} onChange={e => setSwish(e.target.value)} placeholder="07XXXXXXXX" type="tel" />
      </div>

      <div style={{ ...Card, background: '#fffbeb', border: '1.5px solid #fde68a', marginTop: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e', marginBottom: 14 }}>Ändra PIN-kod</div>
        <input style={Inp} type="password" inputMode="numeric" maxLength={6} placeholder="Nuvarande PIN" value={pin} onChange={e => setPin(e.target.value)} />
        <input style={Inp} type="password" inputMode="numeric" maxLength={6} placeholder="Nytt PIN (minst 4 siffror)" value={newPin} onChange={e => setNewPin(e.target.value)} />
        <div style={{ fontSize: 12, color: '#a16207' }}>Lämna tomt om du inte vill ändra PIN.</div>
      </div>

      <button onClick={save} style={{ ...PrimaryBtn, width: '100%', padding: '16px 0', fontSize: 16, marginTop: 20, textAlign: 'center', display: 'block' }}>
        {saved ? '✓ Sparat!' : 'Spara inställningar'}
      </button>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12, marginTop: 4, ...style }}>{children}</div>;
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const H2 = { fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' };
const Card = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const Inp = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, marginBottom: 12, background: '#fff', color: '#0f172a', fontWeight: 500, outline: 'none' };
const LabelStyle = { display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 };
const PrimaryBtn = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.1px', whiteSpace: 'nowrap' };
const GhostBtn = { background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' };
const SmBtn = ({ bg, onClick, children }) => (
  <button onClick={onClick} style={{ background: bg, border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>{children}</button>
);
