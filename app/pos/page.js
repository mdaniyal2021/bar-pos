'use client';

import { saveOrderOffline, getPendingOrders, deleteOrder, getPendingCount } from '@/lib/offlineDB';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

    // Offline states
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    // Auth check
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/categories'),
                ]);
                const [prods, cats] = await Promise.all([
                    pRes.json(), cRes.json()
                ]);

                const activeProds = Array.isArray(prods)
                    ? prods.filter(p => p.isActive)
                    : [];
                const activeCats = Array.isArray(cats)
                    ? cats.filter(c => c.isActive)
                    : [];

                setProducts(activeProds);
                setCategories(activeCats);
            } catch (err) {
                console.log('Fetch failed — possibly offline');
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Online/Offline detection + Auto sync
    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = async () => {
            setIsOnline(true);
            await syncPendingOrders();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check pending orders on load
        getPendingCount().then(count => setPendingCount(count));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sync pending offline orders
    const syncPendingOrders = async () => {
        try {
            setSyncing(true);
            const pending = await getPendingOrders();

            if (pending.length === 0) {
                setSyncing(false);
                return;
            }

            console.log(`Syncing ${pending.length} offline orders...`);

            for (const order of pending) {
                try {
                    const { localId, savedAt, synced, ...orderData } = order;

                    const res = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData),
                    });

                    if (res.ok) {
                        await deleteOrder(localId);
                        console.log(`Order ${localId} synced!`);
                    }
                } catch (err) {
                    console.log('Sync failed for order:', err);
                }
            }

            const remaining = await getPendingCount();
            setPendingCount(remaining);
            setSyncing(false);

            if (remaining === 0 && pending.length > 0) {
                alert('✅ All offline orders synced successfully!');
            }
        } catch (err) {
            setSyncing(false);
            console.log('Sync error:', err);
        }
    };

    // Filtered products by category
    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.categoryId?.toString() === activeCategory);

    // Open option modal
    const handleProductClick = (product) => {
        const activeOptions = product.options?.filter(o => o.isActive);
        if (!activeOptions || activeOptions.length === 0) return;

        if (activeOptions.length === 1) {
            addToCart(product, activeOptions[0]);
        } else {
            setSelectedProduct(product);
            setShowOptionModal(true);
        }
    };

    // Add to cart
    const addToCart = (product, option) => {
        const cartKey = `${product._id}-${option._id}`;
        const existing = cart.find(item => item.cartKey === cartKey);

        if (existing) {
            setCart(cart.map(item =>
                item.cartKey === cartKey
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                        subtotal: (item.quantity + 1) * item.unitPrice,
                    }
                    : item
            ));
        } else {
            setCart([...cart, {
                cartKey,
                productId: product._id,
                productOptionId: option._id?.toString(),
                productName: product.name,
                optionName: option.name,
                unitPrice: option.price,
                quantity: 1,
                subtotal: option.price,
                image: product.image,
            }]);
        }

        setShowOptionModal(false);
        setSelectedProduct(null);
    };

    // Update quantity
    const updateQty = (cartKey, delta) => {
        setCart(cart
            .map(item => item.cartKey === cartKey
                ? {
                    ...item,
                    quantity: item.quantity + delta,
                    subtotal: (item.quantity + delta) * item.unitPrice,
                }
                : item
            )
            .filter(item => item.quantity > 0)
        );
    };

    // Remove item
    const removeItem = (cartKey) => {
        setCart(cart.filter(item => item.cartKey !== cartKey));
    };

    // Cart total
    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Charge / Place Order
    const handleCharge = async () => {
        if (cart.length === 0) return;
        setCharging(true);

        const orderData = {
            cashierId: session?.user?.id,
            cashierName: session?.user?.name,
            items: cart.map(item => ({
                productId: item.productId,
                productOptionId: item.productOptionId,
                productName: item.productName,
                optionName: item.optionName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
            })),
        };

        // OFFLINE — Save locally
        if (!navigator.onLine) {
            try {
                await saveOrderOffline(orderData);
                const count = await getPendingCount();
                setPendingCount(count);

                setCompletedOrder({
                    orderNumber: `OFFLINE-${count}`,
                    totalAmount: cartTotal,
                    cashierName: session?.user?.name,
                    items: cart.map(item => ({
                        productName: item.productName,
                        optionName: item.optionName,
                        quantity: item.quantity,
                        subtotal: item.subtotal,
                    })),
                    createdAt: new Date().toISOString(),
                    isOffline: true,
                });

                setCart([]);
                setShowSuccessModal(true);
                setCharging(false);
                return;
            } catch (err) {
                alert('Failed to save offline order');
                setCharging(false);
                return;
            }
        }

        // ONLINE — Save to server
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await res.json();

            if (res.ok) {
                setCompletedOrder(data.order);
                setCart([]);
                setShowSuccessModal(true);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            // Network error — save offline
            await saveOrderOffline(orderData);
            const count = await getPendingCount();
            setPendingCount(count);

            setCompletedOrder({
                orderNumber: `OFFLINE-${count}`,
                totalAmount: cartTotal,
                cashierName: session?.user?.name,
                items: cart.map(item => ({
                    productName: item.productName,
                    optionName: item.optionName,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                })),
                createdAt: new Date().toISOString(),
                isOffline: true,
            });

            setCart([]);
            setShowSuccessModal(true);
        }

        setCharging(false);
    };

    // Print slip
    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Receipt - ${order.orderNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; font-size: 13px; width: 280px; margin: auto; padding: 16px; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 4px 0; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="center bold" style="font-size:18px; margin-bottom:4px;">🍺 BAR POS</div>
                <div class="center" style="font-size:11px; color:#555;">Official Receipt</div>
                <div class="divider"></div>
                <div class="row"><span>Order #:</span><span class="bold">${order.orderNumber}</span></div>
                <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
                <div class="row"><span>Time:</span><span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
                <div class="row"><span>Cashier:</span><span>${order.cashierName}</span></div>
                <div class="divider"></div>
                ${order.items?.map(item => `
                    <div style="margin-bottom:8px;">
                        <div class="bold">${item.productName}</div>
                        <div class="row">
                            <span style="color:#555;">${item.optionName} x${item.quantity}</span>
                            <span>$${parseFloat(item.subtotal).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
                <div class="divider"></div>
                <div class="row" style="margin-top:4px;">
                    <span class="bold" style="font-size:16px;">TOTAL</span>
                    <span class="bold" style="font-size:16px;">$${parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
                <div class="divider"></div>
                <div class="center" style="margin-top:16px; font-size:12px; color:#555;">
                    Thank you! Please come again 🙏
                </div>
                <script>window.onload = () => { window.print(); }<\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (status === 'loading' || loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: '#1a252f', color: 'white', fontSize: '18px',
            }}>
                Loading POS...
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', height: '100vh',
            background: '#f0f2f5', overflow: 'hidden',
        }}>

            {/* ===== LEFT PANEL — Products ===== */}
            <div style={{
                flex: 1, display: 'flex',
                flexDirection: 'column', overflow: 'hidden',
            }}>

                {/* Top Bar */}
                <div style={{
                    background: '#2c3e50', color: 'white',
                    padding: '12px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        🍺 <span style={{ color: '#f39c12' }}>BAR</span> POS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>

                        {/* Online/Offline Indicator */}
                        <span style={{
                            background: isOnline ? '#1a6b3c' : '#e74c3c',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}>
                            {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>

                        {/* Pending Sync Badge */}
                        {pendingCount > 0 && (
                            <button
                                onClick={syncPendingOrders}
                                disabled={!isOnline || syncing}
                                style={{
                                    background: '#f39c12',
                                    color: 'white',
                                    padding: '5px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isOnline ? 'pointer' : 'not-allowed',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                }}
                            >
                                {syncing ? '🔄 Syncing...' : `⚠️ ${pendingCount} Pending`}
                            </button>
                        )}

                        <span style={{ color: '#bdc3c7' }}>
                            👤 {session?.user?.name}
                            {session?.user?.role === 'super_admin' && (
                                <span style={{
                                    background: '#f39c12', color: 'white',
                                    padding: '1px 7px', borderRadius: '10px',
                                    fontSize: '10px', marginLeft: '6px',
                                }}>
                                    Admin
                                </span>
                            )}
                        </span>

                        {session?.user?.role === 'super_admin' && (
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                style={{
                                    background: '#3d5166', color: 'white',
                                    padding: '6px 14px', border: 'none',
                                    borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                                }}
                            >
                                ⚙️ Admin
                            </button>
                        )}
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{
                                background: '#e74c3c', color: 'white',
                                padding: '6px 14px', border: 'none',
                                borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div style={{
                    background: 'white', padding: '10px 16px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex', gap: '8px',
                    overflowX: 'auto',
                }}>
                    <button
                        onClick={() => setActiveCategory('all')}
                        style={{
                            padding: '7px 18px',
                            background: activeCategory === 'all' ? '#2c3e50' : '#f0f0f0',
                            color: activeCategory === 'all' ? 'white' : '#555',
                            border: 'none', borderRadius: '20px',
                            cursor: 'pointer', fontSize: '13px',
                            fontWeight: activeCategory === 'all' ? 'bold' : 'normal',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveCategory(cat._id.toString())}
                            style={{
                                padding: '7px 18px',
                                background: activeCategory === cat._id.toString() ? '#2c3e50' : '#f0f0f0',
                                color: activeCategory === cat._id.toString() ? 'white' : '#555',
                                border: 'none', borderRadius: '20px',
                                cursor: 'pointer', fontSize: '13px',
                                fontWeight: activeCategory === cat._id.toString() ? 'bold' : 'normal',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Offline Warning Bar */}
                {!isOnline && (
                    <div style={{
                        background: '#f39c12', color: 'white',
                        padding: '8px 20px', textAlign: 'center',
                        fontSize: '13px', fontWeight: 'bold',
                    }}>
                        📶 You are offline — Orders will be saved locally and synced when internet returns
                    </div>
                )}

                {/* Products Grid */}
                <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                    alignContent: 'start',
                }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{
                            gridColumn: '1/-1', textAlign: 'center',
                            padding: '60px', color: '#95a5a6', fontSize: '16px',
                        }}>
                            {!isOnline
                                ? '📶 Offline — Products loaded from cache'
                                : 'No products in this category'
                            }
                        </div>
                    ) : filteredProducts.map(product => (
                        <button
                            key={product._id}
                            onClick={() => handleProductClick(product)}
                            style={{
                                background: 'white', border: '2px solid #e0e0e0',
                                borderRadius: '10px', padding: '0',
                                cursor: 'pointer', textAlign: 'center',
                                overflow: 'hidden',
                                transition: 'all 0.15s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#2c3e50';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#e0e0e0';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                            }}
                        >
                            <img
                                src={product.image || '/images/default-product.png'}
                                alt={product.name}
                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                onError={e => { e.target.src = '/images/default-product.png'; }}
                            />
                            <div style={{ padding: '8px' }}>
                                <div style={{
                                    fontSize: '13px', fontWeight: 'bold',
                                    color: '#2c3e50', marginBottom: '4px', lineHeight: '1.2',
                                }}>
                                    {product.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#95a5a6' }}>
                                    {product.options?.filter(o => o.isActive).length} options
                                </div>
                                <div style={{ fontSize: '13px', color: '#1a6b3c', fontWeight: 'bold', marginTop: '4px' }}>
                                    from ${Math.min(...product.options?.filter(o => o.isActive).map(o => o.price) || [0]).toFixed(2)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== RIGHT PANEL — Cart ===== */}
            <div style={{
                width: '340px', background: 'white',
                display: 'flex', flexDirection: 'column',
                borderLeft: '1px solid #e0e0e0',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
            }}>
                {/* Cart Header */}
                <div style={{
                    padding: '16px 20px',
                    background: '#2c3e50', color: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>🛒 Cart</div>
                    <div style={{ fontSize: '13px', color: '#bdc3c7' }}>
                        {cartCount} item{cartCount !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#95a5a6' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
                            <div style={{ fontSize: '14px' }}>Cart is empty</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Click a product to add</div>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.cartKey} style={{
                            display: 'flex', alignItems: 'center',
                            padding: '10px 8px', borderBottom: '1px solid #f0f0f0', gap: '8px',
                        }}>
                            <img
                                src={item.image || '/images/default-product.png'}
                                alt={item.productName}
                                style={{
                                    width: '44px', height: '44px', objectFit: 'cover',
                                    borderRadius: '6px', border: '1px solid #eee', flexShrink: 0,
                                }}
                                onError={e => { e.target.src = '/images/default-product.png'; }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '13px', fontWeight: 'bold', color: '#2c3e50',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {item.productName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#95a5a6' }}>
                                    {item.optionName} · ${item.unitPrice.toFixed(2)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button onClick={() => updateQty(item.cartKey, -1)} style={{
                                    width: '26px', height: '26px', background: '#f0f0f0',
                                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>−</button>
                                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>
                                    {item.quantity}
                                </span>
                                <button onClick={() => updateQty(item.cartKey, 1)} style={{
                                    width: '26px', height: '26px', background: '#2c3e50',
                                    color: 'white', border: 'none', borderRadius: '4px',
                                    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>+</button>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a6b3c', minWidth: '52px', textAlign: 'right' }}>
                                ${item.subtotal.toFixed(2)}
                            </div>
                            <button onClick={() => removeItem(item.cartKey)} style={{
                                background: 'none', border: 'none', color: '#e74c3c',
                                cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0,
                            }}>✕</button>
                        </div>
                    ))}
                </div>

                {/* Cart Footer */}
                <div style={{ padding: '16px 20px', borderTop: '2px solid #f0f0f0', background: '#fafafa' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '16px',
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>Total</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a6b3c' }}>
                            ${cartTotal.toFixed(2)}
                        </span>
                    </div>

                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} style={{
                            width: '100%', padding: '9px', background: 'white',
                            color: '#e74c3c', border: '2px solid #e74c3c',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '10px',
                        }}>
                            🗑️ Clear Cart
                        </button>
                    )}

                    <button
                        onClick={handleCharge}
                        disabled={cart.length === 0 || charging}
                        style={{
                            width: '100%', padding: '14px',
                            background: cart.length === 0 || charging
                                ? '#95a5a6'
                                : isOnline ? '#1a6b3c' : '#e67e22',
                            color: 'white', border: 'none', borderRadius: '8px',
                            cursor: cart.length === 0 || charging ? 'not-allowed' : 'pointer',
                            fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px',
                        }}
                    >
                        {charging
                            ? 'Processing...'
                            : isOnline
                                ? `💳 CHARGE $${cartTotal.toFixed(2)}`
                                : `💾 SAVE OFFLINE $${cartTotal.toFixed(2)}`
                        }
                    </button>

                    {!isOnline && (
                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#e67e22', marginTop: '6px' }}>
                            📶 Offline — will sync when internet returns
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Option Selection Modal ===== */}
            {showOptionModal && selectedProduct && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '28px',
                        width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                            <img
                                src={selectedProduct.image || '/images/default-product.png'}
                                alt={selectedProduct.name}
                                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #eee' }}
                                onError={e => { e.target.src = '/images/default-product.png'; }}
                            />
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                                    {selectedProduct.name}
                                </h3>
                                <p style={{ color: '#95a5a6', fontSize: '13px', marginTop: '4px' }}>
                                    Select serving option
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {selectedProduct.options?.filter(o => o.isActive).map((option) => (
                                <button
                                    key={option._id}
                                    onClick={() => addToCart(selectedProduct, option)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '14px 18px', background: '#f4f6f8',
                                        border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer',
                                        fontSize: '15px', fontWeight: 'bold', color: '#2c3e50', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#2c3e50';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.borderColor = '#2c3e50';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#f4f6f8';
                                        e.currentTarget.style.color = '#2c3e50';
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                    }}
                                >
                                    <span>{option.name}</span>
                                    <span style={{ color: '#1a6b3c', fontSize: '16px' }}>
                                        ${parseFloat(option.price).toFixed(2)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowOptionModal(false); setSelectedProduct(null); }}
                            style={{
                                width: '100%', padding: '11px', background: '#f0f0f0',
                                color: '#555', border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '14px',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Success Modal ===== */}
            {showSuccessModal && completedOrder && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '36px',
                        width: '100%', maxWidth: '380px', textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <div style={{ fontSize: '60px', marginBottom: '12px' }}>
                            {completedOrder.isOffline ? '💾' : '✅'}
                        </div>
                        <h2 style={{
                            fontSize: '22px', fontWeight: 'bold',
                            color: completedOrder.isOffline ? '#e67e22' : '#1a6b3c',
                            margin: '0 0 8px 0',
                        }}>
                            {completedOrder.isOffline ? 'Saved Offline!' : 'Order Placed!'}
                        </h2>

                        {completedOrder.isOffline && (
                            <div style={{
                                background: '#fff3cd', color: '#856404',
                                padding: '8px 12px', borderRadius: '6px',
                                fontSize: '12px', marginBottom: '12px',
                            }}>
                                ⚠️ Saved locally — will auto-sync when internet returns
                            </div>
                        )}

                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                            {completedOrder.orderNumber}
                        </div>
                        <div style={{ fontSize: '22px', color: '#1a6b3c', fontWeight: 'bold', marginBottom: '28px' }}>
                            ${parseFloat(completedOrder.totalAmount).toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!completedOrder.isOffline && (
                                <button
                                    onClick={() => { handlePrint(completedOrder); setShowSuccessModal(false); }}
                                    style={{
                                        flex: 1, padding: '12px', background: '#2c3e50',
                                        color: 'white', border: 'none', borderRadius: '8px',
                                        cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                                    }}
                                >
                                    🖨️ Print Slip
                                </button>
                            )}
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                style={{
                                    flex: 1, padding: '12px', background: '#1a6b3c',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                                }}
                            >
                                ➕ New Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}