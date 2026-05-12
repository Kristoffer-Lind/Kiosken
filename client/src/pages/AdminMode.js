import React, { useState, useEffect, useCallback } from 'react';
import { api, clearAdminToken } from '../api';

const TABS = ['Produkter', 'Kategorier', 'Ordrar', 'Statistik', 'Inställningar'];

export default function AdminMode({ settings, setSettings, onExit, onSessionExpired }) {
  const [tab, setTab] = useState('Produkter');

  const handleApiError = (e) => {
    if (e.message === 'SESSION_EXPIRED') { onSessionExpired(); return true; }
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0f172a', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button onClick={onExit} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ← Kiosken
        </button>
        <span style={{ flex: 1, fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.4px' }}>Admin</span>
        <button onClick={() => { clearAdminToken(); onExit(); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          Logga ut
        </button>
      </header>

      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap', color: tab === t ? '#0f172a' : '#94a3b8', borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'Produkter' && <ProductsTab onError={handleApiError} />}
        {tab === 'Kategorier' && <CategoriesTab onError={handleApiError} />}
        {tab === 'Ordrar' && <OrdersTab onError={handleApiError} />}
        {tab === 'Statistik' && <StatisticsTab onError={handleApiError} />}
        {tab === 'Inställningar' && <SettingsTab settings={settings} setSettings={setSettings} onError={handleApiError} />}
      </div>
    </div>
  );
}

// ─── Loading helper ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
function ProductsTab({ onError }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]); setProducts(p); setCategories(c); }
    catch (e) { onError(e); }
    finally { setLoading(false); }
  }, [onError]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={H2}>Produkter <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>{products.length} st</span></h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={PrimaryBtn}>+ Ny produkt</button>
      </div>
      {showForm && <ProductForm categories={categories} initial={editing} onSave={() => { setShowForm(false); setEditing(null); load(); }} onCancel={() => { setShowForm(false); setEditing(null); }} onError={onError} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{ ...Card, opacity: p.available ? 1 : 0.5, display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{p.name}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 1 }}>{p.category_name || 'Ingen kategori'}</div>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 16, marginTop: 2 }}>{Number(p.price).toFixed(2)} kr</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmBtn bg={p.available ? '#fef9c3' : '#f0fdf4'} onClick={async () => { try { await api.toggleAvailable(p.id, !p.available); load(); } catch(e) { onError(e); } }}>{p.available ? '🔴 Slut' : '🟢 Aktiv'}</SmBtn>
              <SmBtn bg="#f1f5f9" onClick={() => { setEditing(p); setShowForm(true); }}>✏️</SmBtn>
              <SmBtn bg="#fff1f2" onClick={async () => { if (window.confirm('Ta bort?')) { try { await api.deleteProduct(p.id); load(); } catch(e) { onError(e); } } }}>🗑️</SmBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EMOJI_OPTIONS = ['🍕','🍔','🍟','🌮','🌯','🥪','🍜','🍱','🥗','🍣','🍦','🍰','🧁','🍩','🍫','🍭','🥤','☕','🧃','🍺','🥛','🧋','🍿','🥨','🫐','🍓','🍎','🥐','🫔','🫙'];

