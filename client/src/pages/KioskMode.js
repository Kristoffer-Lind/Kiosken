import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import SwishQR from '../components/SwishQR';

const BASE = process.env.REACT_APP_API_URL || '';

export default function KioskMode({ settings, onAdminClick }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.getProducts(), api.getCategories()]).then(([prods, cats]) => {
      setProducts(prods.filter(p => p.available));
      setCategories(cats);
      if (cats.length && !activeCategory) setActiveCategory('all');
    }).catch(console.error);
  }, [activeCategory]);

  useEffect(() => { load(); }, []);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === activeCategory);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p) => {
    setCart(prev => ({
      ...prev,
      [p.id]: prev[p.id]
        ? { ...prev[p.id], qty: prev[p.id].qty + 1 }
        : { id: p.id, name: p.name, price: p.price, qty: 1 },
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      if (item.qty <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...item, qty: item.qty - 1 } };
    });
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const items = cartItems.map(i => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
      }));
      await api.createOrder({ items });
      setOrderDone(true);
    } catch (e) {
      alert('Kunde inte spara order: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setCart({});
    setShowCheckout(false);
    setOrderDone(false);
    load();
  };

  // Success screen
  if (orderDone) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 80 }}>✅</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#166534', marginTop: 16 }}>Tack för köpet!</div>
        <div style={{ fontSize: 22, color: '#15803d', marginTop: 8 }}>{total.toFixed(2)} kr</div>
        <button onClick={handleNewOrder} style={btnStyle('#16a34a')}>
          Nytt köp
        </button>
      </div>
    );
  }

  // Checkout screen
  if (showCheckout) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <button onClick={() => setShowCheckout(false)} style={backBtn}>← Tillbaka</button>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Kassa</span>
          <span />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
          {cartItems.map(item => (
            <div key={item.id} style={cartRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>{item.price.toFixed(2)} kr × {item.qty}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginRight: 12 }}>
                {(item.price * item.qty).toFixed(2)} kr
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => removeFromCart(item.id)} style={qtyBtn('#fee2e2', '#dc2626')}>−</button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                <button onClick={() => addToCart(products.find(p => p.id === item.id) || item)} style={qtyBtn('#dbeafe', '#2563eb')}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 20, background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            <span>Totalt</span>
            <span style={{ color: '#2563eb' }}>{total.toFixed(2)} kr</span>
          </div>

          {settings.swish_number && (
            <div style={{ marginBottom: 20 }}>
              <SwishQR phone={settings.swish_number} amount={total} message={settings.shop_name || 'Kiosken'} />
            </div>
          )}

          <button onClick={handleConfirmOrder} disabled={loading || !cartItems.length} style={btnStyle('#16a34a')}>
            {loading ? 'Sparar...' : '✓ Bekräfta köp'}
          </button>
          <button onClick={handleNewOrder} style={{ ...btnStyle('#94a3b8'), marginTop: 10 }}>
            Avbryt — töm varukorg
          </button>
        </div>
      </div>
    );
  }

  // Main kiosk view
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ ...headerStyle, justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>
          {settings.shop_name || 'Kiosken'}
        </span>
        <button onClick={onAdminClick} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', opacity: 0.4 }}>⚙️</button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <CategoryTab label="Alla" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
        {categories.map(c => (
          <CategoryTab key={c.id} label={c.name} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} />
        ))}
      </div>

      {/* Products grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} qty={cart[p.id]?.qty || 0} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} />
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 40 }}>
              Inga produkter i denna kategori
            </div>
          )}
        </div>
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{ padding: '12px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{cartCount} varor</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginLeft: 12 }}>{total.toFixed(2)} kr</span>
          </div>
          <button onClick={() => setShowCheckout(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Till kassan →
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
      fontWeight: active ? 700 : 500, fontSize: 14,
      background: active ? '#2563eb' : '#f1f5f9',
      color: active ? '#fff' : '#475569',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function ProductCard({ product, qty, onAdd, onRemove }) {
  const BASE = process.env.REACT_APP_API_URL || '';
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: qty > 0 ? '0 0 0 2px #2563eb' : '0 1px 4px rgba(0,0,0,0.08)', transition: 'box-shadow 0.15s' }}>
      {product.image_url ? (
        <img src={`${BASE}${product.image_url}`} alt={product.name}
          style={{ width: '100%', height: 110, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 80, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          🛍️
        </div>
      )}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 2, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>{Number(product.price).toFixed(2)} kr</div>
        {qty === 0 ? (
          <button onClick={onAdd} style={{ width: '100%', padding: '10px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Lägg till
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onRemove} style={qtyBtn('#fee2e2', '#dc2626')}>−</button>
            <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{qty}</span>
            <button onClick={onAdd} style={qtyBtn('#dbeafe', '#2563eb')}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle = { display: 'flex', alignItems: 'center', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#2563eb', fontWeight: 600, padding: 0 };
const cartRow = { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
const qtyBtn = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const btnStyle = (bg) => ({ display: 'block', width: '100%', padding: '16px 0', background: bg, color: '#fff', border: 'none', borderRadius: 14, fontSize: 18, fontWeight: 700, cursor: 'pointer' });
