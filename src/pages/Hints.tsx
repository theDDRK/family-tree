import React from 'react';
import { IPersons } from '../interfaces/IPersons';
import HintsTable from '../components/HintsTable';
import { getYearSafe } from '../utils/dateUtils';

function Hints({ persons }: { persons: IPersons }) {


    const hintsList = [
        { 
            id: "no-parents", 
            title: "Personen zonder ouders", 
            persons: persons.persons.filter(person => !person.father && !person.mother) 
        },
        { 
            id: "no-children", 
            title: "Personen zonder kinderen (volwassen)", 
            persons: persons.persons.filter(person => {
                const year = getYearSafe(person.birth.date);
                return !person.children.length && !isNaN(year) && (new Date().getFullYear() - year > 18);
            }) 
        },
        { 
            id: "no-siblings", 
            title: "Personen zonder broers of zussen", 
            persons: persons.persons.filter(person => !person.siblings.length) 
        },
        { 
            id: "no-partners", 
            title: "Personen zonder partner", 
            persons: persons.persons.filter(person => !person.partners.length) 
        },
        { 
            id: "no-birth", 
            title: "Personen zonder geboortedatum", 
            persons: persons.persons.filter(person => !person.birth.date) 
        },
        { 
            id: "no-death", 
            title: "Personen zonder overlijdensdatum", 
            persons: persons.persons.filter(person => !person.death.date) 
        },
        { 
            id: "no-birth-location", 
            title: "Personen zonder geboorteplaats", 
            persons: persons.persons.filter(person => !person.birth.place) 
        },
        { 
            id: "no-death-location", 
            title: "Personen zonder overlijdensplaats", 
            persons: persons.persons.filter(person => !person.death.place) 
        },
        { 
            id: "wrong-family-name", 
            title: "Personen met een andere achternaam dan hun vader", 
            persons: persons.persons.filter(person => person.father && person.lastName !== person.father.lastName) 
        },
        { 
            id: "younger-mother", 
            title: "Personen met een moeder die jonger is", 
            persons: persons.persons.filter(person => {
                const motherYear = getYearSafe(person.mother?.birth.date);
                const childYear = getYearSafe(person.birth.date);
                return !isNaN(motherYear) && !isNaN(childYear) && motherYear > childYear;
            }) 
        },
        { 
            id: "younger-father", 
            title: "Personen met een vader die jonger is", 
            persons: persons.persons.filter(person => {
                const fatherYear = getYearSafe(person.father?.birth.date);
                const childYear = getYearSafe(person.birth.date);
                return !isNaN(fatherYear) && !isNaN(childYear) && fatherYear > childYear;
            }) 
        },
        { 
            id: "older-children", 
            title: "Personen met kind die ouder is", 
            persons: persons.persons.filter(person => {
                const parentYear = getYearSafe(person.birth.date);
                return !isNaN(parentYear) && person.children.some(child => {
                    const childYear = getYearSafe(child.birth.date);
                    return !isNaN(childYear) && childYear < parentYear;
                });
            }) 
        },
        { 
            id: "incorrect-characters", 
            title: "Personen met incorrecte karakters in hun naam", 
            persons: persons.persons.filter(person => /[^a-zA-Z\s-öäüëéèßóíúáöüäïçæøåńśźżřšž??.]/.test(person.firstName || '') || /[^a-zA-Z\s-öäüëéèßóíúáöüäïçæøåńśźżřšž??']/.test(person.lastName || '')) 
        },
        { 
            id: "moved-location", 
            title: "Personen die op verschillende locaties zijn geboren en overleden", 
            persons: persons.persons.filter(person => person.birth.place && person.death.place && person.birth.place !== person.death.place) 
        },
        { 
            id: "incorrect-location", 
            title: "Personen waarvan een locatie niet de juiste syntax heeft", 
            persons: persons.persons.filter(person => (person.birth.place && (person.birth.place.match(/,/g) || []).length !== 4) || (person.death.place && (person.death.place.match(/,/g) || []).length !== 4)) 
        }
    ];

    return (
        <div className="page-container">
            <h1 className="page-title">Hints & Analyse</h1>
            <p className="page-subtitle">Automatische analyse van mogelijke fouten, inconsistenties of missende details in je stamboom.</p>

            {persons.persons.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Er zijn geen personen om hints voor te genereren. Upload eerst een bestand.
                </div>
            ) : (
                <>
                    {/* Category Links Card */}
                    <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontWeight: '800' }}>Kort Overzicht</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                            {hintsList.map(hint => (
                                <a 
                                    key={hint.id} 
                                    href={`#${hint.id}`} 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: 'var(--text-primary)', 
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                        e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.02)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                                        {hint.title}
                                    </span>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        fontWeight: '700', 
                                        backgroundColor: hint.persons.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                                        color: hint.persons.length > 0 ? '#ef4444' : '#10b981',
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        {hint.persons.length}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Tables */}
                    <div>
                        {hintsList.map(hint => (
                            <HintsTable key={hint.id} id={hint.id} title={hint.title} persons={hint.persons} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Hints;