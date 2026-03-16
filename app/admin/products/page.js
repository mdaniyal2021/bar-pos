'use client';

import { useState, useEffect, useRef } from 'react';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const fileRef = useRef(null);

    // Stock In modal
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockProduct, setStockProduct] = useState(null);
    const [stockQty, setStockQty] = useState('');
    const [stockSaving, setStockSaving] = useState(false);

    const defaultForm = {
        name: '', categoryId: '', isActive: true,
        options: [{ name: '', price: '', isActive: true }],
        stockEnabled: false, stockQuantity: '',
    };
    const [form, setForm] = useState(defaultForm);

    const fetchAll = async () => {
        const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
        const [products, categories] = await Promise.all([pRes.json(), cRes.json()]);
        setProducts(Array.isArray(products) ? products : []);
        setCategories(Array.isArray(categories) ? categories : []);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => {
        setEditItem(null); setForm(defaultForm); setImagePreview(null); setError('');
        if (fileRef.current) fileRef.current.value = '';
        setShowModal(true);
    };

    const openEdit = (product) => {
        setEditItem(product);
        setForm({
            name: product.name,
            categoryId: product.categoryId?.toString() || '',
            isActive: product.isActive,
            options: product.options?.length > 0
                ? product.options.map(o => ({ _id: o._id, name: o.name, price: o.price.toString(), isActive: o.isActive }))
                : [{ name: '', price: '', isActive: true }],
            stockEnabled: product.stockEnabled || false,
            stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity.toString() : '',
        });
        setImagePreview(product.image || null); setError('');
        if (fileRef.current) fileRef.current.value = '';
        setShowModal(true);
    };

    const openStockIn = (product) => { setStockProduct(product); setStockQty(''); setShowStockModal(true); };

    const handleStockIn = async () => {
        const qty = parseInt(stockQty);
        if (!qty || qty <= 0) return;
        setStockSaving(true);
        try {
            const res = await fetch(`/api/products/${stockProduct._id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', quantity: qty }),
            });
            if (res.ok) { setShowStockModal(false); fetchAll(); }
        } catch (e) {}
        setStockSaving(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (ev) => setImagePreview(ev.target.result); reader.readAsDataURL(file); }
    };

    const addOption = () => setForm({ ...form, options: [...form.options, { name: '', price: '', isActive: true }] });
    const removeOption = (index) => { if (form.options.length === 1) return; setForm({ ...form, options: form.options.filter((_, i) => i !== index) }); };
    const updateOption = (index, field, value) => { const updated = [...form.options]; updated[index] = { ...updated[index], [field]: value }; setForm({ ...form, options: updated }); };

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Product name is required'); return; }
        if (!form.categoryId) { setError('Please select a category'); return; }
        const validOptions = form.options.filter(o => o.name.trim() && o.price !== '');
        if (validOptions.length === 0) { setError('At least one complete option is required'); return; }
        setSaving(true); setError('');
        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('categoryId', form.categoryId);
        formData.append('isActive', form.isActive.toString());
        formData.append('options', JSON.stringify(validOptions));
        formData.append('stockEnabled', form.stockEnabled.toString());
        formData.append('stockQuantity', form.stockEnabled ? (parseInt(form.stockQuantity) || 0).toString() : '0');
        if (fileRef.current?.files[0]) formData.append('image', fileRef.current.files[0]);
        if (editItem) formData.append('existingImage', editItem.image || '');
        const url = editItem ? `/api/products/${editItem._id}` : '/api/products';
        const method = editItem ? 'PUT' : 'POST';
        const res = await fetch(url, { method, body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Something went wrong'); setSaving(false); return; }
        setShowModal(false); fetchAll(); setSaving(false);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchAll();
    };

    const getStockBadge = (product) => {
        if (!product.stockEnabled) return null;
        const qty = product.stockQuantity || 0;
        if (qty === 0) return { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' };
        if (qty <= 5) return { label: `Low: ${qty}`, bg: '#fef3c7', color: '#d97706' };
        return { label: `${qty} in stock`, bg: '#dcfce7', color: '#16a34a' };
    };

    const S = {
        label: { display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' },
        input: { width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    };

    return (
        <div style={{ padding: '28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>Products</h1>
                    <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>Home / Products</div>
                </div>
                <button onClick={openCreate} style={{ background: '#1a6b3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    + New Product
                </button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>Loading...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#2c3e50', color: 'white' }}>
                                {['Image', 'Name', 'Category', 'Options & Prices', 'Stock', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>No products found</td></tr>
                            ) : products.map((product) => {
                                const stockBadge = getStockBadge(product);
                                return (
                                    <tr key={product._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px 16px' }}>
                                            <img src={product.image || '/images/default-product.png'} alt={product.name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                                                onError={(e) => { e.target.src = '/images/default-product.png'; }} />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2c3e50' }}>{product.name}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: '#eaf4ee', color: '#1a6b3c', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>
                                                {product.category?.name || '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {product.options?.map((opt, i) => (
                                                <span key={i} style={{ display: 'inline-block', background: '#f0f0f0', color: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', margin: '2px' }}>
                                                    {opt.name}: <strong>${parseFloat(opt.price).toFixed(2)}</strong>
                                                </span>
                                            ))}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {!product.stockEnabled ? (
                                                <span style={{ fontSize: '12px', color: '#aaa' }}>Not tracked</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <span style={{ background: stockBadge.bg, color: stockBadge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' }}>
                                                        {stockBadge.label}
                                                    </span>
                                                    <button onClick={() => openStockIn(product)}
                                                        style={{ background: '#1a6b3c', color: 'white', padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                                                        + Stock In
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: product.isActive ? '#d4edda' : '#f8d7da', color: product.isActive ? '#155724' : '#721c24', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button onClick={() => openEdit(product)} style={{ background: '#3498db', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Edit</button>
                                            <button onClick={() => handleDelete(product._id, product.name)} style={{ background: '#e74c3c', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ===== PRODUCT MODAL ===== */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 24px 0' }}>
                            {editItem ? '✏️ Edit Product' : '➕ New Product'}
                        </h2>
                        {error && (
                            <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>❌ {error}</div>
                        )}
                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={S.label}>Product Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Heineken" style={S.input} />
                        </div>
                        {/* Category */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={S.label}>Category *</label>
                            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={S.input}>
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                        </div>
                        {/* Image */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={S.label}>Product Image <span style={{ fontWeight: 'normal', color: '#95a5a6' }}>(JPG, PNG — max 2MB)</span></label>
                            {imagePreview && <div style={{ marginBottom: '10px' }}><img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e0e0e0' }} /></div>}
                            <input type="file" ref={fileRef} accept="image/*" onChange={handleImageChange} style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                        </div>
                        {/* Active */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#555', cursor: 'pointer' }}>Active (Show on POS)</label>
                        </div>

                        {/* ===== STOCK SECTION ===== */}
                        <div style={{ background: '#f8faff', border: '2px solid #e8f0fe', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.stockEnabled ? '14px' : '0' }}>
                                <input type="checkbox" id="stockEnabled" checked={form.stockEnabled}
                                    onChange={(e) => setForm({ ...form, stockEnabled: e.target.checked, stockQuantity: e.target.checked ? form.stockQuantity : '' })}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                <label htmlFor="stockEnabled" style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', cursor: 'pointer' }}>
                                    📦 Enable Stock Tracking
                                </label>
                            </div>
                            {form.stockEnabled && (
                                <div>
                                    <label style={{ ...S.label, marginBottom: '6px' }}>
                                        {editItem ? 'Current Stock Quantity' : 'Opening Stock Quantity'}
                                    </label>
                                    <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                                        placeholder="e.g. 50" min="0" style={{ ...S.input, width: '160px' }} />
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                                        Stock will decrease automatically when orders are placed
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '15px' }}>Serving Options *</label>
                                <button onClick={addOption} style={{ background: '#f39c12', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>+ Add Option</button>
                            </div>
                            <div style={{ background: '#f9f9f9', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px', color: '#666' }}>
                                Options: Bottle, Glass, Small Glass, Medium Glass, Jar
                            </div>
                            {form.options.map((opt, index) => (
                                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                    <input type="text" value={opt.name} onChange={(e) => updateOption(index, 'name', e.target.value)} placeholder="e.g. Bottle"
                                        style={{ flex: 1, padding: '9px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
                                    <input type="number" value={opt.price} onChange={(e) => updateOption(index, 'price', e.target.value)} placeholder="Price ($)" step="0.01" min="0"
                                        style={{ flex: 1, padding: '9px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={opt.isActive} onChange={(e) => updateOption(index, 'isActive', e.target.checked)} /> Active
                                    </label>
                                    {form.options.length > 1 && (
                                        <button onClick={() => removeOption(index)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Save/Cancel */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleSave} disabled={saving}
                                style={{ flex: 1, padding: '11px', background: saving ? '#95a5a6' : '#1a6b3c', color: 'white', border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                                {saving ? 'Saving...' : (editItem ? 'Update' : 'Save')}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '11px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STOCK IN MODAL ===== */}
            {showStockModal && stockProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 6px 0' }}>📦 Stock In</h2>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                            {stockProduct.name} — Current: <strong style={{ color: '#2c3e50' }}>{stockProduct.stockQuantity || 0}</strong>
                        </div>
                        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '8px', fontSize: '14px' }}>Quantity to Add</label>
                        <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                            placeholder="e.g. 24" min="1" autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleStockIn()}
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '16px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                        {stockQty > 0 && (
                            <div style={{ fontSize: '13px', color: '#1a6b3c', fontWeight: '600', marginBottom: '16px' }}>
                                New total: {(stockProduct.stockQuantity || 0) + parseInt(stockQty || 0)}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleStockIn} disabled={!stockQty || parseInt(stockQty) <= 0 || stockSaving}
                                style={{ flex: 1, padding: '11px', background: !stockQty || parseInt(stockQty) <= 0 || stockSaving ? '#95a5a6' : '#1a6b3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                                {stockSaving ? 'Saving...' : 'Add Stock'}
                            </button>
                            <button onClick={() => { setShowStockModal(false); setStockProduct(null); }}
                                style={{ flex: 1, padding: '11px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}