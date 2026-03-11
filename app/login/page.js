'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session?.user?.role === 'super_admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/pos');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🍺</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                        BAR POS
                    </h1>
                    <p style={{ color: '#95a5a6', fontSize: '14px', marginTop: '6px' }}>
                        Sign in to continue
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#f8d7da', color: '#721c24',
                        padding: '12px 16px', borderRadius: '8px',
                        marginBottom: '20px', fontSize: '14px',
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="admin@bar.com"
                            required
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: '2px solid #e0e0e0', borderRadius: '8px',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '6px', fontSize: '14px' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Enter your password"
                            required
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: '2px solid #e0e0e0', borderRadius: '8px',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px',
                            background: loading ? '#95a5a6' : '#1a6b3c',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: '16px', fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? 'Signing in...' : '🔐 Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}