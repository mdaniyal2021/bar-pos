'use client';

import { useState, useEffect, useRef } from 'react';
import {
    FiBox, FiPlus, FiEdit2, FiTrash2,
    FiPackage, FiX, FiCheck, FiAlertTriangle,
    FiImage, FiTag, FiLayers
} from 'react-icons/fi';

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

    const getStockInfo = (product) => {
        if (!product.stockEnabled) return null;
        const qty = product.stockQuantity || 0;
        if (qty === 0) return { label: 'Out of Stock', bg: '#fef2f2', color: '#dc2626', icon: <FiAlertTriangle size={11} /> };
        if (qty <= 5) return { label: `Low: ${qty}`, bg: '#fffbeb', color: '#d97706', icon: <FiAlertTriangle size={11} /> };
        return { label: `${qty} in stock`, bg: '#ecfdf5', color: '#059669', icon: <FiCheck size={11} /> };
    };

    const inputStyle = {
        width: '100%', padding: '9px 12px',
        border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '14px', outline: 'none',
        boxSizing: 'border-box', color: '#0f172a',
        background: '#f8fafc',
    };

    const labelStyle = {
        display: 'block', fontWeight: '600',
        color: '#475569', marginBottom: '6px', fontSize: '13px',
    };

    // Stats
    const activeCount = products.filter(p => p.isActive).length;
    const trackedCount = products.filter(p => p.stockEnabled).length;
    const lowStockCount = products.filter(p => p.stockEnabled && (p.stockQuantity || 0) <= 5).length;

    return (
        <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Management</p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Products</h1>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <FiPlus size={16} /> New Product
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Products', value: products.length, icon: <FiBox />, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Active', value: activeCount, icon: <FiCheck />, color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Low Stock', value: lowStockCount, icon: <FiAlertTriangle />, color: lowStockCount > 0 ? '#f59e0b' : '#10b981', bg: lowStockCount > 0 ? '#fffbeb' : '#ecfdf5' },
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
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading products...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                {['Image', 'Product', 'Category', 'Options & Prices', 'Stock', 'Status', 'Actions'].map(h => (
                                    <th 
                                        key={h} 
                                        style={{ 
                                            padding: '13px 16px',textAlign: 'left',fontSize: '11px',fontWeight: '700',  color: '#f1f5f9',letterSpacing: '1px',textTransform: 'uppercase',background: '#0f172a'
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No products found — create your first one!</td></tr>
                            ) : products.map((product, idx) => {
                                const stockInfo = getStockInfo(product);
                                return (
                                    <tr key={product._id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                        {/* Image */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
                                                <img src={product.image || '/images/default-product.png'} alt={product.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = '/images/default-product.png'; }} />
                                            </div>
                                        </td>

                                        {/* Name */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{product.name}</div>
                                        </td>

                                        {/* Category */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: '#eef2ff', color: '#6366f1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                                {product.category?.name || '—'}
                                            </span>
                                        </td>

                                        {/* Options */}
                                        <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {product.options?.filter(o => o.isActive).map((opt, i) => (
                                                    <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                        {opt.name} <span style={{ fontWeight: '700', color: '#0f172a' }}>${parseFloat(opt.price).toFixed(2)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Stock */}
                                        <td style={{ padding: '12px 16px' }}>
                                            {!product.stockEnabled ? (
                                                <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>Not tracked</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: stockInfo.bg, color: stockInfo.color, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                                        {stockInfo.icon} {stockInfo.label}
                                                    </span>
                                                    <button onClick={() => openStockIn(product)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                                                        <FiPlus size={11} /> Stock In
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                                background: product.isActive ? '#ecfdf5' : '#fef2f2',
                                                color: product.isActive ? '#059669' : '#dc2626',
                                            }}>
                                                {product.isActive ? <FiCheck size={11} /> : <FiX size={11} />}
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => openEdit(product)}
                                                    style={{ padding: '7px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(product._id, product.name)}
                                                    style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                    {editItem ? 'Edit Product' : 'New Product'}
                                </p>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                    {editItem ? editItem.name : 'Add a Product'}
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
                            <label style={labelStyle}>Product Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Heineken, Jack Daniels" style={inputStyle} />
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Category *</label>
                            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle}>
                                <option value="">— Select Category —</option>
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                        </div>

                        {/* Image */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Product Image <span style={{ fontWeight: '400', color: '#94a3b8' }}>(JPG, PNG — max 2MB)</span></label>
                            {imagePreview && (
                                <div style={{ marginBottom: '10px' }}>
                                    <img src={imagePreview} alt="Preview"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                </div>
                            )}
                            <input type="file" ref={fileRef} accept="image/*" onChange={handleImageChange}
                                style={{ width: '100%', padding: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fafc' }} />
                        </div>

                        {/* Active toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }} />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                                Active — show on POS screen
                            </label>
                        </div>

                        {/* Stock Section */}
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.stockEnabled ? '14px' : '0' }}>
                                <input type="checkbox" id="stockEnabled" checked={form.stockEnabled}
                                    onChange={(e) => setForm({ ...form, stockEnabled: e.target.checked, stockQuantity: e.target.checked ? form.stockQuantity : '' })}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0ea5e9' }} />
                                <label htmlFor="stockEnabled" style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiPackage size={15} /> Enable Stock Tracking
                                </label>
                            </div>
                            {form.stockEnabled && (
                                <div>
                                    <label style={{ ...labelStyle, color: '#0369a1' }}>
                                        {editItem ? 'Current Stock Quantity' : 'Opening Stock Quantity'}
                                    </label>
                                    <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                                        placeholder="e.g. 50" min="0"
                                        style={{ ...inputStyle, width: '140px', background: 'white' }} />
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0' }}>
                                        Decreases automatically when orders are placed
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiLayers size={14} /> Serving Options *
                                </label>
                                <button onClick={addOption}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                    <FiPlus size={12} /> Add Option
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                                e.g. Bottle, Glass, Small Glass, Medium Glass, Jar
                            </p>
                            {form.options.map((opt, index) => (
                                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <input type="text" value={opt.name} onChange={(e) => updateOption(index, 'name', e.target.value)}
                                        placeholder="e.g. Bottle"
                                        style={{ flex: 2, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
                                    <input type="number" value={opt.price} onChange={(e) => updateOption(index, 'price', e.target.value)}
                                        placeholder="Price" step="0.01" min="0"
                                        style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={opt.isActive} onChange={(e) => updateOption(index, 'isActive', e.target.checked)}
                                            style={{ accentColor: '#6366f1' }} /> On
                                    </label>
                                    {form.options.length > 1 && (
                                        <button onClick={() => removeOption(index)}
                                            style={{ padding: '7px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex' }}>
                                            <FiX size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Save/Cancel */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} disabled={saving}
                                style={{ flex: 1, padding: '12px', background: saving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '9px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {saving ? 'Saving...' : (editItem ? <><FiCheck size={15} /> Update Product</> : <><FiPlus size={15} /> Save Product</>)}
                            </button>
                            <button onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STOCK IN MODAL ===== */}
            {showStockModal && stockProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowStockModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Stock Management</p>
                                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{stockProduct.name}</h2>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                                    Current stock: <span style={{ fontWeight: '700', color: '#0f172a' }}>{stockProduct.stockQuantity || 0}</span> units
                                </p>
                            </div>
                            <button onClick={() => setShowStockModal(false)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <FiX size={16} />
                            </button>
                        </div>

                        <label style={{ ...labelStyle, marginBottom: '8px' }}>Quantity to Add</label>
                        <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)}
                            placeholder="e.g. 24" min="1" autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleStockIn()}
                            style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '20px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }} />

                        {stockQty > 0 && (
                            <div style={{ textAlign: 'center', fontSize: '13px', color: '#059669', fontWeight: '600', marginBottom: '16px', padding: '8px', background: '#ecfdf5', borderRadius: '8px' }}>
                                New total will be: <strong>{(stockProduct.stockQuantity || 0) + parseInt(stockQty || 0)} units</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleStockIn} disabled={!stockQty || parseInt(stockQty) <= 0 || stockSaving}
                                style={{ flex: 1, padding: '12px', background: !stockQty || parseInt(stockQty) <= 0 || stockSaving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FiPackage size={15} /> {stockSaving ? 'Saving...' : 'Add Stock'}
                            </button>
                            <button onClick={() => { setShowStockModal(false); setStockProduct(null); }}
                                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}