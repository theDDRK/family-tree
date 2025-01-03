import React from 'react';

const Navbar: React.FC = () => {
    const navigate = (path: string) => () => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <nav className='navbar'>
            <div className='title'>
                <p style={{color: '#87CEEB', marginBlock: '0', marginInline: '0'}}>Familie</p>
                <p style={{color: '#FFB6C1', marginBlock: '0', marginInline: '0'}}>Boom</p>
            </div>
            <div className='links'>
                <button className='link' onClick={navigate('/')}>Overzicht</button>
                <button className='link' onClick={navigate('/stamboom')}>Stamboom</button>
                <button className='link' onClick={navigate('/statistieken')}>Statistieken</button>
                <button className='link' onClick={navigate('/connecties')}>Connecties</button>
            </div>
        </nav>
    );
};

export default Navbar;