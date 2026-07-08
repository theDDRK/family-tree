import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { IPerson, IPersons } from '../interfaces/IPersons';
import { getYearSafe, formatDate } from '../utils/dateUtils';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import { showToast } from '../components/Toast';

const HISTORICAL_EVENTS: { year: number; title: string; icon: string; desc: string }[] = [
  { year: 1568, title: 'Begin Tachtigjarige Oorlog', icon: '⚔️', desc: 'Nederland begint zijn onafhankelijkheidsstrijd tegen Spanje.' },
  { year: 1648, title: 'Vrede van Münster', icon: '🕊️', desc: 'Officieel einde van de Tachtigjarige Oorlog. Onafhankelijkheid Nederland erkend.' },
  { year: 1672, title: 'Rampjaar', icon: '💀', desc: 'Invasie van Engeland, Frankrijk en Duitsland. Moord op De Witt gebroeders.' },
  { year: 1795, title: 'Bataafse Republiek', icon: '🏛️', desc: 'Nederlandse revolutie; Franse invloed introduceert burgerlijk bestuur.' },
  { year: 1813, title: 'Herstel Onafhankelijkheid', icon: '🦁', desc: 'Nederland herstelt zijn onafhankelijkheid na de Napoleontische periode.' },
  { year: 1830, title: 'Belgische Revolutie', icon: '🇧🇪', desc: 'België scheidt zich af van het Koninkrijk der Nederlanden.' },
  { year: 1848, title: 'Grondwetsherziening', icon: '📜', desc: 'Thorbecke hervormt de grondwet; Nederland wordt constitutionele monarchie.' },
  { year: 1863, title: 'Afschaffing Slavernij', icon: '✊', desc: 'Nederland schaft de slavernij af in zijn kolonies.' },
  { year: 1914, title: 'Eerste Wereldoorlog', icon: '⚔️', desc: 'Begin van WO1. Nederland blijft neutraal maar voelt economische gevolgen.' },
  { year: 1917, title: 'Algemeen Mannenstemrecht', icon: '🗳️', desc: 'Nederlandse mannen krijgen algemeen stemrecht.' },
  { year: 1918, title: 'Einde Eerste Wereldoorlog', icon: '🕊️', desc: 'WO1 eindigt. Nederland heeft neutraal standpunt weten te handhaven.' },
  { year: 1919, title: 'Vrouwenkiesrecht', icon: '♀️', desc: 'Nederlandse vrouwen krijgen het actief kiesrecht.' },
  { year: 1929, title: 'Grote Depressie', icon: '📉', desc: 'De beurskrach van Wall Street leidt tot wereldwijde economische crisis.' },
  { year: 1940, title: 'Duits Bombardement', icon: '💣', desc: 'Rotterdam wordt gebombardeerd. Nederland capituleert voor Duitsland.' },
  { year: 1944, title: 'Operatie Market Garden', icon: '✈️', desc: 'Geallieerde luchtlandingsoperatie in Arnhem. Deels mislukt.' },
  { year: 1944, title: 'Hongerwinter', icon: '❄️', desc: 'Ernstige voedseltekorten in bezet Nederland kosten duizenden levens.' },
  { year: 1945, title: 'Bevrijding', icon: '🎉', desc: 'Nederland bevrijd van de nazi-bezetting. Einde van WO2 in Europa.' },
  { year: 1953, title: 'Watersnoodramp', icon: '🌊', desc: 'Grote overstroming in Zeeland en Zuidholland, 1800+ slachtoffers.' },
  { year: 1969, title: 'Maanlanding', icon: '🚀', desc: 'Apollo 11: eerste mensen op de maan (Neil Armstrong en Buzz Aldrin).' },
  { year: 1975, title: 'Onafhankelijkheid Suriname', icon: '🌿', desc: 'Suriname wordt onafhankelijk van Nederland.' },
  { year: 1992, title: 'Verdrag van Maastricht', icon: '🇪🇺', desc: 'Grondslag van de Europese Unie ondertekend in Maastricht.' },
  { year: 2002, title: 'Invoering Euro', icon: '💶', desc: 'De gulden wordt vervangen door de euro als nationale munteenheid.' },
  { year: 2020, title: 'COVID-19 Pandemie', icon: '🦠', desc: 'Wereldwijde pandemie leidt tot ongekende maatschappelijke beperkingen.' },
];

