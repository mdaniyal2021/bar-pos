'use client';

import { useEffect, useState } from 'react';
import {
    FiShoppingBag, FiDollarSign, FiTrendingUp,
    FiBox, FiGrid, FiClock, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCategories: 0,
        recentOrders: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Overview</p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Dashboard</h1>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiClock size={13} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Today Stats */}
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>Today</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: "Today's Orders", value: stats.todayOrders, icon: <FiShoppingBag />, color: '#6366f1', bg: '#eef2ff', suffix: '' },
                    { label: "Today's Revenue", value: `$${(stats.todayRevenue || 0).toFixed(2)}`, icon: <FiDollarSign />, color: '#10b981', bg: '#ecfdf5', suffix: '' },
                ].map((card, i) => (
                    <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{card.label}</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* All Time Stats */}
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>All Time</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Total Orders', value: stats.totalOrders, icon: <FiShoppingBag />, color: '#0ea5e9', bg: '#f0f9ff' },
                    { label: 'Total Revenue', value: `$${(stats.totalRevenue || 0).toFixed(2)}`, icon: <FiTrendingUp />, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: 'Active Products', value: stats.totalProducts, icon: <FiBox />, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Categories', value: stats.totalCategories, icon: <FiGrid />, color: '#f43f5e', bg: '#fff1f2' },
                ].map((card, i) => (
                    <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 2px' }}>Latest</p>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Recent Orders</h2>
                    </div>
                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        Last {stats.recentOrders.length} orders
                    </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            {['Order #', 'Date & Time', 'Cashier', 'Items', 'Payment', 'Total', 'Status'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', background: '#f8fafc' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    No orders yet — start selling!
                                </td>
                            </tr>
                        ) : stats.recentOrders.map((order, idx) => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '13px 16px' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#6366f1' }}>{order.orderNumber}</span>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(order.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{order.cashierName || '—'}</td>
                                <td style={{ padding: '13px 16px' }}>
                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                        {order.items?.length} items
                                    </span>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                        background: order.paymentMethod === 'cash' ? '#ecfdf5' : '#eff6ff',
                                        color: order.paymentMethod === 'cash' ? '#059669' : '#2563eb',
                                    }}>
                                        {order.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Bank'}
                                    </span>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}