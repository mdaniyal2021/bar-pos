'use client';

import { useState, useEffect } from 'react';
import {
    FiFileText, FiDollarSign, FiSearch, FiX,
    FiPrinter, FiEye, FiSlash, FiFilter,
    FiCreditCard, FiShoppingBag, FiCalendar,
    FiChevronDown, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, cashRevenue: 0, bankRevenue: 0 });
    const [filters, setFilters] = useState({ date: '', status: '', paymentMethod: '' });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchOrders = async (currentFilters) => {
        setLoading(true);
        const f = currentFilters || filters;
        const params = new URLSearchParams();
        if (f.date) { params.append('dateFrom', f.date); params.append('dateTo', f.date); }
        if (f.status) params.append('status', f.status);
        if (f.paymentMethod) params.append('paymentMethod', f.paymentMethod);
        params.append('limit', '100');

        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();
        const ordersList = data.orders || [];
        setOrders(ordersList);

        const activeOrders = ordersList.filter(o => o.status === 'active');
        setStats({
            totalOrders: activeOrders.length,
            totalRevenue: activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
            cashRevenue: activeOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
            bankRevenue: activeOrders.filter(o => o.paymentMethod === 'bank').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        });
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    const clearFilters = () => {
        const empty = { date: '', status: '', paymentMethod: '' };
        setFilters(empty);
        fetchOrders(empty);
    };

    const handleVoid = async (id) => {
        if (!confirm('Void this order?')) return;
        const res = await fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'void' }),
        });
        if (res.ok) {
            fetchOrders();
            if (selectedOrder?._id === id) setSelectedOrder({ ...selectedOrder, status: 'void' });
        }
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
        <div class="row"><span>Payment</span><span class="bold">${(order.paymentMethod || 'cash').toUpperCase()}</span></div>
        ${order.paymentMethod === 'cash' ? `<div class="row"><span>Received</span><span>$${parseFloat(order.amountReceived || order.totalAmount).toFixed(2)}</span></div><div class="row"><span class="bold">Change</span><span class="bold">$${parseFloat(order.changeAmount || 0).toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="center" style="margin-top:14px;font-size:11px;color:#777">Thank you for visiting</div>
        <script>window.onload=()=>{window.print()}<\/script></body></html>`);
        w.document.close();
    };

    return (
        <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Management</p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Order History</h1>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Orders', value: stats.totalOrders, icon: <FiShoppingBag />, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <FiDollarSign />, color: '#0ea5e9', bg: '#f0f9ff' },
                    { label: 'Cash', value: `$${stats.cashRevenue.toFixed(2)}`, icon: <FiFileText />, color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Bank', value: `$${stats.bankRevenue.toFixed(2)}`, icon: <FiCreditCard />, color: '#f59e0b', bg: '#fffbeb' },
                ].map((card, i) => (
                    <div key={i} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '600', marginRight: '4px' }}>
                        <FiFilter size={15} /> Filters
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FiCalendar style={{ position: 'absolute', left: '10px', color: '#94a3b8', fontSize: '14px' }} />
                            <input type="date" value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                style={{ padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#334155', outline: 'none', background: '#f8fafc' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</label>
                        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{ padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#334155', outline: 'none', background: '#f8fafc', appearance: 'none', cursor: 'pointer' }}>
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="void">Void</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Payment</label>
                        <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                            style={{ padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#334155', outline: 'none', background: '#f8fafc', appearance: 'none', cursor: 'pointer' }}>
                            <option value="">All</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                        </select>
                    </div>
                    <button onClick={() => fetchOrders()}
                        style={{ padding: '9px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiSearch size={14} /> Search
                    </button>
                    <button onClick={clearFilters}
                        style={{ padding: '9px 16px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiX size={14} /> Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading orders...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}> {/* Darker border for separation */}
                            {[
                                'Order #',  'Date & Time',  'Cashier',  'Items',  'Payment',  'Total',  'Status', 'Actions'
                            ].map(h => (
                                <th 
                                    key={h} 
                                    style={{  padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#f1f5f9',  letterSpacing: '1px', textTransform: 'uppercase', background: '#0f172a' 
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No orders found</td></tr>
                            ) : orders.map((order, idx) => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #f8fafc', opacity: order.status === 'void' ? 0.55 : 1, background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#6366f1' }}>{order.orderNumber}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(order.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{order.cashierName || '—'}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                            {order.items?.length} items
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                            background: order.paymentMethod === 'cash' ? '#ecfdf5' : '#eff6ff',
                                            color: order.paymentMethod === 'cash' ? '#059669' : '#2563eb',
                                        }}>
                                            {order.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Bank'}
                                        </span>
                                        {order.paymentMethod === 'cash' && order.changeAmount > 0 && (
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                                                Chg: ${parseFloat(order.changeAmount).toFixed(2)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>${parseFloat(order.totalAmount).toFixed(2)}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                            background: order.status === 'active' ? '#ecfdf5' : '#fef2f2',
                                            color: order.status === 'active' ? '#059669' : '#dc2626',
                                        }}>
                                            {order.status === 'active' ? <FiCheckCircle size={11} /> : <FiXCircle size={11} />}
                                            {order.status === 'active' ? 'Active' : 'Void'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => { setSelectedOrder(order); setShowDetail(true); }}
                                                style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiEye size={13} />
                                            </button>
                                            <button onClick={() => handlePrint(order)}
                                                style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiPrinter size={13} />
                                            </button>
                                            {order.status === 'active' && (
                                                <button onClick={() => handleVoid(order._id)}
                                                    style={{ padding: '6px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FiSlash size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {showDetail && selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowDetail(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Order Details</p>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>{selectedOrder.orderNumber}</h2>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                                    background: selectedOrder.status === 'active' ? '#ecfdf5' : '#fef2f2',
                                    color: selectedOrder.status === 'active' ? '#059669' : '#dc2626',
                                }}>
                                    {selectedOrder.status === 'active' ? <FiCheckCircle size={13} /> : <FiXCircle size={13} />}
                                    {selectedOrder.status === 'active' ? 'Active' : 'Void'}
                                </span>
                                <button onClick={() => setShowDetail(false)}
                                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                    <FiX size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                            {[
                                { label: 'Cashier', value: selectedOrder.cashierName || '—' },
                                { label: 'Total Items', value: `${selectedOrder.items?.reduce((s, i) => s + i.quantity, 0)} items` },
                                { label: 'Payment', value: (selectedOrder.paymentMethod || 'cash').toUpperCase() },
                                { label: 'Amount Received', value: selectedOrder.paymentMethod === 'cash' ? `$${parseFloat(selectedOrder.amountReceived || selectedOrder.totalAmount).toFixed(2)}` : '—' },
                            ].map((info, i) => (
                                <div key={i} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{info.label}</div>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{info.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Items Table */}
                        <div style={{ border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        {['Product', 'Option', 'Qty', 'Unit', 'Total'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>{item.productName}</td>
                                            <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.optionName}</td>
                                            <td style={{ padding: '12px 14px', color: '#64748b', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 14px', color: '#64748b' }}>${parseFloat(item.unitPrice).toFixed(2)}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
                                        <td colSpan={4} style={{ padding: '14px', textAlign: 'right', fontWeight: '700', color: '#475569', fontSize: '13px' }}>Grand Total</td>
                                        <td style={{ padding: '14px', fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>${parseFloat(selectedOrder.totalAmount).toFixed(2)}</td>
                                    </tr>
                                    {selectedOrder.paymentMethod === 'cash' && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'right', color: '#059669', fontWeight: '600', fontSize: '13px' }}>Change Given</td>
                                            <td style={{ padding: '10px 14px', color: '#059669', fontWeight: '700', fontSize: '15px' }}>${parseFloat(selectedOrder.changeAmount || 0).toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handlePrint(selectedOrder)}
                                style={{ flex: 1, padding: '11px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FiPrinter size={15} /> Print Receipt
                            </button>
                            {selectedOrder.status === 'active' && (
                                <button onClick={() => { handleVoid(selectedOrder._id); setShowDetail(false); }}
                                    style={{ flex: 1, padding: '11px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <FiSlash size={15} /> Void Order
                                </button>
                            )}
                            <button onClick={() => setShowDetail(false)}
                                style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}