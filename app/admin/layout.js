'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// ✅ Import modern icons
import {
    FiHome,
    FiGrid,
    FiBox,
    FiFileText,
    FiUsers,
    FiMonitor,
    FiLogOut
} from 'react-icons/fi';

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

    // ✅ Updated nav with icons
    const navLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { href: '/admin/categories', label: 'Categories', icon: <FiGrid /> },
        { href: '/admin/products', label: 'Products', icon: <FiBox /> },
        { href: '/admin/orders', label: 'Order History', icon: <FiFileText /> },
        { href: '/admin/users', label: 'Users', icon: <FiUsers /> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Sidebar */}
            <div style={{
                width: '240px',
                background: '#1e293b',
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
                    padding: '16px',
                    borderBottom: '1px solid #334155',
                    textAlign: 'center'
                }}>
                    <img
                        src="/images/logo2.png"
                        alt="Logo"
                        style={{ maxWidth: '140px' }}
                    />
                </div>

                {/* User */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #334155',
                }}>
                    <div style={{ fontWeight: '600' }}>{session.user.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Super Admin</div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '10px 0' }}>

                    <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        padding: '10px 20px'
                    }}>
                        MAIN
                    </div>

                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    color: isActive ? '#fff' : '#94a3b8',
                                    background: isActive ? '#334155' : 'transparent',
                                    borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                                    textDecoration: 'none',
                                    transition: '0.2s',
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                                {link.label}
                            </Link>
                        );
                    })}

                    {/* POS */}
                    <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        padding: '15px 20px 8px'
                    }}>
                        POS
                    </div>

                    <Link href="/pos" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        color: '#94a3b8',
                        textDecoration: 'none',
                    }}>
                        <FiMonitor />
                        Go to POS
                    </Link>
                </nav>

                {/* Logout */}
                <div style={{ padding: '16px', borderTop: '1px solid #334155' }}>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <FiLogOut />
                        Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ marginLeft: '240px', flex: 1, background: '#f1f5f9' }}>
                {children}
            </div>
        </div>
    );
}