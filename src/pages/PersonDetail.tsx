import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { IPerson, IPersons } from '../interfaces/IPersons';

function PersonDetail({ persons }: { persons: IPersons }) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const person = persons.persons.find(p => p.pointer === id) as IPerson;

    const goBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/personen');
        }
    };

    const getYearSafe = (dateStr: string | null | undefined): number => {
        if (!dateStr) return NaN;
        const match = dateStr.match(/\d{4}/);
        return match ? parseInt(match[0], 10) : NaN;
    };

    const birthYear = person ? (getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date)) : NaN;

    // Compute Life Events Timeline
    const timelineEvents = useMemo(() => {
        if (!person) return [];
        const events: { year: number; dateStr: string; title: string; desc: string; icon: string }[] = [];

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

        return events.sort((a, b) => a.year - b.year);
    }, [person, birthYear]);

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
                    backgroundColor: 'white',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                ← Terug
            </button>

            {/* Header Profile Section */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '30px', flexWrap: 'wrap', padding: '30px' }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: person.sex === 'M' ? '#dbeafe' : person.sex === 'F' ? '#fce7f3' : '#f1f5f9',
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
                            backgroundColor: person.sex === 'M' ? 'rgba(59, 130, 246, 0.08)' : person.sex === 'F' ? 'rgba(236, 72, 153, 0.08)' : '#f1f5f9', 
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
                                backgroundColor: '#f1f5f9', 
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase'
                            }}>
                                💼 {person.occupation}
                            </span>
                        )}
                    </div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '800' }}>
                        {person.firstName || '?'} {person.lastName || '?'}
                    </h1>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        ID: {person.pointer}
                    </span>
                </div>
                
                <Link to={`/stamboom?id=${person.pointer}`} style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'white',
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
                                    {person.birth?.date || '-'} {person.birth?.place ? `(${person.birth.place})` : ''}
                                </span>
                            </div>
                            {person.christening?.date && (
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Doop</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {person.christening.date} {person.christening.place ? `(${person.christening.place})` : ''}
                                    </span>
                                </div>
                            )}
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Overlijden</span>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                    {person.death?.date || '-'} {person.death?.place ? `(${person.death.place})` : ''}
                                </span>
                            </div>
                            {person.burial?.date && (
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Begrafenis</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {person.burial.date} {person.burial.place ? `(${person.burial.place})` : ''}
                                    </span>
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
                    <h3 style={{ margin: '0 0 20px 0', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '16px' }}>
                        Levenslijn
                    </h3>
                    
                    {timelineEvents.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)', margin: '10px 0 10px 5px' }}>
                            {timelineEvents.map((event, idx) => (
                                <div key={idx} style={{ marginBottom: '25px', position: 'relative' }}>
                                    {/* Timeline dot */}
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: '-31px', 
                                        top: '2px', 
                                        width: '20px', 
                                        height: '20px', 
                                        borderRadius: '50%', 
                                        backgroundColor: 'white', 
                                        border: '2px solid var(--primary-color)',
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
                                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--primary-color)' }}>
                                                {!isNaN(event.year) && event.year !== 9999 ? event.year : 'Datum onbekend'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                {event.dateStr}
                                            </span>
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
                                    {person.partners.map((partner, index) => (
                                        <div key={partner.pointer} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Partner {index + 1}</span>
                                                <Link to={`/personen/${partner.pointer}`} className={`label ${partner.sex}`} style={{ textDecoration: 'none', margin: '0' }}>
                                                    💍 {partner.firstName} {partner.lastName} {partner.birth?.date ? `(${partner.birth.date.slice(-4)})` : ''}
                                                </Link>
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
                                    ))}
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