function ProductForm({ categories, initial, onSave, onCancel, onError }) {
  const [name, setName] = useState(initial?.name || '');
  const [price, setPrice] = useState(initial?.price || '');
  const [catId, setCatId] = useState(initial?.category_id || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name || !price) return alert('Namn och pris krävs');
    setSaving(true);
    try {
      const data = { name, price: Number(price), category_id: catId || undefined, emoji: emoji || undefined };
      initial ? await api.updateProduct(initial.id, data) : await api.createProduct(data);
      onSave();
    } catch (e) { if (!onError(e)) alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ ...Card, background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: 20, marginBottom: 20 }}>
      <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1e40af', marginBottom: 16 }}>{initial ? 'Redigera produkt' : 'Ny produkt'}</h3>
      <input style={Inp} placeholder="Produktnamn" value={name} onChange={e => setName(e.target.value)} />
      <input style={Inp} placeholder="Pris (kr)" type="number" step="0.5" value={price} onChange={e => setPrice(e.target.value)} />
      <select style={Inp} value={catId} onChange={e => setCatId(e.target.value)}>
        <option value="">Ingen kategori</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label style={LabelStyle}>Emoji (syns i kiosken)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {EMOJI_OPTIONS.map(e => (
          <button key={e} type="button" onClick={() => setEmoji(e)} style={{ fontSize: 22, width: 38, height: 38, borderRadius: 10, border: emoji === e ? '2px solid #2563eb' : '1.5px solid #e2e8f0', background: emoji === e ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>
        ))}
      </div>
      <input style={{ ...Inp, marginBottom: 16 }} placeholder="Eller skriv valfri emoji…" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...PrimaryBtn, flex: 1 }}>{saving ? 'Sparar…' : 'Spara'}</button>
        <button onClick={onCancel} style={GhostBtn}>Avbryt</button>
      </div>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesTab({ onError }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('');

  const load = async () => {
    setLoading(true);
    try { setCats(await api.getCategories()); }
    catch (e) { onError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    try { await api.updateCategory(id, { name: editName.trim(), sort_order: editOrder ? Number(editOrder) : 0 }); setEditingId(null); load(); }
    catch (e) { onError(e); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 16 }}>Kategorier</h2>
      <div style={{ ...Card, background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: 20, marginBottom: 20 }}>
        <input style={Inp} placeholder="Kategorinamn" value={name} onChange={e => setName(e.target.value)} />
        <input style={Inp} placeholder="Sorteringsordning (1, 2, 3…)" type="number" value={order} onChange={e => setOrder(e.target.value)} />
        <button onClick={async () => { if (!name) return; try { await api.createCategory({ name, sort_order: order ? Number(order) : 0 }); setName(''); setOrder(''); load(); } catch(e) { onError(e); } }} style={PrimaryBtn}>+ Lägg till</button>
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
                <SmBtn bg="#f1f5f9" onClick={() => { setEditingId(c.id); setEditName(c.name); setEditOrder(String(c.sort_order)); }}>✏️</SmBtn>
                <span style={{ width: 8 }} />
                <SmBtn bg="#fff1f2" onClick={async () => { if (window.confirm('Ta bort kategori?')) { try { await api.deleteCategory(c.id); load(); } catch(e) { onError(e); } } }}>🗑️</SmBtn>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────
function OrdersTab({ onError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [itemsCache, setItemsCache] = useState({});
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try { const o = await api.getOrders({ from: from || undefined, to: to || undefined }); setOrders(o); setSelected(new Set()); }
    catch (e) { onError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!itemsCache[id]) {
      try { const items = await api.getOrderItems(id); setItemsCache(prev => ({ ...prev, [id]: items })); }
      catch (e) { onError(e); }
    }
  };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = orders.length > 0 && selected.size === orders.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map(o => o.id)));

  const deleteSelected = async () => {
    if (!selected.size || !window.confirm(`Ta bort ${selected.size} order${selected.size > 1 ? 'ar' : ''}?`)) return;
    try { await api.deleteOrders([...selected]); load(); }
    catch (e) { onError(e); }
  };

  const total = orders.reduce((s, o) => s + Number(o.total), 0);
  if (loading) return <Spinner />;

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
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 18, height: 18 }} />
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
          <div key={o.id} style={{ ...Card, border: `2px solid ${selected.has(o.id) ? '#dc2626' : 'transparent'}`, background: selected.has(o.id) ? '#fff5f5' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer' }} onClick={() => toggleExpand(o.id)}>
              <input type="checkbox" checked={selected.has(o.id)} onChange={() => {}} onClick={e => { e.stopPropagation(); toggleSelect(o.id); }} style={{ width: 18, height: 18, marginRight: 14, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Order #{o.id}</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{new Date(o.created_at).toLocaleString('sv-SE')}</div>
              </div>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 17, marginRight: 10 }}>{Number(o.total).toFixed(2)} kr</div>
              <span style={{ color: '#94a3b8', fontSize: 18 }}>{expandedId === o.id ? '▲' : '▼'}</span>
            </div>
            {expandedId === o.id && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 16px 14px' }}>
                {itemsCache[o.id] ? itemsCache[o.id].map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: '#475569' }}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{(item.product_price * item.quantity).toFixed(2)} kr</span>
                  </div>
                )) : <div style={{ color: '#94a3b8', fontSize: 14 }}>Laddar…</div>}
              </div>
            )}
          </div>
        ))}
        {!orders.length && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Inga ordrar</div>}
      </div>
    </div>
  );
}

