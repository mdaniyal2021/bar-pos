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
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            if (session?.user?.role === 'super_admin') router.replace('/admin/dashboard');
            else router.replace('/pos');
        }
    }, [status, session]);

    if (status === 'loading' || status === 'authenticated') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: '800', letterSpacing: '6px', color: '#ff4d00', textTransform: 'uppercase' }}>
                    BAR POS
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please enter email and password'); return; }
        setLoading(true); setError('');
        const result = await signIn('credentials', { email: email.toLowerCase(), password, redirect: false });
        if (result?.error) { setError('Invalid email or password'); setLoading(false); }
        else {
            const res = await fetch('/api/auth/session');
            const sess = await res.json();
            if (sess?.user?.role === 'super_admin') router.replace('/admin/dashboard');
            else router.replace('/pos');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Barlow', sans-serif", background: '#080808', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #111 inset !important; -webkit-text-fill-color: white !important; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes flicker { 0%,100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.7; } 94% { opacity: 1; } 96% { opacity: 0.8; } 97% { opacity: 1; } }
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
            `}</style>

            {/* LEFT PANEL — Branding */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', overflow: 'hidden', minHeight: '100vh' }}>

                {/* Background image overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #111 40%, #0d0d0d 100%)' }}></div>

                {/* Grid pattern */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,77,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,0,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

                {/* Glow circles */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,0,0.08) 0%, transparent 70%)' }}></div>
                <div style={{ position: 'absolute', bottom: '-150px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,120,0,0.06) 0%, transparent 70%)' }}></div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s ease forwards' }}>
                    {/* Logo */}
                    <div style={{ marginBottom: '8px' }}>
                        <img src="/images/logo2.png" alt="Bar POS"
                            style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain' }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div style={{ display: 'none', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #ff4d00, #ff7a00)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(255,77,0,0.4)' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
                            </div>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '4px', textTransform: 'uppercase', animation: 'flicker 8s infinite' }}>
                                Bar <span style={{ color: '#ff4d00' }}>POS</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center — Big Headline */}
                <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s ease 0.2s both' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: '20px', padding: '5px 14px', marginBottom: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff4d00' }}></div>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ff4d00', animation: 'pulse-ring 1.5s ease-out infinite' }}></div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#ff6a35', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Point of Sale System</span>
                        </div>

                        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '72px', fontWeight: '900', color: 'white', lineHeight: 0.95, letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: '20px' }}>
                            Welcome<br />
                            <span style={{ color: '#ff4d00', WebkitTextStroke: '0px', textShadow: '0 0 40px rgba(255,77,0,0.4)' }}>Back.</span>
                        </h1>

                        <p style={{ fontSize: '15px', color: '#3a3a3a', fontWeight: '500', lineHeight: 1.6, maxWidth: '340px' }}>
                            Your complete bar management solution. Fast, reliable, and works offline too.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Fast Billing', 'Stock Tracking', 'Offline Mode', 'Reports'].map((f, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#3a3a3a', letterSpacing: '0.5px' }}>
                                {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', color: '#2a2a2a', fontWeight: '500' }}>
                    © {new Date().getFullYear()} Bar POS · All rights reserved
                </div>
            </div>

            {/* RIGHT PANEL — Login Form */}
            <div style={{ width: '460px', background: '#0d0d0d', borderLeft: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 44px', position: 'relative', flexShrink: 0 }}>

                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #ff4d00, transparent)' }}></div>

                <div style={{ width: '100%', animation: 'fadeUp 0.8s ease 0.3s both' }}>

                    {/* Form Header */}
                    <div style={{ marginBottom: '36px' }}>
                        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #ff4d00, #ff7a00)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 24px rgba(255,77,0,0.3)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', fontWeight: '900', color: 'white', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Sign In</h2>
                        <p style={{ fontSize: '13px', color: '#3a3a3a', fontWeight: '500' }}>Enter your credentials to access the system</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#333' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                </div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@bar.com" autoComplete="email"
                                    style={{ width: '100%', padding: '13px 16px 13px 42px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                                    onFocus={e => { e.target.style.borderColor = '#ff4d00'; e.target.style.background = '#141414'; }}
                                    onBlur={e => { e.target.style.borderColor = '#1e1e1e'; e.target.style.background = '#111'; }} />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#333' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                                </div>
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" autoComplete="current-password"
                                    style={{ width: '100%', padding: '13px 44px 13px 42px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                                    onFocus={e => { e.target.style.borderColor = '#ff4d00'; e.target.style.background = '#141414'; }}
                                    onBlur={e => { e.target.style.borderColor = '#1e1e1e'; e.target.style.background = '#111'; }} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#333', display: 'flex', padding: 0 }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#333'}>
                                    {showPass
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '15px', marginTop: '8px', background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #ff4d00 0%, #ff6a00 100%)', color: loading ? '#333' : 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 8px 28px rgba(255,77,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            {loading ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>
                                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17l5-5-5-5v10zm-8 5V2h2v20H2z" transform="rotate(180 12 12)"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #141414', textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#2a2a2a', fontWeight: '500' }}>
                            Authorized personnel only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}