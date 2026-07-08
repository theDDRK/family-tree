import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks } from '../utils/bookmarks';
import { getYearSafe } from '../utils/dateUtils';

function Home({ filename, persons, handleFileChange }: { filename: string | null, persons: any, handleFileChange: (filename: string, buffer: ArrayBuffer) => void }) {
    const [dragActive, setDragActive] = useState(false);
    const [starredPointers, setStarredPointers] = useState<string[]>([]);

    useEffect(() => {
        setStarredPointers(getBookmarks());
        const handleChanged = () => {
            setStarredPointers(getBookmarks());
        };
        window.addEventListener('bookmarks-changed', handleChanged);
        return () => window.removeEventListener('bookmarks-changed', handleChanged);
    }, []);

    const bookmarkedPersons = useMemo(() => {
        if (!persons?.persons) return [];
        return persons.persons.filter((p: any) => starredPointers.includes(p.pointer || ''));
    }, [persons, starredPointers]);

    const currentDay = useMemo(() => new Date().getDate(), []);
    const currentMonthStr = useMemo(() => {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return months[new Date().getMonth()];
    }, []);
    const currentMonthDutch = useMemo(() => {
        const monthsDutch = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
        return monthsDutch[new Date().getMonth()];
    }, []);

    const matchMonthDay = useCallback((dateStr: string | null) => {
        if (!dateStr) return false;
        const parts = dateStr.toUpperCase().split(/\s+/);
        const monthIndex = parts.indexOf(currentMonthStr);
        if (monthIndex > 0) {
            const dayPart = parts[monthIndex - 1];
            const dayNum = parseInt(dayPart, 10);
            return dayNum === currentDay;
        }
        return false;
    }, [currentDay, currentMonthStr]);

    const todayBirths = useMemo(() => {
        if (!persons?.persons) return [];
        return persons.persons.filter((p: any) => matchMonthDay(p.birth?.date));
    }, [persons, matchMonthDay]);

    const todayDeaths = useMemo(() => {
        if (!persons?.persons) return [];
        return persons.persons.filter((p: any) => matchMonthDay(p.death?.date));
    }, [persons, matchMonthDay]);

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

            {/* Bookmarks / Favorites Section */}
            {isUploaded && bookmarkedPersons.length > 0 && (
                <div className="card" style={{ marginTop: '30px', textAlign: 'left', padding: '30px', borderRadius: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Favoriete personen</span>
                        <span style={{ color: '#fbbf24' }}>★</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                        {bookmarkedPersons.map(p => {
                            const birthYear = getYearSafe(p.birth?.date) || getYearSafe(p.christening?.date);
                            const textColor = p.sex === 'M' ? 'var(--male-color)' : p.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)';
                            return (
                                <Link
                                    key={p.pointer}
                                    to={`/personen/${p.pointer}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-color)',
                                        textDecoration: 'none',
                                        backgroundColor: 'var(--card-bg)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: p.sex === 'M' ? 'rgba(59, 130, 246, 0.1)' : p.sex === 'F' ? 'rgba(236, 72, 153, 0.1)' : 'var(--border-color)',
                                        color: textColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                    }}>
                                        {p.sex === 'M' ? '♂' : p.sex === 'F' ? '♀' : '?'}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.firstName} {p.lastName}
                                        </div>
                                        {!isNaN(birthYear) && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                Geboren in {birthYear < 0 ? `${Math.abs(birthYear)} v.Chr.` : birthYear}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* On This Day Widget */}
            {isUploaded && (todayBirths.length > 0 || todayDeaths.length > 0) && (
                <div className="card" style={{ marginTop: '30px', textAlign: 'left', padding: '30px', borderRadius: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Vandaag in de geschiedenis ({currentDay} {currentMonthDutch})</span>
                        <span style={{ fontSize: '18px' }}>📅</span>
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                        {/* Births */}
                        {todayBirths.length > 0 && (
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontWeight: '700', fontSize: '15px', color: 'var(--primary-color)' }}>
                                    Jarig vandaag 🎂
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {todayBirths.map(p => {
                                        const year = getYearSafe(p.birth?.date);
                                        const yearsAgo = new Date().getFullYear() - year;
                                        return (
                                            <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                                <Link to={`/personen/${p.pointer}`} style={{ fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                >
                                                    {p.firstName || ''} {p.lastName || ''}
                                                </Link>
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {!isNaN(year) ? `${year} (${yearsAgo} jaar geleden)` : 'Datum onbekend'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Deaths */}
                        {todayDeaths.length > 0 && (
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontWeight: '700', fontSize: '15px', color: 'var(--female-color)' }}>
                                    Overleden vandaag 🕯️
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {todayDeaths.map(p => {
                                        const year = getYearSafe(p.death?.date);
                                        const yearsAgo = new Date().getFullYear() - year;
                                        return (
                                            <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                                <Link to={`/personen/${p.pointer}`} style={{ fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--female-color)'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                >
                                                    {p.firstName || ''} {p.lastName || ''}
                                                </Link>
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {!isNaN(year) ? `${year} (${yearsAgo} jaar geleden)` : 'Datum onbekend'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;