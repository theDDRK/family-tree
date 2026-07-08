import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
            {/* Header Navbar Mock */}
            <nav className="navbar" style={{ position: 'static', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '70px', backgroundColor: 'var(--card-bg)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '80px', height: '24px', borderRadius: '4px', margin: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '60px', height: '18px', borderRadius: '4px', margin: 0 }} />
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '60px', height: '18px', borderRadius: '4px', margin: 0 }} />
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '60px', height: '18px', borderRadius: '4px', margin: 0 }} />
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} className="skeleton-shimmer" />
            </nav>

            {/* Content Mock */}
            <div className="page-container" style={{ maxWidth: '1000px', margin: '40px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
                {/* Hero Section Mock */}
                <div className="skeleton-card" style={{ marginBottom: '30px', padding: '40px 30px' }}>
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '40%', height: '32px', marginBottom: '20px' }} />
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '85%', height: '16px' }} />
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '60%', height: '16px', marginBottom: '30px' }} />
                    <div className="skeleton-bar skeleton-shimmer" style={{ width: '140px', height: '40px', borderRadius: '20px' }} />
                </div>

                {/* Grid Mock */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div className="skeleton-card">
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '30%', height: '20px', marginBottom: '15px' }} />
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '90%', height: '12px' }} />
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '75%', height: '12px' }} />
                    </div>
                    <div className="skeleton-card">
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '30%', height: '20px', marginBottom: '15px' }} />
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '80%', height: '12px' }} />
                        <div className="skeleton-bar skeleton-shimmer" style={{ width: '85%', height: '12px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
