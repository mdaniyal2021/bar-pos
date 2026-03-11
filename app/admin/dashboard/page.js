'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalCategories: 0,
        recentOrders: [],
        topProducts: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '28px', color: '#95a5a6' }}>Loading...</div>
        );
    }

    return (
        <div style={{ padding: '28px' }}>

            {/* Page Title */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                    Dashboard
                </h1>
                <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                    Home / Dashboard
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {[
                    { label: "Today's Orders", value: stats.todayOrders, color: '#1a6b3c', icon: '🧾' },
                    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, color: '#f39c12', icon: '💰' },
                    { label: 'Total Orders', value: stats.totalOrders, color: '#3498db', icon: '📦' },
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, color: '#9b59b6', icon: '💵' },
                ].map((card, i) => (
                    <div key={i} style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${card.color}`,
                    }}>
                        <div style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Second Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {[
                    { label: 'Active Products', value: stats.totalProducts, color: '#e74c3c' },
                    { label: 'Active Categories', value: stats.totalCategories, color: '#1abc9c' },
                ].map((card, i) => (
                    <div key={i} style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${card.color}`,
                    }}>
                        <div style={{ fontSize: '12px', color: '#95a5a6', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {card.label}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    fontSize: '15px',
                }}>
                    🧾 Recent Orders
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f4f6f8' }}>
                            {['Order #', 'Date & Time', 'Cashier', 'Items', 'Total', 'Status'].map(h => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#555' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                                    No orders yet
                                </td>
                            </tr>
                        ) : stats.recentOrders.map((order) => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#3498db' }}>
                                    {order.orderNumber}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#666' }}>
                                    {new Date(order.createdAt).toLocaleDateString()}{' '}
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </td>
                                <td style={{ padding: '12px 16px' }}>{order.cashierName}</td>
                                <td style={{ padding: '12px 16px', color: '#666' }}>
                                    {order.items?.length} items
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                                    ${order.totalAmount?.toFixed(2)}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        background: order.status === 'completed' ? '#d4edda' : '#f8d7da',
                                        color: order.status === 'completed' ? '#155724' : '#721c24',
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                    }}>
                                        {order.status}
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