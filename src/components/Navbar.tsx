import React, { useEffect, useState, useRef } from 'react';

const Navbar: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    const rootPath = '/family-tree';

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
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <>
            <nav className='navbar'>
                <div className='title'>
                    <p style={{color: '#87CEEB', marginBlock: '0', marginInline: '0'}}>Familie</p>
                    <p style={{color: '#FFB6C1', marginBlock: '0', marginInline: '0'}}>Boom</p>
                </div>
                <div className='links'>
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
                                backgroundColor: 'white',
                                borderRadius: '14px',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                overflow: 'hidden',
                                minWidth: '160px',
                                zIndex: 1000,
                                animation: 'fadeIn 0.15s ease'
                            }}>
                                {[
                                    { label: '🗺️  Kaart', path: '/kaart' },
                                    { label: '⏳  Tijdreis', path: '/tijdreis' },
                                    { label: '🏥  Kwaliteit', path: '/kwaliteit' },
                                    { label: '🧠  Trivia', path: '/trivia' },
                                    { label: '💡  Hints', path: '/hints' },
                                ].map(item => (
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
                                            color: '#334155',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
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