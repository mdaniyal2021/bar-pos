'use client';

import { saveOrderOffline, deleteOrder, getPendingCount, getPendingOrders } from '@/lib/offlineDB';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap';

export default function POSPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showOptionModal, setShowOptionModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [charging, setCharging] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    // Inject font
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FONT_URL;
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status]);

    const loadFromLocalStorage = () => {
        try {
            const p = localStorage.getItem('cached_products');
            const c = localStorage.getItem('cached_categories');
            if (p) setProducts(JSON.parse(p));
            if (c) setCategories(JSON.parse(c));
        } catch (e) {}
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                if (pData.offline || cData.offline) { loadFromLocalStorage(); setLoading(false); return; }
                const ap = Array.isArray(pData) ? pData.filter(p => p.isActive) : [];
                const ac = Array.isArray(cData) ? cData.filter(c => c.isActive) : [];
                if (ap.length > 0) {
                    localStorage.setItem('cached_products', JSON.stringify(ap));
                    localStorage.setItem('cached_categories', JSON.stringify(ac));
                }
                setProducts(ap);
                setCategories(ac);
            } catch { loadFromLocalStorage(); }
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = async () => {
            setIsOnline(true);
            try {
                const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                if (!pData.offline && Array.isArray(pData)) {
                    const ap = pData.filter(p => p.isActive);
                    const ac = Array.isArray(cData) ? cData.filter(c => c.isActive) : [];
                    setProducts(ap); setCategories(ac);
                    localStorage.setItem('cached_products', JSON.stringify(ap));
                    localStorage.setItem('cached_categories', JSON.stringify(ac));
                }
            } catch {}
            await syncPendingOrders();
        };
        const handleOffline = () => { setIsOnline(false); loadFromLocalStorage(); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        getPendingCount().then(n => setPendingCount(n));
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    const syncPendingOrders = async () => {
        try {
            setSyncing(true);
            const pending = await getPendingOrders();
            if (!pending.length) { setSyncing(false); return; }
            for (const order of pending) {
                try {
                    const { localId, savedAt, synced, ...orderData } = order;
                    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
                    if (res.ok) await deleteOrder(localId);
                } catch {}
            }
            const remaining = await getPendingCount();
            setPendingCount(remaining);
            setSyncing(false);
            if (remaining === 0 && pending.length > 0) alert('All offline orders synced!');
        } catch { setSyncing(false); }
    };

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.categoryId?.toString() === activeCategory);

    const handleProductClick = (product) => {
        const opts = product.options?.filter(o => o.isActive);
        if (!opts || !opts.length) return;
        if (opts.length === 1) { addToCart(product, opts[0]); }
        else { setSelectedProduct(product); setShowOptionModal(true); }
    };

    const addToCart = (product, option) => {
        const cartKey = `${product._id}-${option._id}`;
        const existing = cart.find(i => i.cartKey === cartKey);
        if (existing) {
            setCart(cart.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i));
        } else {
            setCart([...cart, { cartKey, productId: product._id, productOptionId: option._id?.toString(), productName: product.name, optionName: option.name, unitPrice: option.price, quantity: 1, subtotal: option.price, image: product.image }]);
        }
        setShowOptionModal(false); setSelectedProduct(null);
    };

    const updateQty = (cartKey, delta) => setCart(cart.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + delta, subtotal: (i.quantity + delta) * i.unitPrice } : i).filter(i => i.quantity > 0));
    const removeItem = (cartKey) => setCart(cart.filter(i => i.cartKey !== cartKey));
    const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    const handleCharge = async () => {
        if (!cart.length) return;
        setCharging(true);
        const orderData = {
            cashierId: session?.user?.id,
            cashierName: session?.user?.name,
            items: cart.map(i => ({ productId: i.productId, productOptionId: i.productOptionId, productName: i.productName, optionName: i.optionName, unitPrice: i.unitPrice, quantity: i.quantity, subtotal: i.subtotal })),
        };
        const saveOffline = async () => {
            await saveOrderOffline(orderData);
            const count = await getPendingCount();
            setPendingCount(count);
            setCompletedOrder({ orderNumber: `OFF-${count}`, totalAmount: cartTotal, cashierName: session?.user?.name, items: cart.map(i => ({ productName: i.productName, optionName: i.optionName, quantity: i.quantity, subtotal: i.subtotal })), createdAt: new Date().toISOString(), isOffline: true });
            setCart([]); setShowSuccessModal(true);
        };
        if (!navigator.onLine) { try { await saveOffline(); } catch (e) { alert('Save failed: ' + e.message); } setCharging(false); return; }
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
            const data = await res.json();
            if (res.ok) { setCompletedOrder(data.order); setCart([]); setShowSuccessModal(true); }
            else alert('Error: ' + data.error);
        } catch { try { await saveOffline(); } catch (e) { alert('Could not save order'); } }
        setCharging(false);
    };

    const handlePrint = (order) => {
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;width:280px;margin:auto;padding:16px}.center{text-align:center}.bold{font-weight:bold}.divider{border-top:1px dashed #000;margin:10px 0}.row{display:flex;justify-content:space-between;margin:4px 0}@media print{body{padding:0}}</style>
        </head><body>
        <div class="center bold" style="font-size:20px;letter-spacing:2px;margin-bottom:2px;">BAR POS</div>
        <div class="center" style="font-size:11px;color:#555;margin-bottom:4px;">Official Receipt</div>
        <div class="divider"></div>
        <div class="row"><span>Order #</span><span class="bold">${order.orderNumber}</span></div>
        <div class="row"><span>Date</span><span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
        <div class="row"><span>Time</span><span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
        <div class="row"><span>Cashier</span><span>${order.cashierName}</span></div>
        <div class="divider"></div>
        ${order.items?.map(i => `<div style="margin-bottom:8px"><div class="bold">${i.productName}</div><div class="row"><span style="color:#555">${i.optionName} x${i.quantity}</span><span>$${parseFloat(i.subtotal).toFixed(2)}</span></div></div>`).join('')}
        <div class="divider"></div>
        <div class="row" style="margin-top:6px"><span class="bold" style="font-size:15px">TOTAL</span><span class="bold" style="font-size:15px">$${parseFloat(order.totalAmount).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="center" style="margin-top:14px;font-size:11px;color:#777">Thank you for visiting</div>
        <script>window.onload=()=>{window.print()}<\/script></body></html>`);
        w.document.close();
    };

    const F = { fontFamily: "'Barlow', sans-serif" };

    if (status === 'loading' || loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', ...F }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '4px', color: '#ff4d00', textTransform: 'uppercase', marginBottom: '16px' }}>BAR POS</div>
                    <div style={{ width: '40px', height: '3px', background: '#ff4d00', margin: '0 auto', animation: 'pulse 1s infinite alternate' }}></div>
                    <style>{`@keyframes pulse{from{opacity:0.3}to{opacity:1}}`}</style>
                    <div style={{ color: '#555', fontSize: '12px', letterSpacing: '2px', marginTop: '16px', textTransform: 'uppercase' }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#111', overflow: 'hidden', ...F }}>

            {/* ===== LEFT PANEL ===== */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* TOP BAR */}
                <div style={{ background: '#0d0d0d', borderBottom: '1px solid #222', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ff4d00', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
                        </div>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: '800', fontSize: '20px', letterSpacing: '2px', color: 'white', textTransform: 'uppercase' }}>Bar <span style={{ color: '#ff4d00' }}>POS</span></span>
                    </div>

                    {/* Right side controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        {/* Online/Offline pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a1a1a', border: `1px solid ${isOnline ? '#1f4d2e' : '#4d1f1f'}`, borderRadius: '20px', padding: '5px 12px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${isOnline ? '#22c55e' : '#ef4444'}` }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: isOnline ? '#22c55e' : '#ef4444', textTransform: 'uppercase' }}>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>

                        {/* Pending sync */}
                        {pendingCount > 0 && (
                            <button onClick={syncPendingOrders} disabled={!isOnline || syncing}
                                style={{ background: '#ff4d00', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: isOnline ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', opacity: (!isOnline || syncing) ? 0.6 : 1 }}>
                                {syncing ? 'Syncing...' : `${pendingCount} Pending`}
                            </button>
                        )}

                        {/* Cashier name */}
                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff4d00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'white' }}>
                                {session?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#ccc' }}>{session?.user?.name}</span>
                            {session?.user?.role === 'super_admin' && (
                                <span style={{ background: '#ff4d00', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin</span>
                            )}
                        </div>

                        {/* Admin button */}
                        {session?.user?.role === 'super_admin' && (
                            <button onClick={() => router.push('/admin/dashboard')}
                                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Admin Panel
                            </button>
                        )}

                        {/* Logout */}
                        <button onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#666'; }}>
                            Logout
                        </button>
                    </div>
                </div>

                {/* OFFLINE BANNER */}
                {!isOnline && (
                    <div style={{ background: '#1a0f00', borderBottom: '1px solid #ff4d0033', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d00', flexShrink: 0 }}></div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#ff4d00', letterSpacing: '0.5px' }}>You are offline — Orders will be saved locally and synced automatically when internet returns</span>
                    </div>
                )}

                {/* CATEGORY TABS */}
                <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e', padding: '12px 16px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
                    {['all', ...categories.map(c => c._id.toString())].map((id, idx) => {
                        const cat = id === 'all' ? { name: 'All Items' } : categories.find(c => c._id.toString() === id);
                        const isActive = activeCategory === id;
                        return (
                            <button key={id} onClick={() => setActiveCategory(id)}
                                style={{ padding: '7px 20px', background: isActive ? '#ff4d00' : 'transparent', color: isActive ? 'white' : '#555', border: `1px solid ${isActive ? '#ff4d00' : '#2a2a2a'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = '#ff4d00'; e.currentTarget.style.color = '#ff4d00'; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555'; } }}>
                                {cat?.name}
                            </button>
                        );
                    })}
                </div>

                {/* PRODUCTS GRID */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', alignContent: 'start', background: '#111' }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', color: '#333' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>
                                {!isOnline ? 'No cached products — connect once to cache' : 'No products in this category'}
                            </div>
                        </div>
                    ) : filteredProducts.map(product => {
                        const minPrice = Math.min(...(product.options?.filter(o => o.isActive).map(o => o.price) || [0]));
                        const optCount = product.options?.filter(o => o.isActive).length || 0;
                        return (
                            <button key={product._id} onClick={() => handleProductClick(product)}
                                style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '10px', padding: '0', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'all 0.15s', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff4d00'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,77,0,0.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                {/* Product Image */}
                                <div style={{ position: 'relative', width: '100%', paddingTop: '70%', background: '#111', overflow: 'hidden' }}>
                                    <img src={product.image || '/images/default-product.png'} alt={product.name}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.src = '/images/default-product.png'; }} />
                                    {/* Options badge */}
                                    {optCount > 1 && (
                                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: '#aaa', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                            {optCount} sizes
                                        </div>
                                    )}
                                </div>
                                {/* Product Info */}
                                <div style={{ padding: '10px 12px 12px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#e0e0e0', marginBottom: '6px', lineHeight: '1.3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {product.name}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#ff4d00' }}>
                                        ${minPrice.toFixed(2)}
                                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#444', marginLeft: '4px' }}>from</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ===== RIGHT PANEL — CART ===== */}
            <div style={{ width: '340px', background: '#0d0d0d', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1e1e1e' }}>

                {/* Cart Header */}
                <div style={{ padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '2px', textTransform: 'uppercase' }}>Order</span>
                    {cartCount > 0 && (
                        <div style={{ background: '#ff4d00', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>{cartCount}</div>
                    )}
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                    {cart.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#2a2a2a' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="#2a2a2a" style={{ marginBottom: '12px' }}><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zm-9-1a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/></svg>
                            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Cart is empty</div>
                            <div style={{ fontSize: '10px', color: '#222', marginTop: '4px', letterSpacing: '1px' }}>Select a product</div>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.cartKey} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #161616', gap: '10px' }}>
                            <img src={item.image || '/images/default-product.png'} alt={item.productName}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, border: '1px solid #222' }}
                                onError={e => { e.target.src = '/images/default-product.png'; }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</div>
                                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{item.optionName} · ${item.unitPrice.toFixed(2)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <button onClick={() => updateQty(item.cartKey, -1)}
                                    style={{ width: '24px', height: '24px', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '4px', cursor: 'pointer', color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>−</button>
                                <span style={{ fontWeight: '800', color: 'white', minWidth: '18px', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</span>
                                <button onClick={() => updateQty(item.cartKey, 1)}
                                    style={{ width: '24px', height: '24px', background: '#ff4d00', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>+</button>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ff4d00', minWidth: '48px', textAlign: 'right' }}>${item.subtotal.toFixed(2)}</div>
                            <button onClick={() => removeItem(item.cartKey)}
                                style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '0', flexShrink: 0, lineHeight: 1 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#333'}>✕</button>
                        </div>
                    ))}
                </div>

                {/* Cart Footer */}
                <div style={{ padding: '16px', borderTop: '1px solid #1e1e1e', flexShrink: 0 }}>
                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '12px 16px', background: '#141414', borderRadius: '8px', border: '1px solid #1e1e1e' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: '#555', textTransform: 'uppercase' }}>Total</span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '1px' }}>${cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Clear cart */}
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])}
                            style={{ width: '100%', padding: '9px', background: 'transparent', color: '#444', border: '1px solid #222', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#444'; }}>
                            Clear Order
                        </button>
                    )}

                    {/* Charge button */}
                    <button onClick={handleCharge} disabled={!cart.length || charging}
                        style={{ width: '100%', padding: '16px', background: !cart.length || charging ? '#1a1a1a' : isOnline ? '#ff4d00' : '#d97706', color: !cart.length || charging ? '#333' : 'white', border: 'none', borderRadius: '8px', cursor: !cart.length || charging ? 'not-allowed' : 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.15s', boxShadow: cart.length && !charging ? `0 4px 20px ${isOnline ? 'rgba(255,77,0,0.3)' : 'rgba(217,119,6,0.3)'}` : 'none' }}>
                        {charging ? 'Processing...' : isOnline ? `Charge  $${cartTotal.toFixed(2)}` : `Save Offline  $${cartTotal.toFixed(2)}`}
                    </button>

                    {!isOnline && (
                        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', color: '#d97706', marginTop: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Offline mode — syncs when connected
                        </div>
                    )}
                </div>
            </div>

            {/* ===== OPTION MODAL ===== */}
            {showOptionModal && selectedProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                            <img src={selectedProduct.image || '/images/default-product.png'} alt={selectedProduct.name}
                                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #222', flexShrink: 0 }}
                                onError={e => { e.target.src = '/images/default-product.png'; }} />
                            <div>
                                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedProduct.name}</div>
                                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Select size</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {selectedProduct.options?.filter(o => o.isActive).map(option => (
                                <button key={option._id} onClick={() => addToCart(selectedProduct, option)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ff4d00'; e.currentTarget.style.borderColor = '#ff4d00'; e.currentTarget.querySelector('.opt-name').style.color = 'white'; e.currentTarget.querySelector('.opt-price').style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.querySelector('.opt-name').style.color = '#ddd'; e.currentTarget.querySelector('.opt-price').style.color = '#ff4d00'; }}>
                                    <span className="opt-name" style={{ fontSize: '14px', fontWeight: '700', color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{option.name}</span>
                                    <span className="opt-price" style={{ fontSize: '16px', fontWeight: '800', color: '#ff4d00', fontFamily: "'Barlow Condensed', sans-serif" }}>${parseFloat(option.price).toFixed(2)}</span>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => { setShowOptionModal(false); setSelectedProduct(null); }}
                            style={{ width: '100%', padding: '11px', background: 'transparent', color: '#444', border: '1px solid #222', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ===== SUCCESS MODAL ===== */}
            {showSuccessModal && completedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#141414', border: `1px solid ${completedOrder.isOffline ? '#d97706' : '#ff4d00'}`, borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 40px ${completedOrder.isOffline ? 'rgba(217,119,6,0.15)' : 'rgba(255,77,0,0.15)'}` }}>

                        {/* Icon */}
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: completedOrder.isOffline ? '#1a1200' : '#1a0800', border: `2px solid ${completedOrder.isOffline ? '#d97706' : '#ff4d00'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            {completedOrder.isOffline
                                ? <svg width="28" height="28" viewBox="0 0 24 24" fill="#d97706"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                : <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff4d00"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            }
                        </div>

                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: '800', color: completedOrder.isOffline ? '#d97706' : '#ff4d00', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {completedOrder.isOffline ? 'Saved Offline' : 'Order Placed'}
                        </div>

                        {completedOrder.isOffline && (
                            <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', marginBottom: '16px' }}>
                                Will sync when internet returns
                            </div>
                        )}

                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: '700', color: '#444', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px', marginTop: completedOrder.isOffline ? '0' : '12px' }}>
                            {completedOrder.orderNumber}
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '48px', fontWeight: '800', color: 'white', letterSpacing: '1px', marginBottom: '28px' }}>
                            ${parseFloat(completedOrder.totalAmount).toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {!completedOrder.isOffline && (
                                <button onClick={() => { handlePrint(completedOrder); setShowSuccessModal(false); }}
                                    style={{ flex: 1, padding: '13px', background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Print Receipt
                                </button>
                            )}
                            <button onClick={() => setShowSuccessModal(false)}
                                style={{ flex: 1, padding: '13px', background: '#ff4d00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                New Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}