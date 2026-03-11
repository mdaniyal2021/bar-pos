'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
            router.push('/pos');
        }
    }, [status, session]);

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f4f6f8',
            }}>
                <div style={{ fontSize: '18px', color: '#95a5a6' }}>Loading...</div>
            </div>
        );
    }

    if (!session) return null;

    const navLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/admin/categories', label: 'Categories', icon: '📂' },
        { href: '/admin/products', label: 'Products', icon: '🍾' },
        { href: '/admin/orders', label: 'Order History', icon: '🧾' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Sidebar */}
            <div style={{
                width: '240px',
                background: '#2c3e50',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                top: 0, left: 0,
                zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{
                    padding: '24px 20px',
                    background: '#1a252f',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #3d5166',
                }}>
                    🍺 <span style={{ color: '#f39c12' }}>BAR</span> POS
                </div>

                {/* User Info */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #3d5166',
                }}>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        {session.user.name}
                    </div>
                    <div style={{ color: '#bdc3c7', fontSize: '12px', marginTop: '2px' }}>
                        Super Admin
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, padding: '16px 0' }}>
                    <div style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: '#7f8c8d',
                        padding: '8px 20px',
                        letterSpacing: '1px',
                    }}>
                        Main
                    </div>

                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '11px 20px',
                                color: pathname === link.href ? 'white' : '#bdc3c7',
                                textDecoration: 'none',
                                fontSize: '14px',
                                background: pathname === link.href ? '#3d5166' : 'transparent',
                                borderLeft: pathname === link.href ? '3px solid #f39c12' : '3px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}

                    {/* Divider */}
                    <div style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: '#7f8c8d',
                        padding: '16px 20px 8px',
                        letterSpacing: '1px',
                    }}>
                        POS
                    </div>

                    <Link href="/pos" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '11px 20px',
                        color: '#bdc3c7',
                        textDecoration: 'none',
                        fontSize: '14px',
                    }}>
                        <span>🖥️</span> Go to POS
                    </Link>
                </nav>

                {/* Logout */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #3d5166' }}>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: '240px', flex: 1, background: '#f4f6f8' }}>
                {children}
            </div>
        </div>
    );
}