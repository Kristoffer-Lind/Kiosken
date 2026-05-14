import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import SwishQR from '../components/SwishQR';
import SwishFullscreen from '../components/SwishFullscreen';

const BASE = process.env.REACT_APP_API_URL || '';

const CAT_COLORS = [
  { bg: '#eef2ff', accent: '#4f46e5', pill: '#c7d2fe' },
  { bg: '#f0fdf4', accent: '#16a34a', pill: '#bbf7d0' },
  { bg: '#fff7ed', accent: '#ea580c', pill: '#fed7aa' },
  { bg: '#fdf4ff', accent: '#9333ea', pill: '#e9d5ff' },
  { bg: '#ecfeff', accent: '#0891b2', pill: '#a5f3fc' },
  { bg: '#fefce8', accent: '#ca8a04', pill: '#fef08a' },
  { bg: '#fff1f2', accent: '#e11d48', pill: '#fecdd3' },
  { bg: '#f0fdfa', accent: '#0d9488', pill: '#99f6e4' },
];

export default function KioskMode({ settings, onAdminClick }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([prods, cats]) => { setProducts(prods.filter(p => p.available)); setCategories(cats); })
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const catColorMap = {};
  categories.forEach((c, i) => { catColorMap[String(c.id)] = CAT_COLORS[i % CAT_COLORS.length]; });

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => String(p.category_id) === String(activeCategory));

  const addToCart = (p) => setCart(prev => {
    const key = String(p.id);
    return { ...prev, [key]: prev[key] ? { ...prev[key], qty: prev[key].qty + 1 } : { id: p.id, name: p.name, price: Number(p.price), qty: 1 } };
  });

  const removeFromCart = (id) => setCart(prev => {
    const key = String(id);
    if (!prev[key]) return prev;
    if (prev[key].qty <= 1) { const n = { ...prev }; delete n[key]; return n; }
    return { ...prev, [key]: { ...prev[key], qty: prev[key].qty - 1 } };
  });

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      await api.createOrder({ items: cartItems.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.qty })) });
      setOrderTotal(total); setOrderDone(true); setShowCheckout(false);
    } catch (e) { alert('Kunde inte spara order: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleNewOrder = () => { setCart({}); setOrderDone(false); setOrderTotal(0); load(); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>

      {/* Header */}
      <header style={{ background: '#fff', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: '#0f172a' }}>
          {settings.shop_name || 'Kiosken'}
        </span>
        <button onClick={onAdminClick} style={{ background: 'none', border: 'none', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', opacity: 0.25, fontSize: 18 }}>
          ⚙️
        </button>
      </header>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <CategoryTab label="Alla" active={activeCategory === 'all'} accent="#0f172a" onClick={() => setActiveCategory('all')} />
            {categories.map((c, i) => (
              <CategoryTab key={c.id} label={c.name} active={String(activeCategory) === String(c.id)}
                accent={CAT_COLORS[i % CAT_COLORS.length].accent} onClick={() => setActiveCategory(c.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <main style={{ flex: 1, padding: '20px 16px', paddingBottom: cartCount > 0 ? 100 : 24 }}>
        {activeCategory !== 'all' && (
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 14 }}>
            {categories.find(c => String(c.id) === String(activeCategory))?.name || ''}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p}
              qty={cart[String(p.id)]?.qty || 0}
              color={catColorMap[String(p.category_id)] || { bg: '#f8fafc', accent: '#334155', pill: '#e2e8f0' }}
              onAdd={() => addToCart(p)}
              onRemove={(e) => { e.stopPropagation(); removeFromCart(p.id); }}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 16 }}>
              Inga produkter här just nu
            </div>
          )}
        </div>
      </main>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
          <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 -4px 24px rgba(0,0,0,0.18)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{cartCount} varor</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', marginTop: 1 }}>{total.toFixed(2)} kr</div>
            </div>
            <button onClick={() => setShowCheckout(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 28px', fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
              Betala →
            </button>
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal cartItems={cartItems} total={total} settings={settings} loading={loading}
          onAdd={addToCart} onRemove={removeFromCart} onConfirm={handleConfirmOrder}
          onClose={() => setShowCheckout(false)} products={products} />
      )}
      {orderDone && (
        <OrderDoneModal total={orderTotal} shopName={settings.shop_name} onNewOrder={handleNewOrder} />
      )}
    </div>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

function CheckoutModal({ cartItems, total, settings, loading, onAdd, onRemove, onConfirm, onClose, products }) {
  const [showSwishFull, setShowSwishFull] = useState(false);

  return (
    <>
      {showSwishFull && (
        <SwishFullscreen
          phone={settings.swish_number}
          amount={total}
          message={settings.shop_name || 'Kiosken'}
          logoBase64={settings.logo_base64}
          swishQrBase64={settings.swish_qr_base64}
          onClose={() => setShowSwishFull(false)}
        />
      )}

      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 20, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            ←
          </button>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.3px' }}>Din beställning</span>
          <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: '#64748b' }}>{cartItems.length} produkter</span>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
          {cartItems.map(item => {
            const prod = products.find(p => String(p.id) === String(item.id));
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{item.price.toFixed(2)} kr / st</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 14 }}>
                  <button onClick={() => onRemove(item.id)} style={circleBtn('#fee2e2', '#dc2626')}>−</button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{item.qty}</span>
                  <button onClick={() => prod && onAdd(prod)} style={circleBtn('#eff6ff', '#2563eb')}>+</button>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', minWidth: 68, textAlign: 'right' }}>
                  {(item.price * item.qty).toFixed(2)} kr
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Totalt att betala</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.1 }}>{total.toFixed(2)} <span style={{ fontSize: 22, fontWeight: 700 }}>kr</span></div>
            </div>
            {settings.swish_number && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <SwishQR phone={settings.swish_number} amount={total} message={settings.shop_name || 'Kiosken'} size={110} />
                <button onClick={() => setShowSwishFull(true)} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
                  Visa helskärm ⛶
                </button>
              </div>
            )}
          </div>

          <button onClick={onConfirm} disabled={loading} style={{ display: 'block', width: '100%', padding: '18px 0', background: loading ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 16, fontSize: 19, fontWeight: 800, cursor: loading ? 'default' : 'pointer', letterSpacing: '-0.3px', marginBottom: 10 }}>
            {loading ? 'Sparar…' : '✓ OK — Betalt!'}
          </button>
          <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '14px 0', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 16, fontSize: 16, color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
            ← Ångra / ändra
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Order done ───────────────────────────────────────────────────────────────

function OrderDoneModal({ total, shopName, onNewOrder }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 96, height: 96, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 28, boxShadow: '0 8px 32px rgba(22,163,74,0.35)' }}>✓</div>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#86efac', marginBottom: 8 }}>{shopName || 'Kiosken'}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#14532d', marginBottom: 4, letterSpacing: '-0.5px' }}>Tack för köpet!</div>
      <div style={{ fontSize: 52, fontWeight: 900, color: '#16a34a', letterSpacing: '-2px', marginBottom: 48 }}>{total.toFixed(2)} <span style={{ fontSize: 26, fontWeight: 700 }}>kr</span></div>
      <button onClick={onNewOrder} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 18, padding: '18px 52px', fontSize: 20, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.3px', boxShadow: '0 4px 24px rgba(22,163,74,0.4)' }}>
        Nytt köp
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTab({ label, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: active ? 700 : 500, fontSize: 14, background: active ? accent : '#f1f5f9', color: active ? '#fff' : '#475569', transition: 'all 0.15s', flexShrink: 0 }}>
      {label}
    </button>
  );
}

