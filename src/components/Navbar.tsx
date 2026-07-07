import React, { useEffect, useState, useRef } from 'react';

const Navbar: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);
    const [moreOpen, setMoreOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    const rootPath = '/family-tree';

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const theme = localStorage.getItem('theme');
        if (theme) {
            return theme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigate = (path: string) => () => {
        setMoreOpen(false);
        setMobileMenuOpen(false);
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const navigationItems = [
        { label: '🗺️  Kaart', path: '/kaart' },
        { label: '⏳  Tijdreis', path: '/tijdreis' },
        { label: '🏥  Kwaliteit', path: '/kwaliteit' },
        { label: '🧠  Trivia', path: '/trivia' },
        { label: '💡  Hints', path: '/hints' },
    ];

    return (
        <>
            <nav className='navbar'>
                <div className='title' onClick={navigate(rootPath + '/')} style={{ cursor: 'pointer', display: 'flex' }}>
                    <p style={{color: '#87CEEB', marginBlock: '0', marginInline: '0', fontWeight: '800'}}>Familie</p>
                    <p style={{color: '#FFB6C1', marginBlock: '0', marginInline: '0', fontWeight: '800'}}>Boom</p>
                </div>
                
                {/* Desktop Menu (hidden on mobile via CSS) */}
                <div className='desktop-links'>
                    <button className='link' onClick={navigate(rootPath + '/')}>Home</button>
                    <button className='link' onClick={navigate(rootPath + '/stamboom')}>Stamboom</button>
                    <button className='link' onClick={navigate(rootPath + '/personen')}>Personen</button>
                    <button className='link' onClick={navigate(rootPath + '/statistieken')}>Statistieken</button>
                    <button className='link' onClick={navigate(rootPath + '/connecties')}>Connecties</button>

                    {/* Dropdown "Meer" menu for secondary pages */}
                    <div ref={moreRef} style={{ position: 'relative' }}>
                        <button
                            className='link'
                            onClick={() => setMoreOpen(prev => !prev)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            Meer
                            <span style={{
                                fontSize: '9px',
                                transition: 'transform 0.2s',
                                transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                display: 'inline-block'
                             }}>▼</span>
                        </button>

                        {moreOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                right: 0,
                                backgroundColor: 'var(--card-bg)',
                                borderRadius: '14px',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-xl)',
                                overflow: 'hidden',
                                minWidth: '160px',
                                zIndex: 1000,
                                animation: 'fadeIn 0.15s ease'
                            }}>
                                {navigationItems.map(item => (
                                    <button
                                        key={item.path}
                                        onClick={navigate(rootPath + item.path)}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '11px 18px',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-color)')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right actions (visible on all devices) */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Dark Mode Toggle Button (always visible) */}
                    <button 
                        onClick={toggleTheme}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '50%',
                            transition: 'background 0.2s, transform 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title={isDarkMode ? 'Lichte modus' : 'Donkere modus'}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>

                    {/* Hamburger Button (only visible on mobile) */}
                    <button 
                        className="menu-toggle"
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Menu openen"
                    >
                        ☰
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--bg-color)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '80px 24px 40px 24px',
                    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <button 
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '24px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '20px', overflowY: 'auto' }}>
                        {[
                            { label: '🏠  Home', path: '/' },
                            { label: '🌳  Stamboom', path: '/stamboom' },
                            { label: '👥  Personen', path: '/personen' },
                            { label: '📊  Statistieken', path: '/statistieken' },
                            { label: '🔗  Connecties', path: '/connecties' },
                            { label: '🗺️  Kaart', path: '/kaart' },
                            { label: '⏳  Tijdreis', path: '/tijdreis' },
                            { label: '🏥  Kwaliteit', path: '/kwaliteit' },
                            { label: '🧠  Trivia', path: '/trivia' },
                            { label: '💡  Hints', path: '/hints' },
                        ].map(item => (
                            <button
                                key={item.path}
                                onClick={navigate(rootPath + (item.path === '/' ? '' : item.path))}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    padding: '12px 24px',
                                    width: '100%',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    fontFamily: 'inherit',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {scrollY > 100 && <button
                className='scroll-to-top'
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ display: 'block', position: 'fixed', bottom: '20px', right: '20px' }}
            >
                ^
            </button>}
        </>
    );
};

export default Navbar;