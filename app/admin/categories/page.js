'use client';

import { useState, useEffect } from 'react';
import {
    FiGrid, FiPlus, FiEdit2, FiTrash2,
    FiX, FiCheck, FiAlertTriangle
} from 'react-icons/fi';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', isActive: true });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    const openCreate = () => {
        setEditItem(null);
        setForm({ name: '', isActive: true });
        setError('');
        setShowModal(true);
    };

    const openEdit = (category) => {
        setEditItem(category);
        setForm({ name: category.name, isActive: category.isActive });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Category name is required'); return; }
        setSaving(true); setError('');

        const url = editItem ? `/api/categories/${editItem._id}` : '/api/categories';
        const method = editItem ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await res.json();

        if (!res.ok) { setError(data.error || 'Something went wrong'); setSaving(false); return; }
        setShowModal(false);
        fetchCategories();
        setSaving(false);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (res.ok) fetchCategories();
    };

    const activeCount = categories.filter(c => c.isActive).length;
    const inactiveCount = categories.filter(c => !c.isActive).length;

    return (
        <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Management</p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Categories</h1>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <FiPlus size={16} /> New Category
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Categories', value: categories.length, icon: <FiGrid />, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Active', value: activeCount, icon: <FiCheck />, color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Inactive', value: inactiveCount, icon: <FiX />, color: '#f43f5e', bg: '#fff1f2' },
                ].map((card, i) => (
                    <div key={i} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</div>
                            <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading categories...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                            {['#', 'Name', 'Status', 'Created', 'Actions'].map(h => (
                                <th 
                                    key={h} 
                                    style={{ 
                                        padding: '13px 16px', textAlign: 'left',  fontSize: '11px', fontWeight: '700',  color: '#f1f5f9', letterSpacing: '1px', textTransform: 'uppercase',background: '#0f172a' 
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No categories found — create your first one!</td></tr>
                            ) : categories.map((cat, index) => (
                                <tr key={cat._id} style={{ borderBottom: '1px solid #f8fafc', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                                <FiGrid size={16} />
                                            </div>
                                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{cat.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                            background: cat.isActive ? '#ecfdf5' : '#fef2f2',
                                            color: cat.isActive ? '#059669' : '#dc2626',
                                        }}>
                                            {cat.isActive ? <FiCheck size={11} /> : <FiX size={11} />}
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                                        {new Date(cat.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => openEdit(cat)}
                                                style={{ padding: '7px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(cat._id, cat.name)}
                                                style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                    {editItem ? 'Edit Category' : 'New Category'}
                                </p>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                    {editItem ? editItem.name : 'Add a Category'}
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <FiX size={16} />
                            </button>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' }}>
                                <FiAlertTriangle size={14} /> {error}
                            </div>
                        )}

                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#475569', marginBottom: '6px', fontSize: '13px' }}>
                                Category Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="e.g. Beer, Spirits, Wine"
                                autoFocus
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a' }}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }} />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                                Active — show on POS screen
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} disabled={saving}
                                style={{ flex: 1, padding: '12px', background: saving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '9px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {saving ? 'Saving...' : (editItem ? <><FiCheck size={15} /> Update</> : <><FiPlus size={15} /> Save</>)}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}