// ─── Statistics ───────────────────────────────────────────────────────────────
function StatisticsTab({ onError }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try { setStats(await api.getStatistics({ from: from || undefined, to: to || undefined })); }
    catch (e) { onError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;
  if (!stats) return null;

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
          <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 15 }}>{Number(c.revenue).toFixed(2)} kr</div>
        </div>
      ))}
      <SectionTitle style={{ marginTop: 20 }}>Per produkt</SectionTitle>
      {stats.by_product.map((p, i) => (
        <div key={i} style={{ ...Card, display: 'flex', alignItems: 'center', padding: '12px 16px', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.product_name}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{p.category_name}</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginRight: 16 }}>{p.qty_sold} st</div>
          <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 14 }}>{Number(p.revenue).toFixed(2)} kr</div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings, onError }) {
  const [shopName, setShopName] = useState(settings.shop_name || '');
  const [swish, setSwish] = useState(settings.swish_number || '');
  const [newPin, setNewPin] = useState('');
  const [logo, setLogo] = useState(settings.logo_base64 || null);
  const [swishQr, setSwishQr] = useState(settings.swish_qr_base64 || null);
  const [saved, setSaved] = useState(false);

  const readFile = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const data = { swish_number: swish, shop_name: shopName };
    if (logo !== settings.logo_base64) data.logo_base64 = logo || '';
    if (swishQr !== settings.swish_qr_base64) data.swish_qr_base64 = swishQr || '';
    if (newPin) {
      if (newPin.length < 4) return alert('Nytt PIN måste vara minst 4 siffror');
      data.new_pin = newPin;
    }
    try {
      await api.updateSettings(data);
      setSettings(s => ({ ...s, swish_number: swish, shop_name: shopName, logo_base64: logo || '', swish_qr_base64: swishQr || '' }));
      setNewPin(''); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { if (!onError(e)) alert(e.message); }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ ...H2, marginBottom: 20 }}>Inställningar</h2>
      <div style={{ ...Card, padding: 20, marginBottom: 16 }}>
        <label style={LabelStyle}>Kioskens namn</label>
        <input style={Inp} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Kiosken" />
        <label style={LabelStyle}>Swish-nummer</label>
        <input style={Inp} value={swish} onChange={e => setSwish(e.target.value)} placeholder="07XXXXXXXX" type="tel" />
      </div>

      <div style={{ ...Card, padding: 20, marginBottom: 16 }}>
        <label style={LabelStyle}>Logotyp / bild för Swish-helskärm</label>
        {logo && <img src={logo} alt="logo" style={{ maxHeight: 80, maxWidth: 160, objectFit: 'contain', borderRadius: 8, marginBottom: 12, display: 'block' }} />}
        <input type="file" accept="image/*" onChange={e => readFile(e.target.files[0], setLogo)} style={{ fontSize: 14, color: '#475569', marginBottom: logo ? 8 : 0 }} />
        {logo && <button onClick={() => setLogo(null)} style={{ ...GhostBtn, fontSize: 13, marginTop: 8 }}>Ta bort bild</button>}
      </div>

      <div style={{ ...Card, padding: 20, marginBottom: 16 }}>
        <label style={LabelStyle}>Fast Swish QR-bild</label>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
          Ladda upp en QR-kod från Swish-appen. Visas i stället för den automatiskt genererade QR-koden.
        </div>
        {swishQr && <img src={swishQr} alt="Swish QR" style={{ maxHeight: 150, maxWidth: 150, objectFit: 'contain', borderRadius: 8, marginBottom: 12, display: 'block', border: '1px solid #e2e8f0' }} />}
        <input type="file" accept="image/*" onChange={e => readFile(e.target.files[0], setSwishQr)} style={{ fontSize: 14, color: '#475569', marginBottom: swishQr ? 8 : 0 }} />
        {swishQr && <button onClick={() => setSwishQr(null)} style={{ ...GhostBtn, fontSize: 13, marginTop: 8 }}>Ta bort QR-bild</button>}
      </div>

      <div style={{ ...Card, background: '#fffbeb', border: '1.5px solid #fde68a', padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e', marginBottom: 14 }}>Ändra PIN-kod</div>
        <input style={Inp} type="password" inputMode="numeric" maxLength={6} placeholder="Nytt PIN (minst 4 siffror)" value={newPin} onChange={e => setNewPin(e.target.value)} />
        <div style={{ fontSize: 12, color: '#a16207' }}>Lämna tomt om du inte vill ändra PIN.</div>
      </div>

      <button onClick={save} style={{ ...PrimaryBtn, width: '100%', padding: '16px 0', fontSize: 16, display: 'block', textAlign: 'center' }}>
        {saved ? '✓ Sparat!' : 'Spara inställningar'}
      </button>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? '#eff6ff' : '#fff', borderRadius: 16, padding: '16px 18px', border: highlight ? '1.5px solid #bfdbfe' : '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: highlight ? '#1e40af' : '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  );
}
function SectionTitle({ children, style }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12, ...style }}>{children}</div>;
}
const SmBtn = ({ bg, onClick, children }) => (
  <button onClick={onClick} style={{ background: bg, border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}>{children}</button>
);
const H2 = { fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' };
const Card = { background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const Inp = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, marginBottom: 12, background: '#fff', color: '#0f172a', fontWeight: 500, outline: 'none' };
const LabelStyle = { display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 };
const PrimaryBtn = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const GhostBtn = { background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' };