function PersonDetail({ persons }: { persons: IPersons }) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const person = persons.persons.find(p => p.pointer === id) as IPerson;
    const [showHistoricalContext, setShowHistoricalContext] = useState(false);
    const [starred, setStarred] = useState(() => person ? isBookmarked(person.pointer || '') : false);

    useEffect(() => {
        if (person) {
            setStarred(isBookmarked(person.pointer || ''));
        }
    }, [id, person]);

    const goBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/personen');
        }
    };



    const birthYear = person ? (getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date)) : NaN;
    const deathYear = person ? (getYearSafe(person.death?.date) || getYearSafe(person.burial?.date)) : NaN;

    // Compute Life Events Timeline
    const timelineEvents = useMemo(() => {
        if (!person) return [];
        const events: { year: number; dateStr: string; title: string; desc: string; icon: string; isHistorical?: boolean }[] = [];

        // 1. Birth
        if (person.birth?.date) {
            const y = getYearSafe(person.birth.date);
            events.push({
                year: isNaN(y) ? birthYear : y,
                dateStr: person.birth.date,
                title: 'Geboorte',
                desc: person.birth.place ? `Geboren te ${person.birth.place}.` : 'Geboren.',
                icon: '👶'
            });
        }

        // 2. Christening/Baptism
        if (person.christening?.date) {
            const y = getYearSafe(person.christening.date);
            events.push({
                year: isNaN(y) ? birthYear : y,
                dateStr: person.christening.date,
                title: 'Doop / Sacrament',
                desc: person.christening.place ? `Gedoopt te ${person.christening.place}.` : 'Gedoopt.',
                icon: '⛪'
            });
        }

        // 3. Residences
        if (person.residence) {
            person.residence.forEach(res => {
                if (res.date) {
                    const y = getYearSafe(res.date);
                    events.push({
                        year: isNaN(y) ? birthYear : y,
                        dateStr: res.date,
                        title: 'Woonplaats',
                        desc: res.place ? `Woonachtig te ${res.place}.` : 'Nieuwe woonplaats geregistreerd.',
                        icon: '🏠'
                    });
                }
            });
        }

        // 4. Children Births
        if (person.children) {
            person.children.forEach(child => {
                const childBirthYear = getYearSafe(child.birth?.date);
                if (!isNaN(childBirthYear)) {
                    const parentAge = !isNaN(birthYear) ? childBirthYear - birthYear : null;
                    const relation = child.sex === 'M' ? 'zoon' : child.sex === 'F' ? 'dochter' : 'kind';
                    events.push({
                        year: childBirthYear,
                        dateStr: child.birth?.date || '',
                        title: `Geboorte van ${relation}`,
                        desc: `${child.firstName || '?'} ${child.lastName || ''}${parentAge ? ` (ouder was ${parentAge} jaar oud)` : ''}.`,
                        icon: '🍼'
                    });
                }
            });
        }

        // 5. Father's Death
        if (person.father) {
            const fatherDeathYear = getYearSafe(person.father.death?.date);
            if (!isNaN(fatherDeathYear) && fatherDeathYear >= birthYear) {
                const age = !isNaN(birthYear) ? fatherDeathYear - birthYear : null;
                events.push({
                    year: fatherDeathYear,
                    dateStr: person.father.death?.date || '',
                    title: 'Overlijden van vader',
                    desc: `${person.father.firstName} ${person.father.lastName}${age ? ` (persoon was ${age} jaar oud)` : ''}.`,
                    icon: '🖤'
                });
            }
        }

        // 6. Mother's Death
        if (person.mother) {
            const motherDeathYear = getYearSafe(person.mother.death?.date);
            if (!isNaN(motherDeathYear) && motherDeathYear >= birthYear) {
                const age = !isNaN(birthYear) ? motherDeathYear - birthYear : null;
                events.push({
                    year: motherDeathYear,
                    dateStr: person.mother.death?.date || '',
                    title: 'Overlijden van moeder',
                    desc: `${person.mother.firstName} ${person.mother.lastName}${age ? ` (persoon was ${age} jaar oud)` : ''}.`,
                    icon: '🖤'
                });
            }
        }

        // 7. Death
        if (person.death?.date) {
            const y = getYearSafe(person.death.date);
            const ageAtDeath = !isNaN(y) && !isNaN(birthYear) ? y - birthYear : null;
            events.push({
                year: isNaN(y) ? 9999 : y,
                dateStr: person.death.date,
                title: 'Overlijden',
                desc: `${person.death.place ? `Overleden te ${person.death.place}` : 'Overleden'}${ageAtDeath ? ` op ${ageAtDeath}-jarige leeftijd` : ''}.`,
                icon: '✝️'
            });
        }

        // 8. Burial
        if (person.burial?.date) {
            const y = getYearSafe(person.burial.date);
            events.push({
                year: isNaN(y) ? 9999 : y,
                dateStr: person.burial.date,
                title: 'Begrafenis',
                desc: person.burial.place ? `Begraven te ${person.burial.place}.` : 'Begraven.',
                icon: '🪦'
            });
        }

        // Add historical events within the person's lifespan
        if (showHistoricalContext && !isNaN(birthYear)) {
            const endYear = !isNaN(deathYear) ? deathYear : new Date().getFullYear();
            HISTORICAL_EVENTS.forEach(hist => {
                if (hist.year >= birthYear && hist.year <= endYear) {
                    events.push({
                        year: hist.year,
                        dateStr: String(hist.year),
                        title: hist.title,
                        desc: hist.desc,
                        icon: hist.icon,
                        isHistorical: true,
                    });
                }
            });
        }

        return events.sort((a, b) => a.year - b.year);
    }, [person, birthYear, deathYear, showHistoricalContext]);

    if (!person) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
                <h2 style={{ color: 'var(--text-secondary)' }}>Persoon niet gevonden</h2>
                <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Terug naar Home</Link>
            </div>
        );
    }

    const genderLabel = person.sex === 'M' ? 'Man' : person.sex === 'F' ? 'Vrouw' : 'Onbekend';
    const textColor = person.sex === 'M' ? 'var(--male-color)' : person.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)';

    return (
        <div className="page-container" style={{ maxWidth: '1200px' }}>
            {/* Back Button */}
            <button
                onClick={goBack}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    marginBottom: '20px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                ← Terug
            </button>

            {/* Header Profile Section */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '30px', flexWrap: 'wrap', padding: '30px' }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: person.sex === 'M' ? '#dbeafe' : person.sex === 'F' ? '#fce7f3' : 'var(--border-color)',
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: '800'
                }}>
                    {person.sex === 'M' ? '♂' : person.sex === 'F' ? '♀' : '?'}
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            backgroundColor: person.sex === 'M' ? 'rgba(59, 130, 246, 0.08)' : person.sex === 'F' ? 'rgba(236, 72, 153, 0.08)' : 'var(--border-color)', 
                            color: textColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {genderLabel}
                        </span>
                        {person.occupation && (
                            <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                backgroundColor: 'var(--border-color)', 
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase'
                            }}>
                                💼 {person.occupation}
                            </span>
                        )}
                    </div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {person.firstName || '?'} {person.lastName || '?'}
                        <button
                            onClick={() => {
                                toggleBookmark(person.pointer || '');
                                setStarred(prev => !prev);
                            }}
                            style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '24px',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s',
                                color: starred ? '#fbbf24' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title={starred ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
                        >
                            {starred ? '★' : '☆'}
                        </button>
                    </h1>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        ID: {person.pointer}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('Link gekopieerd naar klembord!', 'success');
                        }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s',
                            fontFamily: 'inherit'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
                    >
                        🔗 Kopieer Link
                    </button>
                    <Link to={`/stamboom?id=${person.pointer}`} style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        fontSize: '13px',
                        textDecoration: 'none',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s'
                    }}>
                        Bekijk in Stamboom
                    </Link>
                </div>
            </div>

            {/* Three-Column Modern Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', alignItems: 'start' }}>
                {/* Column 1: Personal Data & Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Details Card */}
                    <div className="card" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '16px' }}>
                            Persoonsgegevens
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Voornaam</span>
                                <span style={{ fontSize: '15px', fontWeight: '600' }}>{person.firstName || '-'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Achternaam</span>
                                <span style={{ fontSize: '15px', fontWeight: '600' }}>{person.lastName || '-'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Beroep</span>
                                <span style={{ fontSize: '15px', fontWeight: '600' }}>{person.occupation || 'Niet gespecificeerd'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Geboorte</span>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                    {formatDate(person.birth?.date) || '-'} {person.birth?.place ? `(${person.birth.place})` : ''}
                                </span>
                                {person.birth?.sources && person.birth.sources.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#6366f1', fontStyle: 'italic', marginTop: '2px' }}>
                                        📚 Bron: {person.birth.sources.join(', ')}
                                    </div>
                                )}
                            </div>
                            {person.christening?.date && (
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Doop</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {formatDate(person.christening.date)} {person.christening.place ? `(${person.christening.place})` : ''}
                                    </span>
                                    {person.christening?.sources && person.christening.sources.length > 0 && (
                                        <div style={{ fontSize: '11px', color: '#6366f1', fontStyle: 'italic', marginTop: '2px' }}>
                                            📚 Bron: {person.christening.sources.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Overlijden</span>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                    {formatDate(person.death?.date) || '-'} {person.death?.place ? `(${person.death.place})` : ''}
                                </span>
                                {person.death?.sources && person.death.sources.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#6366f1', fontStyle: 'italic', marginTop: '2px' }}>
                                        📚 Bron: {person.death.sources.join(', ')}
                                    </div>
                                )}
                            </div>
                            {person.burial?.date && (
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Begrafenis</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {formatDate(person.burial.date)} {person.burial.place ? `(${person.burial.place})` : ''}
                                    </span>
                                    {person.burial?.sources && person.burial.sources.length > 0 && (
                                        <div style={{ fontSize: '11px', color: '#6366f1', fontStyle: 'italic', marginTop: '2px' }}>
                                            📚 Bron: {person.burial.sources.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Card */}
                    {person.note && (
                        <div className="card" style={{ padding: '30px', backgroundColor: 'rgba(79, 70, 229, 0.02)', borderColor: 'rgba(79, 70, 229, 0.1)' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontWeight: '800', fontSize: '16px', color: 'var(--primary-color)' }}>
                                Biografie & Documentatie
                            </h3>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: 'var(--text-secondary)', 
                                lineHeight: '1.6', 
                                fontStyle: 'italic',
                                whiteSpace: 'pre-line' 
                            }}>
                                "{person.note}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Column 2: Life Timeline */}
                <div className="card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '16px' }}>
                            Levenslijn
                        </h3>
                        <button
                            onClick={() => setShowHistoricalContext(prev => !prev)}
                            title={showHistoricalContext ? 'Historische context verbergen' : 'Historische context tonen'}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                border: `1px solid ${showHistoricalContext ? '#f59e0b' : 'var(--border-color)'}`,
                                backgroundColor: showHistoricalContext ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                color: showHistoricalContext ? '#b45309' : 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                        >
                            🏛️ {showHistoricalContext ? 'Context aan' : 'Context uit'}
                        </button>
                    </div>
                    
                    {timelineEvents.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)', margin: '10px 0 10px 5px' }}>
                            {timelineEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: '25px',
                                        position: 'relative',
                                        ...(event.isHistorical ? {
                                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                            borderRadius: '8px',
                                            padding: '8px 10px 8px 10px',
                                            borderLeft: '3px solid #f59e0b',
                                            marginLeft: '4px',
                                        } : {})
                                    }}
                                >
                                    {/* Timeline dot */}
                                    <div style={{
                                        position: 'absolute',
                                        left: event.isHistorical ? '-35px' : '-31px',
                                        top: event.isHistorical ? '10px' : '2px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: event.isHistorical ? 'rgba(245, 158, 11, 0.12)' : 'var(--card-bg)',
                                        border: event.isHistorical ? '2px solid #f59e0b' : '2px solid var(--primary-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {event.icon}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                                            <span style={{ fontWeight: '800', fontSize: '14px', color: event.isHistorical ? '#b45309' : 'var(--primary-color)' }}>
                                                {!isNaN(event.year) && event.year !== 9999 ? event.year : 'Datum onbekend'}
                                            </span>
                                            {!event.isHistorical && (
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                    {event.dateStr}
                                                </span>
                                            )}
                                            {event.isHistorical && (
                                                <span style={{ fontSize: '10px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', opacity: 0.8 }}>
                                                    Historisch
                                                </span>
                                            )}
                                        </div>
                                        <h4 style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                                            {event.title}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                            {event.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                            Geen levensgebeurtenissen geregistreerd.
                        </p>
                    )}
                </div>

                {/* Column 3: Close Family Circle Navigation */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '16px' }}>
                        Familiekring
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Parents */}
                        <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Ouders</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {person.father ? (
                                    <Link to={`/personen/${person.father.pointer}`} className={`label ${person.father.sex}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                                        👨 {person.father.firstName} {person.father.lastName} {person.father.birth?.date ? `(${person.father.birth.date.slice(-4)})` : ''}
                                    </Link>
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '6px' }}>Vader onbekend</span>
                                )}
                                {person.mother ? (
                                    <Link to={`/personen/${person.mother.pointer}`} className={`label ${person.mother.sex}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                                        👩 {person.mother.firstName} {person.mother.lastName} {person.mother.birth?.date ? `(${person.mother.birth.date.slice(-4)})` : ''}
                                    </Link>
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '6px' }}>Moeder onbekend</span>
                                )}
                            </div>
                        </div>

                        {/* Siblings */}
                        <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Broers en Zussen</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {person.siblings && person.siblings.length > 0 ? (
                                    person.siblings.map(sibling => (
                                        <Link to={`/personen/${sibling.pointer}`} className={`label ${sibling.sex}`} key={sibling.pointer} style={{ textDecoration: 'none' }}>
                                            {sibling.firstName} {sibling.lastName} {sibling.birth?.date ? `(${sibling.birth.date.slice(-4)})` : ''}
                                        </Link>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '6px' }}>Geen broers of zussen</span>
                                )}
                            </div>
                        </div>

                        {/* Partners and Children */}
                        {person.partners && person.partners.length > 0 && (
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Partners & Kinderen</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {person.partners.map((partner, index) => {
                                        const marriageInfo = person.marriages?.find(m => m.partnerPointer === partner.pointer);
                                        return (
                                            <div key={partner.pointer} style={{ backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Partner {index + 1}</span>
                                                    <Link to={`/personen/${partner.pointer}`} className={`label ${partner.sex}`} style={{ textDecoration: 'none', margin: '0', display: 'inline-block' }}>
                                                        💍 {partner.firstName} {partner.lastName} {partner.birth?.date ? `(${partner.birth.date.slice(-4)})` : ''}
                                                    </Link>
                                                    {marriageInfo && (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '4px', lineHeight: '1.4' }}>
                                                            {marriageInfo.marriage && (
                                                                <div>
                                                                    <strong>Huwelijk:</strong> {formatDate(marriageInfo.marriage.date)} {marriageInfo.marriage.place ? `te ${marriageInfo.marriage.place}` : ''}
                                                                    {marriageInfo.marriage.sources && marriageInfo.marriage.sources.length > 0 && (
                                                                        <span style={{ fontSize: '10px', color: '#6366f1', fontStyle: 'italic', marginLeft: '6px' }}>
                                                                            (Bron: {marriageInfo.marriage.sources.join(', ')})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {marriageInfo.divorce && (
                                                                <div>
                                                                    <strong>Scheiding:</strong> {formatDate(marriageInfo.divorce.date)} {marriageInfo.divorce.place ? `te ${marriageInfo.divorce.place}` : ''}
                                                                    {marriageInfo.divorce.sources && marriageInfo.divorce.sources.length > 0 && (
                                                                        <span style={{ fontSize: '10px', color: '#6366f1', fontStyle: 'italic', marginLeft: '6px' }}>
                                                                            (Bron: {marriageInfo.divorce.sources.join(', ')})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', paddingLeft: '4px' }}>Kinderen</span>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {partner.children && partner.children.length > 0 ? (
                                                            partner.children.map(child => (
                                                                <Link to={`/personen/${child.pointer}`} className={`label ${child.sex}`} key={child.pointer} style={{ textDecoration: 'none' }}>
                                                                    👶 {child.firstName} {child.birth?.date ? `(${child.birth.date.slice(-4)})` : ''}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>Geen kinderen</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PersonDetail;