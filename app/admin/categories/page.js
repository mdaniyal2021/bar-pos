'use client';

import { useState, useEffect } from 'react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', isActive: true });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    // Open modal for create
    const openCreate = () => {
        setEditItem(null);
        setForm({ name: '', isActive: true });
        setError('');
        setShowModal(true);
    };

    // Open modal for edit
    const openEdit = (category) => {
        setEditItem(category);
        setForm({ name: category.name, isActive: category.isActive });
        setError('');
        setShowModal(true);
    };

    // Save (create or update)
    const handleSave = async () => {
        if (!form.name.trim()) {
            setError('Category name is required');
            return;
        }

        setSaving(true);
        setError('');

        const url = editItem
            ? `/api/categories/${editItem._id}`
            : '/api/categories';

        const method = editItem ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Something went wrong');
            setSaving(false);
            return;
        }

        setShowModal(false);
        fetchCategories();
        setSaving(false);
    };

    // Delete
    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;

        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });

        if (res.ok) {
            fetchCategories();
        }
    };

    return (
        <div style={{ padding: '28px' }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
            }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                        Categories
                    </h1>
                    <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                        Home / Categories
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        background: '#1a6b3c',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }}
                >
                    + New Category
                </button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                        Loading...
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#2c3e50', color: 'white' }}>
                                {['#', 'Name', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '13px',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: '#95a5a6',
                                    }}>
                                        No categories found — create your first one!
                                    </td>
                                </tr>
                            ) : categories.map((cat, index) => (
                                <tr key={cat._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px 16px', color: '#666' }}>
                                        {index + 1}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2c3e50' }}>
                                        {cat.name}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: cat.isActive ? '#d4edda' : '#f8d7da',
                                            color: cat.isActive ? '#155724' : '#721c24',
                                            padding: '3px 10px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                        }}>
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#95a5a6', fontSize: '13px' }}>
                                        {new Date(cat.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button
                                            onClick={() => openEdit(cat)}
                                            style={{
                                                background: '#3498db',
                                                color: 'white',
                                                padding: '6px 14px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                marginRight: '8px',
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat._id, cat.name)}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                padding: '6px 14px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                            marginBottom: '24px',
                            margin: '0 0 24px 0',
                        }}>
                            {editItem ? '✏️ Edit Category' : '➕ New Category'}
                        </h2>

                        {error && (
                            <div style={{
                                background: '#f8d7da',
                                color: '#721c24',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                marginBottom: '16px',
                                fontSize: '14px',
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontWeight: 'bold',
                                color: '#555',
                                marginBottom: '6px',
                                fontSize: '14px',
                            }}>
                                Category Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Beer, Spirits, Wine"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '28px',
                        }}>
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#555', cursor: 'pointer' }}>
                                Active (Show on POS)
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    padding: '11px',
                                    background: saving ? '#95a5a6' : '#1a6b3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: 'bold',
                                }}
                            >
                                {saving ? 'Saving...' : (editItem ? 'Update' : 'Save')}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '11px',
                                    background: '#f0f0f0',
                                    color: '#555',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
