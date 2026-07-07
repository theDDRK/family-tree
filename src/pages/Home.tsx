import React, { useState } from 'react';

function Home({ filename, persons, handleFileChange }: { filename: string | null, persons: any, handleFileChange: (filename: string, buffer: ArrayBuffer) => void }) {
    const [dragActive, setDragActive] = useState(false);

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result as ArrayBuffer;
            handleFileChange(file.name, buffer);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const isUploaded = !!(filename && persons && persons.persons.length > 0);

    return (
        <div className="page-container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            {/* Hero Section */}
            <div style={{ marginTop: '40px', marginBottom: '50px' }}>
                <h1 style={{ 
                    fontSize: '44px', 
                    fontWeight: 800, 
                    lineHeight: '1.2', 
                    letterSpacing: '-1.5px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px'
                }}>
                    Ontdek je familiegeschiedenis
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                    Visualiseer, verken en analyseer je genealogie direct. Upload een GEDCOM-bestand om aan de slag te gaan.
                </p>
            </div>

            <div className={isUploaded ? "responsive-grid-half" : ""} style={{ display: isUploaded ? 'grid' : 'block', gap: '30px', alignItems: 'stretch' }}>
                {/* Upload Card */}
                <div className="card" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: '40px 30px',
                    border: dragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: dragActive ? 'rgba(79, 70, 229, 0.02)' : 'var(--card-bg)',
                    borderRadius: '24px',
                    transition: 'all 0.2s ease',
                    minHeight: '260px'
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                >
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        backgroundColor: 'rgba(79, 70, 229, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary-color)',
                        fontSize: '32px',
                        marginBottom: '20px'
                    }}>
                        ↑
                    </div>
                    
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: '700', fontSize: '18px' }}>
                        Sleep je bestand hierheen
                    </h3>
                    <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        of klik om te bladeren door je bestanden (.ged)
                    </p>

                    <label style={{
                        padding: '10px 24px',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Bestand selecteren
                        <input type="file" accept=".ged" onChange={handleFileInput} style={{ display: 'none' }} />
                    </label>
                </div>

                {/* Info Card (only shown when uploaded) */}
                {isUploaded && (
                    <div className="card" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        textAlign: 'left',
                        padding: '40px 30px',
                        borderRadius: '24px'
                    }}>
                        <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '700', 
                            color: '#10b981', 
                            backgroundColor: '#ecfdf5', 
                            padding: '4px 10px', 
                            borderRadius: '12px',
                            alignSelf: 'flex-start',
                            marginBottom: '16px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Actief Bestand
                        </span>
                        
                        <h3 style={{ margin: '0 0 16px 0', fontWeight: '800', fontSize: '22px', wordBreak: 'break-all' }}>
                            {filename}
                        </h3>

                        <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Personen</span>
                                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)' }}>{persons.persons.length}</span>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Relaties</span>
                                <span style={{ fontSize: '24px', fontWeight: '800', color: '#ec4899' }}>
                                    {persons.persons.reduce((acc: number, p: any) => acc + (p.partners?.length || 0), 0) / 2}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;