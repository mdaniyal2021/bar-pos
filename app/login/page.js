'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Already logged in — redirect karo
    useEffect(() => {
        if (status === 'authenticated') {
            if (session?.user?.role === 'super_admin') {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/pos');
            }
        }
    }, [status, session]);

    // Loading state
    if (status === 'loading' || status === 'authenticated') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: '#0d0d0d',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '4px', color: '#ff4d00', textTransform: 'uppercase' }}>
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please enter email and password'); return; }

        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            email: email.toLowerCase(),
            password,
            redirect: false,
        });

        if (result?.error) {
            setError('Invalid email or password');
            setLoading(false);
        } else {
            // Session update hone ka wait karo phir redirect
            const res = await fetch('/api/auth/session');
            const sess = await res.json();
            if (sess?.user?.role === 'super_admin') {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/pos');
            }
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#0d0d0d', fontFamily: "'Barlow', sans-serif",
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800&display=swap');`}</style>

            <div style={{
                width: '100%', maxWidth: '400px',
                padding: '20px',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <img
                        src="/images/logo2.png"
                        alt="Bar POS"
                        style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <div style={{ display: 'none' }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px', fontWeight: '800', color: 'white', letterSpacing: '4px', textTransform: 'uppercase' }}>
                            Bar <span style={{ color: '#ff4d00' }}>POS</span>
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div style={{
                    background: '#141414', border: '1px solid #222',
                    borderRadius: '16px', padding: '36px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: '800', color: 'white', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Sign In
                        </div>
                        <div style={{ fontSize: '13px', color: '#444', marginTop: '4px', fontWeight: '500' }}>
                            Enter your credentials to continue
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#1a0800', border: '1px solid #ff4d0044',
                            color: '#ff6b35', padding: '10px 14px',
                            borderRadius: '8px', marginBottom: '20px',
                            fontSize: '13px', fontWeight: '600',
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@bar.com"
                                autoComplete="email"
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                                    borderRadius: '8px', color: 'white',
                                    fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'inherit',
                                }}
                                onFocus={e => e.target.style.borderColor = '#ff4d00'}
                                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                            />
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                                    borderRadius: '8px', color: 'white',
                                    fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'inherit',
                                }}
                                onFocus={e => e.target.style.borderColor = '#ff4d00'}
                                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px',
                                background: loading ? '#1a1a1a' : '#ff4d00',
                                color: loading ? '#333' : 'white',
                                border: 'none', borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontSize: '18px', fontWeight: '800',
                                letterSpacing: '2px', textTransform: 'uppercase',
                                transition: 'all 0.15s',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,77,0,0.3)',
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}