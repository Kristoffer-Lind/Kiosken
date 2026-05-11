import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import SwishQR from '../components/SwishQR';

const BASE = process.env.REACT_APP_API_URL || '';

const CAT_COLORS = [
  { bg: '#dbeafe', accent: '#2563eb' },
  { bg: '#dcfce7', accent: '#16a34a' },
  { bg: '#fef9c3', accent: '#ca8a04' },
  { bg: '#fce7f3', accent: '#db2777' },
  { bg: '#ede9fe', accent: '#7c3aed' },
  { bg: '#ffedd5', accent: '#ea580c' },
  { bg: '#cffafe', accent: '#0891b2' },
  { bg: '#fef2f2', accent: '#dc2626' },
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
      .then(([prods, cats]) => {
        setProducts(prods.filter(p => p.available));
        setCategories(cats);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Map category_id → color index
  const catColorMap = {};
  categories.forEach((c, i) => { catColorMap[String(c.id)] = CAT_COLORS[i % CAT_COLORS.length]; });

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => String(p.category_id) === String(activeCategory));

  const addToCart = (p) => {
    setCart(prev => {
      const key = String(p.id);
      return {
        ...prev,
        [key]: prev[key]
          ? { ...prev[key], qty: prev[key].qty + 1 }
          : { id: p.id, name: p.name, price: Number(p.price), qty: 1 },
      };
    });
  };

  const removeFromCart = (id) => {
    const key = String(id);
    setCart(prev => {
      if (!prev[key]) return prev;
      if (prev[key].qty <= 1) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...prev[key], qty: prev[key].qty - 1 } };
    });
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      await api.createOrder({
        items: cartItems.map(i => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.qty,
        })),
      });
      setOrderTotal(total);
      setOrderDone(true);
      setShowCheckout(false);
    } catch (e) {
      alert('Kunde inte spara order: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setCart({});
    setOrderDone(false);
    setOrderTotal(0);
    load();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>
          {settings.shop_name || 'Kiosken'}
        </span>
        <button onClick={onAdminClick} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', opacity: 0.3, padding: 4 }}>⚙️</button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <CategoryTab label="Alla" active={activeCategory === 'all'} color="#2563eb" onClick={() => setActiveCategory('all')} />
        {categories.map((c, i) => (
          <CategoryTab
            key={c.id}
            label={c.name}
            active={String(activeCategory) === String(c.id)}
            color={CAT_COLORS[i % CAT_COLORS.length].accent}
            onClick={() => setActiveCategory(c.id)}
          />
        ))}
      </div>

      {/* Products grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: cartCount > 0 ? 88 : 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {filteredProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              qty={cart[String(p.id)]?.qty || 0}
              color={catColorMap[String(p.category_id)] || CAT_COLORS[0]}
              onAdd={() => addToCart(p)}
              onRemove={(e) => { e.stopPropagation(); removeFromCart(p.id); }}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: 16 }}>
              Inga produkter tillgängliga
            </div>
          )}
        </div>
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{cartCount} varor</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>{total.toFixed(2)} kr</div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
            Betala →
          </button>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          cartItems={cartItems}
          total={total}
          settings={settings}
          loading={loading}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowCheckout(false)}
          products={products}
        />
      )}

      {orderDone && (
        <OrderDoneModal
          total={orderTotal}
          shopName={settings.shop_name}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

function CheckoutModal({ cartItems, total, settings, loading, onAdd, onRemove, onConfirm, onClose, products }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 20, cursor: 'pointer', color: '#2563eb', fontWeight: 700, lineHeight: 1 }}>
          ←
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 18, color: '#1e293b' }}>Din beställning</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {cartItems.map(item => {
          const prod = products.find(p => String(p.id) === String(item.id));
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#1e293b' }}>{item.name}</div>
                <div style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>{item.price.toFixed(2)} kr / st</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 14 }}>
                <button onClick={() => onRemove(item.id)} style={qtyBtn('#fee2e2', '#dc2626')}>−</button>
                <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 18 }}>{item.qty}</span>
                <button onClick={() => prod && onAdd(prod)} style={qtyBtn('#dbeafe', '#2563eb')}>+</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#1e293b', minWidth: 72, textAlign: 'right' }}>
                {(item.price * item.qty).toFixed(2)} kr
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', borderTop: '2px solid #e2e8f0', padding: 20 }}>
        <div style={{ background: '#eff6ff', borderRadius: 16, padding: '18px 20px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1e40af' }}>Totalt att betala</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#1e40af' }}>{total.toFixed(2)} kr</span>
        </div>

        {settings.swish_number && (
          <div style={{ marginBottom: 18 }}>
            <SwishQR phone={settings.swish_number} amount={total} message={settings.shop_name || 'Kiosken'} />
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ display: 'block', width: '100%', padding: '18px 0', background: loading ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 14, fontSize: 22, fontWeight: 800, cursor: loading ? 'default' : 'pointer', marginBottom: 10 }}>
          {loading ? 'Sparar...' : 'OK — Betalt!'}
        </button>

        <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '13px 0', background: 'none', border: '2px solid #e2e8f0', borderRadius: 14, fontSize: 16, color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
          ← Ångra / ändra
        </button>
      </div>
    </div>
  );
}

// ─── Order Done Modal ─────────────────────────────────────────────────────────

function OrderDoneModal({ total, shopName, onNewOrder }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ fontSize: 90, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#166534', marginBottom: 8, textAlign: 'center' }}>Tack för köpet!</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: '#16a34a', marginBottom: 12 }}>{total.toFixed(2)} kr</div>
      <div style={{ fontSize: 16, color: '#4ade80', marginBottom: 52 }}>{shopName || 'Kiosken'}</div>
      <button
        onClick={onNewOrder}
        style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 16, padding: '20px 56px', fontSize: 22, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
        Nytt köp
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTab({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
      fontWeight: active ? 700 : 500, fontSize: 14,
      background: active ? color : '#f1f5f9',
      color: active ? '#fff' : '#475569',
      transition: 'background 0.15s',
    }}>
      {label}
    </button>
  );
}

function ProductCard({ product, qty, color, onAdd, onRemove }) {
  return (
    <div
      onClick={onAdd}
      style={{ background: color.bg, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${qty > 0 ? color.accent : 'transparent'}`, transition: 'border-color 0.15s', userSelect: 'none' }}>
      {product.image_url ? (
        <img src={`${BASE}${product.image_url}`} alt={product.name}
          style={{ width: '100%', height: 110, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          🛍️
        </div>
      )}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 2, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: color.accent, marginBottom: qty > 0 ? 8 : 0 }}>
          {Number(product.price).toFixed(2)} kr
        </div>
        {qty > 0 && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onRemove} style={qtyBtn('#fff', color.accent)}>−</button>
            <span style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 18, color: color.accent }}>{qty}</span>
            <button onClick={(e) => { e.stopPropagation(); onAdd(); }} style={qtyBtn('#fff', color.accent)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

const qtyBtn = (bg, color) => ({
  background: bg, color, border: `2px solid ${color}`, borderRadius: 8,
  width: 34, height: 34, fontSize: 20, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
});
