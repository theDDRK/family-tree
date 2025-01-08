import React, { useEffect, useState } from 'react';

const Navbar: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);
    const rootPath = '/family-tree';

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigate = (path: string) => () => {
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
                    <button className='link' onClick={navigate(rootPath + '/hints')}>Hints</button>
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