function ProductCard({ product, qty, color, onAdd, onRemove }) {
  return (
    <div onClick={onAdd} style={{ background: qty > 0 ? color.bg : '#fff', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${qty > 0 ? color.accent : 'transparent'}`, boxShadow: qty > 0 ? `0 0 0 1px ${color.accent}20, 0 4px 16px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.07)', transition: 'all 0.18s', userSelect: 'none' }}>
      <div style={{ width: '100%', height: 72, background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, background: color.pill, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {product.emoji2 ? (
            <>
              <span style={{ position: 'absolute', fontSize: 20, lineHeight: 1, bottom: 0, right: 0, zIndex: 0 }}>{product.emoji2}</span>
              <span style={{ position: 'absolute', fontSize: 24, lineHeight: 1, top: 0, left: 0, zIndex: 1 }}>{product.emoji || '🛍️'}</span>
            </>
          ) : (
            <span style={{ fontSize: 24, lineHeight: 1 }}>{product.emoji || '🛍️'}</span>
          )}
        </div>
      </div>
      <div style={{ padding: '12px 12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4, lineHeight: 1.3, letterSpacing: '-0.1px' }}>{product.name}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: color.accent, letterSpacing: '-0.5px', marginBottom: qty > 0 ? 10 : 0 }}>
          {Number(product.price).toFixed(2)} <span style={{ fontSize: 13, fontWeight: 600 }}>kr</span>
        </div>
        {qty > 0 && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onRemove} style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', border: `1.5px solid ${color.accent}`, color: color.accent, fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
            <span style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: 18, color: color.accent, letterSpacing: '-0.5px' }}>{qty}</span>
            <button onClick={(e) => { e.stopPropagation(); onAdd(); }} style={{ width: 32, height: 32, borderRadius: 10, background: color.accent, border: 'none', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

function circleBtn(bg, color) {
  return { width: 36, height: 36, borderRadius: 10, background: bg, border: 'none', color, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
}
