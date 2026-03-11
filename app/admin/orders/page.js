'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });
    const [filters, setFilters] = useState({ date: '', status: '' });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.status) params.append('status', filters.status);

        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();

        setOrders(data.orders || []);
        setStats({
            totalOrders: data.totalOrders || 0,
            totalRevenue: data.totalRevenue || 0,
        });
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchOrders();
    };

    const clearFilters = () => {
        setFilters({ date: '', status: '' });
        setTimeout(fetchOrders, 100);
    };

    const openDetail = async (order) => {
        setSelectedOrder(order);
        setShowDetail(true);
    };

    const handleVoid = async (id) => {
        if (!confirm('Void this order?')) return;

        const res = await fetch(`/api/orders/${id}`, { method: 'PATCH' });
        if (res.ok) {
            fetchOrders();
            if (selectedOrder?._id === id) {
                setSelectedOrder({ ...selectedOrder, status: 'voided' });
            }
        }
    };

    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(generateSlipHTML(order));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    const generateSlipHTML = (order) => `
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
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size:16px; margin-bottom:4px;">🍺 BAR POS</div>
            <div class="center" style="font-size:11px; color:#555; margin-bottom:4px;">Official Receipt</div>
            <div class="divider"></div>
            <div class="row"><span>Order #:</span><span class="bold">${order.orderNumber}</span></div>
            <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
            <div class="row"><span>Time:</span><span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
            <div class="row"><span>Cashier:</span><span>${order.cashierName || '—'}</span></div>
            <div class="divider"></div>
            ${order.items?.map(item => `
                <div style="margin-bottom:6px;">
                    <div class="bold">${item.productName}</div>
                    <div class="row">
                        <span style="color:#555;">${item.optionName} x${item.quantity}</span>
                        <span>$${parseFloat(item.subtotal).toFixed(2)}</span>
                    </div>
                </div>
            `).join('')}
            <div class="divider"></div>
            <div class="row">
                <span class="bold" style="font-size:15px;">TOTAL</span>
                <span class="bold" style="font-size:15px;">$${parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="center" style="margin-top:16px; font-size:12px; color:#555;">
                Thank you! Please come again 🙏
            </div>
        </body>
        </html>
    `;

    return (
        <div style={{ padding: '28px' }}>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                    Order History
                </h1>
                <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                    Home / Orders
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '20px',
            }}>
                <div style={{
                    background: 'white', padding: '20px',
                    borderRadius: '8px', borderLeft: '4px solid #1a6b3c',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Filtered Orders
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {stats.totalOrders}
                        </div>
                    </div>
                    <div style={{ fontSize: '32px' }}>🧾</div>
                </div>

                <div style={{
                    background: 'white', padding: '20px',
                    borderRadius: '8px', borderLeft: '4px solid #f39c12',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Filtered Revenue
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            ${stats.totalRevenue.toFixed(2)}
                        </div>
                    </div>
                    <div style={{ fontSize: '32px' }}>💰</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                background: 'white', padding: '16px 20px',
                borderRadius: '8px', marginBottom: '20px',
            }}>
                <form onSubmit={handleFilter} style={{
                    display: 'flex', gap: '12px',
                    alignItems: 'flex-end', flexWrap: 'wrap',
                }}>
                    <div>
                        <label style={{
                            display: 'block', fontSize: '12px',
                            color: '#555', fontWeight: 'bold', marginBottom: '4px',
                        }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            style={{
                                padding: '8px 12px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '13px',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block', fontSize: '12px',
                            color: '#555', fontWeight: 'bold', marginBottom: '4px',
                        }}>
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{
                                padding: '8px 12px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '13px',
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="voided">Voided</option>
                        </select>
                    </div>

                    <button type="submit" style={{
                        background: '#2c3e50', color: 'white',
                        padding: '8px 20px', border: 'none',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
                    }}>
                        🔍 Filter
                    </button>

                    <button type="button" onClick={clearFilters} style={{
                        background: '#95a5a6', color: 'white',
                        padding: '8px 20px', border: 'none',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
                    }}>
                        Clear
                    </button>
                </form>
            </div>

            {/* Orders Table */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                        Loading...
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#2c3e50', color: 'white' }}>
                                {['Order #', 'Date & Time', 'Cashier', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                                        No orders found
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#3498db' }}>
                                        {order.orderNumber}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                        <br />
                                        <span style={{ color: '#95a5a6' }}>
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {order.cashierName || '—'}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>
                                        {order.items?.map((item, i) => (
                                            <div key={i}>
                                                {item.productName} ({item.optionName}) x{item.quantity}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: '15px' }}>
                                        ${parseFloat(order.totalAmount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: order.status === 'completed' ? '#d4edda' : '#f8d7da',
                                            color: order.status === 'completed' ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                        }}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button
                                            onClick={() => openDetail(order)}
                                            style={{
                                                background: '#3498db', color: 'white',
                                                padding: '5px 12px', border: 'none',
                                                borderRadius: '4px', cursor: 'pointer',
                                                fontSize: '12px', marginRight: '6px',
                                            }}
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handlePrint(order)}
                                            style={{
                                                background: '#2c3e50', color: 'white',
                                                padding: '5px 12px', border: 'none',
                                                borderRadius: '4px', cursor: 'pointer',
                                                fontSize: '12px', marginRight: '6px',
                                            }}
                                        >
                                            🖨️
                                        </button>
                                        {order.status === 'completed' && (
                                            <button
                                                onClick={() => handleVoid(order._id)}
                                                style={{
                                                    background: '#e74c3c', color: 'white',
                                                    padding: '5px 12px', border: 'none',
                                                    borderRadius: '4px', cursor: 'pointer',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                Void
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Order Detail Modal */}
            {showDetail && selectedOrder && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000,
                    padding: '20px',
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px',
                        padding: '32px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: '24px',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                                    {selectedOrder.orderNumber}
                                </h2>
                                <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                                    {new Date(selectedOrder.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <span style={{
                                background: selectedOrder.status === 'completed' ? '#d4edda' : '#f8d7da',
                                color: selectedOrder.status === 'completed' ? '#155724' : '#721c24',
                                padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
                            }}>
                                {selectedOrder.status === 'completed' ? '✅ Completed' : '❌ Voided'}
                            </span>
                        </div>

                        {/* Info */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: '12px', marginBottom: '24px',
                        }}>
                            {[
                                { label: 'Cashier', value: selectedOrder.cashierName || '—' },
                                { label: 'Total Items', value: `${selectedOrder.items?.reduce((s, i) => s + i.quantity, 0)} items` },
                            ].map((info, i) => (
                                <div key={i} style={{
                                    background: '#f4f6f8', padding: '12px 16px', borderRadius: '6px',
                                }}>
                                    <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '4px' }}>
                                        {info.label}
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                        {info.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Items Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ background: '#f4f6f8' }}>
                                    {['Product', 'Option', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontSize: '13px' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items?.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{item.productName}</td>
                                        <td style={{ padding: '10px 12px', color: '#666' }}>{item.optionName}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px 12px' }}>${parseFloat(item.unitPrice).toFixed(2)}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#f4f6f8' }}>
                                    <td colSpan={4} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                                        Grand Total
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '18px', color: '#1a6b3c' }}>
                                        ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handlePrint(selectedOrder)}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: '#2c3e50', color: 'white',
                                    border: 'none', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '14px',
                                }}
                            >
                                🖨️ Print Slip
                            </button>
                            {selectedOrder.status === 'completed' && (
                                <button
                                    onClick={() => {
                                        handleVoid(selectedOrder._id);
                                        setShowDetail(false);
                                    }}
                                    style={{
                                        flex: 1, padding: '10px',
                                        background: '#e74c3c', color: 'white',
                                        border: 'none', borderRadius: '6px',
                                        cursor: 'pointer', fontSize: '14px',
                                    }}
                                >
                                    ❌ Void Order
                                </button>
                            )}
                            <button
                                onClick={() => setShowDetail(false)}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: '#f0f0f0', color: '#555',
                                    border: 'none', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '14px',
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}