import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmptyState: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '120px auto 60px' }}>
            <div className="card" style={{ 
                padding: '50px 30px', 
                borderRadius: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center' 
            }}>
                <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(79, 70, 229, 0.08)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary-color)',
                    fontSize: '36px',
                    marginBottom: '24px'
                }}>
                    🌳
                </div>
                
                <h2 style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '24px' }}>
                    Geen stamboom geladen
                </h2>
                <p style={{ margin: '0 0 30px 0', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                    Je hebt nog geen familiegegevens geladen. Upload eerst een GEDCOM-bestand (.ged) op de startpagina om deze weergave te ontgrendelen.
                </p>

                <button 
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 28px',
                        borderRadius: '24px',
                        background: 'var(--primary-gradient)',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                        border: 'none',
                        transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Ga naar Homepagina
                </button>
            </div>
        </div>
    );
};

export default EmptyState;
