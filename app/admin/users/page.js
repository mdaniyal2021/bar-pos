'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const defaultForm = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'cashier',
        isActive: true,
    };
    const [form, setForm] = useState(defaultForm);

    // Fetch users
    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    // Open create
    const openCreate = () => {
        setEditItem(null);
        setForm(defaultForm);
        setError('');
        setShowModal(true);
    };

    // Open edit
    const openEdit = (user) => {
        setEditItem(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role: user.role,
            isActive: user.isActive,
        });
        setError('');
        setShowModal(true);
    };

    // Save
    const handleSave = async () => {
        // Validation
        if (!form.name.trim()) { setError('Name is required'); return; }
        if (!form.email.trim()) { setError('Email is required'); return; }

        if (!editItem && !form.password) {
            setError('Password is required');
            return;
        }
        if (form.password && form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (form.password && form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Prevent self role change
        if (editItem && editItem._id === session?.user?.id && form.role !== editItem.role) {
            setError('You cannot change your own role');
            return;
        }

        setSaving(true);
        setError('');

        const payload = {
            name: form.name,
            email: form.email,
            role: form.role,
            isActive: form.isActive,
        };

        if (form.password) {
            payload.password = form.password;
        }

        const url = editItem ? `/api/users/${editItem._id}` : '/api/users';
        const method = editItem ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Something went wrong');
            setSaving(false);
            return;
        }

        setShowModal(false);
        setSuccess(data.message);
        fetchUsers();
        setSaving(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    // Delete
    const handleDelete = async (user) => {
        if (user._id === session?.user?.id) {
            alert('You cannot delete your own account!');
            return;
        }
        if (!confirm(`Delete "${user.name}"?`)) return;

        const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE' });
        if (res.ok) {
            setSuccess('User deleted successfully!');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    return (
        <div style={{ padding: '28px' }}>

            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '24px',
            }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                        Users
                    </h1>
                    <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                        Home / Users
                    </div>
                </div>
                <button onClick={openCreate} style={{
                    background: '#1a6b3c', color: 'white',
                    padding: '10px 20px', border: 'none',
                    borderRadius: '6px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 'bold',
                }}>
                    + New User
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div style={{
                    background: '#d4edda', color: '#155724',
                    padding: '12px 16px', borderRadius: '6px',
                    marginBottom: '20px', fontSize: '14px',
                }}>
                    ✅ {success}
                </div>
            )}

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
                                {['#', 'Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                                        No users found
                                    </td>
                                </tr>
                            ) : users.map((user, index) => (
                                <tr key={user._id} style={{
                                    borderBottom: '1px solid #f0f0f0',
                                    background: user._id === session?.user?.id ? '#fffbf0' : 'white',
                                }}>
                                    <td style={{ padding: '12px 16px', color: '#666' }}>
                                        {index + 1}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <strong>{user.name}</strong>
                                        {user._id === session?.user?.id && (
                                            <span style={{
                                                background: '#f39c12', color: 'white',
                                                padding: '1px 7px', borderRadius: '10px',
                                                fontSize: '10px', marginLeft: '8px',
                                            }}>
                                                You
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#666', fontSize: '13px' }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: user.role === 'super_admin' ? '#fde8d8' : '#d6eaf8',
                                            color: user.role === 'super_admin' ? '#c0392b' : '#1a5276',
                                            padding: '3px 10px', borderRadius: '20px',
                                            fontSize: '12px', fontWeight: 'bold',
                                        }}>
                                            {user.role === 'super_admin' ? '👑 Super Admin' : '💼 Cashier'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: user.isActive ? '#d4edda' : '#f8d7da',
                                            color: user.isActive ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                                        }}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#95a5a6', fontSize: '13px' }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button onClick={() => openEdit(user)} style={{
                                            background: '#3498db', color: 'white',
                                            padding: '6px 14px', border: 'none',
                                            borderRadius: '4px', cursor: 'pointer',
                                            fontSize: '13px', marginRight: '8px',
                                        }}>
                                            Edit
                                        </button>
                                        {user._id !== session?.user?.id && (
                                            <button onClick={() => handleDelete(user)} style={{
                                                background: '#e74c3c', color: 'white',
                                                padding: '6px 14px', border: 'none',
                                                borderRadius: '4px', cursor: 'pointer',
                                                fontSize: '13px',
                                            }}>
                                                Delete
                                            </button>
                                        )}
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
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, padding: '20px',
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px',
                        padding: '32px', width: '100%', maxWidth: '480px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 24px 0' }}>
                            {editItem ? '✏️ Edit User' : '➕ New User'}
                        </h2>

                        {/* Self edit warning */}
                        {editItem && editItem._id === session?.user?.id && (
                            <div style={{
                                background: '#fff3cd', border: '1px solid #ffc107',
                                padding: '10px 14px', borderRadius: '6px',
                                marginBottom: '16px', fontSize: '13px', color: '#856404',
                            }}>
                                ⚠️ This is your own account — role cannot be changed.
                            </div>
                        )}

                        {error && (
                            <div style={{
                                background: '#f8d7da', color: '#721c24',
                                padding: '10px 14px', borderRadius: '6px',
                                marginBottom: '16px', fontSize: '14px',
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Ahmad Ali"
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '2px solid #e0e0e0', borderRadius: '6px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                                Email *
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="e.g. ahmad@bar.com"
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '2px solid #e0e0e0', borderRadius: '6px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Role */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                                Role *
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                disabled={editItem && editItem._id === session?.user?.id}
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '2px solid #e0e0e0', borderRadius: '6px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                    background: editItem && editItem._id === session?.user?.id ? '#f4f4f4' : 'white',
                                    cursor: editItem && editItem._id === session?.user?.id ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <option value="cashier">💼 Cashier</option>
                                <option value="super_admin">👑 Super Admin</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                                {editItem ? 'New Password' : 'Password *'}
                                {editItem && (
                                    <span style={{ fontWeight: 'normal', color: '#95a5a6', marginLeft: '6px' }}>
                                        (leave empty to keep current)
                                    </span>
                                )}
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '2px solid #e0e0e0', borderRadius: '6px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                                Confirm Password {!editItem && '*'}
                            </label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                placeholder="Re-enter password"
                                style={{
                                    width: '100%', padding: '10px 14px',
                                    border: '2px solid #e0e0e0', borderRadius: '6px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Active */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                disabled={editItem && editItem._id === session?.user?.id}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#555', cursor: 'pointer' }}>
                                Active (Can login)
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleSave} disabled={saving} style={{
                                flex: 1, padding: '11px',
                                background: saving ? '#95a5a6' : '#1a6b3c',
                                color: 'white', border: 'none',
                                borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: '15px', fontWeight: 'bold',
                            }}>
                                {saving ? 'Saving...' : (editItem ? 'Update' : 'Save')}
                            </button>
                            <button onClick={() => setShowModal(false)} style={{
                                flex: 1, padding: '11px',
                                background: '#f0f0f0', color: '#555',
                                border: 'none', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '15px',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}