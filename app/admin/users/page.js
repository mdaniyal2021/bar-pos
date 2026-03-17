'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    FiUsers, FiPlus, FiEdit2, FiTrash2,
    FiX, FiCheck, FiAlertTriangle, FiShield,
    FiUser, FiMail, FiLock, FiCheckCircle
} from 'react-icons/fi';

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const defaultForm = { name: '', email: '', password: '', confirmPassword: '', role: 'cashier', isActive: true };
    const [form, setForm] = useState(defaultForm);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const openCreate = () => {
        setEditItem(null); setForm(defaultForm); setError(''); setShowModal(true);
    };

    const openEdit = (user) => {
        setEditItem(user);
        setForm({ name: user.name, email: user.email, password: '', confirmPassword: '', role: user.role, isActive: user.isActive });
        setError(''); setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Name is required'); return; }
        if (!form.email.trim()) { setError('Email is required'); return; }
        if (!editItem && !form.password) { setError('Password is required'); return; }
        if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (form.password && form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (editItem && editItem._id === session?.user?.id && form.role !== editItem.role) { setError('You cannot change your own role'); return; }

        setSaving(true); setError('');
        const payload = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
        if (form.password) payload.password = form.password;

        const url = editItem ? `/api/users/${editItem._id}` : '/api/users';
        const method = editItem ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();

        if (!res.ok) { setError(data.error || 'Something went wrong'); setSaving(false); return; }
        setShowModal(false);
        setSuccess(data.message || 'Saved successfully!');
        fetchUsers(); setSaving(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDelete = async (user) => {
        if (user._id === session?.user?.id) { alert('You cannot delete your own account!'); return; }
        if (!confirm(`Delete "${user.name}"?`)) return;
        const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
        if (res.ok) { setSuccess('User deleted successfully!'); fetchUsers(); setTimeout(() => setSuccess(''), 3000); }
    };

    const adminCount = users.filter(u => u.role === 'super_admin').length;
    const cashierCount = users.filter(u => u.role === 'cashier').length;
    const activeCount = users.filter(u => u.isActive).length;

    const inputStyle = {
        width: '100%', padding: '9px 12px',
        border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '14px', outline: 'none',
        boxSizing: 'border-box', color: '#0f172a',
        background: '#f8fafc',
    };
    const labelStyle = { display: 'block', fontWeight: '600', color: '#475569', marginBottom: '6px', fontSize: '13px' };

    return (
        <div style={{ padding: '32px', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Management</p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Users</h1>
                </div>
                <button onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <FiPlus size={16} /> New User
                </button>
            </div>

            {/* Success */}
            {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #a7f3d0' }}>
                    <FiCheckCircle size={16} /> {success}
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Users', value: users.length, icon: <FiUsers />, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Admins', value: adminCount, icon: <FiShield />, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Cashiers', value: cashierCount, icon: <FiUser />, color: '#0ea5e9', bg: '#f0f9ff' },
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
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Loading users...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {['#', 'Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', background: '#f8fafc' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No users found</td></tr>
                            ) : users.map((user, index) => (
                                <tr key={user._id} style={{ borderBottom: '1px solid #f8fafc', background: user._id === session?.user?.id ? '#fefce8' : index % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                                background: user.role === 'super_admin' ? '#fef3c7' : '#eff6ff',
                                                color: user.role === 'super_admin' ? '#d97706' : '#3b82f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', fontWeight: '700',
                                            }}>
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{user.name}</div>
                                                {user._id === session?.user?.id && (
                                                    <span style={{ background: '#fbbf24', color: 'white', padding: '1px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>You</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>{user.email}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                            background: user.role === 'super_admin' ? '#fffbeb' : '#eff6ff',
                                            color: user.role === 'super_admin' ? '#d97706' : '#2563eb',
                                        }}>
                                            {user.role === 'super_admin' ? <FiShield size={11} /> : <FiUser size={11} />}
                                            {user.role === 'super_admin' ? 'Admin' : 'Cashier'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                            background: user.isActive ? '#ecfdf5' : '#fef2f2',
                                            color: user.isActive ? '#059669' : '#dc2626',
                                        }}>
                                            {user.isActive ? <FiCheck size={11} /> : <FiX size={11} />}
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => openEdit(user)}
                                                style={{ padding: '7px 10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <FiEdit2 size={14} />
                                            </button>
                                            {user._id !== session?.user?.id && (
                                                <button onClick={() => handleDelete(user)}
                                                    style={{ padding: '7px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <FiTrash2 size={14} />
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

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                    {editItem ? 'Edit User' : 'New User'}
                                </p>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                    {editItem ? editItem.name : 'Add a User'}
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Self edit warning */}
                        {editItem && editItem._id === session?.user?.id && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                                <FiAlertTriangle size={14} /> This is your own account — role cannot be changed.
                            </div>
                        )}

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' }}>
                                <FiAlertTriangle size={14} /> {error}
                            </div>
                        )}

                        {/* Name */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}><FiUser size={12} style={{ marginRight: '5px' }} />Full Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Ahmad Ali" style={inputStyle} />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}><FiMail size={12} style={{ marginRight: '5px' }} />Email *</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="e.g. ahmad@bar.com" style={inputStyle} />
                        </div>

                        {/* Role */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}><FiShield size={12} style={{ marginRight: '5px' }} />Role *</label>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                                disabled={editItem && editItem._id === session?.user?.id}
                                style={{ ...inputStyle, cursor: editItem && editItem._id === session?.user?.id ? 'not-allowed' : 'pointer', opacity: editItem && editItem._id === session?.user?.id ? 0.6 : 1 }}>
                                <option value="cashier">Cashier</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>
                                <FiLock size={12} style={{ marginRight: '5px' }} />
                                {editItem ? 'New Password' : 'Password *'}
                                {editItem && <span style={{ fontWeight: '400', color: '#94a3b8', marginLeft: '6px' }}>(leave empty to keep current)</span>}
                            </label>
                            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Minimum 6 characters" style={inputStyle} />
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}><FiLock size={12} style={{ marginRight: '5px' }} />Confirm Password {!editItem && '*'}</label>
                            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                placeholder="Re-enter password" style={inputStyle} />
                        </div>

                        {/* Active */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="checkbox" id="isActive" checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                disabled={editItem && editItem._id === session?.user?.id}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }} />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                                Active — user can login
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSave} disabled={saving}
                                style={{ flex: 1, padding: '12px', background: saving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '9px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {saving ? 'Saving...' : (editItem ? <><FiCheck size={15} /> Update User</> : <><FiPlus size={15} /> Save User</>)}
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