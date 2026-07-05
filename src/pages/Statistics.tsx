import React, { useState } from 'react';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { IPersons } from '../interfaces/IPersons';
import { Link } from 'react-router-dom';
import BirthsPerYear from '../components/BirthsPerYear';

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const getYearSafe = (dateStr: string | null | undefined): number => {
    if (!dateStr) return NaN;
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : NaN;
};

function getBirthdateMonths(persons: IPersons) {
    const amountPerMonth = months.map(month => {
        return { maand: month, aantal: 0 };
    });

    persons.persons.forEach(person => {
        if (!person.birth?.date) return;
        months.forEach((month, index) => {
            if (person.birth.date.includes(month)) {
                amountPerMonth[index].aantal++;
            }
        });
    });

    return amountPerMonth;
}

function getBirthdaysPerDay(persons: IPersons) {
    let amountPerDay: any[] = [];
    const forbidden = ['ABT', 'BEF', 'AFT', 'BET', 'EST'];

    persons.persons.forEach(person => {
        if (!person.birth?.date) return;
        if (forbidden.some(word => person.birth.date.includes(word))) return;
        if (person.birth.date.split(' ').length < 3) return;
        const day = person.birth.date.split(' ')[0];
        const month = person.birth.date.split(' ')[1];
        const existing = amountPerDay.find(item => item.dag === day && item.maand === month);
        if (existing) {
            existing.aantal++;
        } else {
            amountPerDay.push({ dag: day, maand: month, aantal: 1 });
        }
    });

    amountPerDay = amountPerDay.sort((a, b) => {
        if (a.maand === b.maand) {
            return parseInt(a.dag) - parseInt(b.dag);
        }
        return months.indexOf(a.maand) - months.indexOf(b.maand);
    });

    return amountPerDay;
}

function getDeathYears(persons: IPersons) {
    const deathCounts = persons.persons.reduce((acc, person) => {
        if (!person.death?.date) return acc;
        const year = person.death.date?.slice(-4);
        if (year && /^\d{4}$/.test(year)) {
            acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(deathCounts)
        .sort()
        .map(year => ({
            jaar: year,
            aantal: deathCounts[year],
        }));
}

function getDeathMonths(persons: IPersons) {
    const amountPerMonth = months.map(month => {
        return { maand: month, aantal: 0 };
    });

    persons.persons.forEach(person => {
        if (!person.death?.date) return;
        months.forEach((month, index) => {
            if (person.death.date.includes(month)) {
                amountPerMonth[index].aantal++;
            }
        });
    });

    return amountPerMonth;
}

// Compute Lifespan distribution ranges
function getLifespanDistribution(persons: IPersons) {
    const ranges = [
        { name: '<1 (Baby)', aantal: 0 },
        { name: '1-4 (Peuter)', aantal: 0 },
        { name: '5-9 (Kind)', aantal: 0 },
        { name: '10-19', aantal: 0 },
        { name: '20-29', aantal: 0 },
        { name: '30-39', aantal: 0 },
        { name: '40-49', aantal: 0 },
        { name: '50-59', aantal: 0 },
        { name: '60-69', aantal: 0 },
        { name: '70-79', aantal: 0 },
        { name: '80-89', aantal: 0 },
        { name: '90-99', aantal: 0 },
        { name: '100+', aantal: 0 },
    ];

    persons.persons.forEach(person => {
        const bYear = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
        const dYear = getYearSafe(person.death?.date) || getYearSafe(person.burial?.date);
        
        if (!isNaN(bYear) && !isNaN(dYear)) {
            const age = dYear - bYear;
            if (age >= 0) {
                if (age < 1) ranges[0].aantal++;
                else if (age < 5) ranges[1].aantal++;
                else if (age < 10) ranges[2].aantal++;
                else if (age < 20) ranges[3].aantal++;
                else if (age < 30) ranges[4].aantal++;
                else if (age < 40) ranges[5].aantal++;
                else if (age < 50) ranges[6].aantal++;
                else if (age < 60) ranges[7].aantal++;
                else if (age < 70) ranges[8].aantal++;
                else if (age < 80) ranges[9].aantal++;
                else if (age < 90) ranges[10].aantal++;
                else if (age < 100) ranges[11].aantal++;
                else ranges[12].aantal++;
            }
        }
    });

    return ranges;
}

// Compute year-by-year distribution within selected age bracket
function getDetailedAgeDistribution(persons: IPersons, rangeName: string) {
    let minAge = 0;
    let maxAge = 0;
    
    if (rangeName === '<1 (Baby)') { minAge = 0; maxAge = 0; }
    else if (rangeName === '1-4 (Peuter)') { minAge = 1; maxAge = 4; }
    else if (rangeName === '5-9 (Kind)') { minAge = 5; maxAge = 9; }
    else if (rangeName === '10-19') { minAge = 10; maxAge = 19; }
    else if (rangeName === '20-29') { minAge = 20; maxAge = 29; }
    else if (rangeName === '30-39') { minAge = 30; maxAge = 39; }
    else if (rangeName === '40-49') { minAge = 40; maxAge = 49; }
    else if (rangeName === '50-59') { minAge = 50; maxAge = 59; }
    else if (rangeName === '60-69') { minAge = 60; maxAge = 69; }
    else if (rangeName === '70-79') { minAge = 70; maxAge = 79; }
    else if (rangeName === '80-89') { minAge = 80; maxAge = 89; }
    else if (rangeName === '90-99') { minAge = 90; maxAge = 99; }
    else if (rangeName === '100+') { minAge = 100; maxAge = 115; }
    else return [];

    const counts: Record<number, number> = {};
    for (let age = minAge; age <= maxAge; age++) {
        counts[age] = 0;
    }

    persons.persons.forEach(person => {
        const bYear = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
        const dYear = getYearSafe(person.death?.date) || getYearSafe(person.burial?.date);
        if (!isNaN(bYear) && !isNaN(dYear)) {
            const age = dYear - bYear;
            if (age >= minAge && age <= maxAge) {
                counts[age] = (counts[age] || 0) + 1;
            }
        }
    });

    return Object.keys(counts).map(age => ({
        leeftijd: age + ' jr',
        aantal: counts[parseInt(age, 10)],
    }));
}

function getPeopleInAgeRange(persons: IPersons, rangeName: string) {
    let minAge = 0;
    let maxAge = 0;
    
    if (rangeName === '<1 (Baby)') { minAge = 0; maxAge = 0; }
    else if (rangeName === '1-4 (Peuter)') { minAge = 1; maxAge = 4; }
    else if (rangeName === '5-9 (Kind)') { minAge = 5; maxAge = 9; }
    else if (rangeName === '10-19') { minAge = 10; maxAge = 19; }
    else if (rangeName === '20-29') { minAge = 20; maxAge = 29; }
    else if (rangeName === '30-39') { minAge = 30; maxAge = 39; }
    else if (rangeName === '40-49') { minAge = 40; maxAge = 49; }
    else if (rangeName === '50-59') { minAge = 50; maxAge = 59; }
    else if (rangeName === '60-69') { minAge = 60; maxAge = 69; }
    else if (rangeName === '70-79') { minAge = 70; maxAge = 79; }
    else if (rangeName === '80-89') { minAge = 80; maxAge = 89; }
    else if (rangeName === '90-99') { minAge = 90; maxAge = 99; }
    else if (rangeName === '100+') { minAge = 100; maxAge = 115; }
    else return [];

    return persons.persons.filter(person => {
        const bYear = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
        const dYear = getYearSafe(person.death?.date) || getYearSafe(person.burial?.date);
        if (!isNaN(bYear) && !isNaN(dYear)) {
            const age = dYear - bYear;
            return age >= minAge && age <= maxAge;
        }
        return false;
    });
}

function Statistics({ persons }: { persons: IPersons }) {
    const birthdateMonths = getBirthdateMonths(persons);
    const deathYears = getDeathYears(persons);
    const deathMonths = getDeathMonths(persons);
    const lifespanDist = getLifespanDistribution(persons);
    
    const [deathSelectedYear, setDeathSelectedYear] = useState<string | null>(null);
    const [selectedBirthday, setSelectedBirthday] = useState<string | null>(null);
    const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);

    const selectedDeathYear = deathSelectedYear
        ? persons.persons.filter(person => person.death?.date?.slice(-4) === deathSelectedYear)
        : [];

    return (
        <div className="page-container" style={{ maxWidth: '1100px' }}>
            <h1 className="page-title">Statistieken</h1>
            <p className="page-subtitle">Grafische inzichten en data-analyses over geboortes, sterftes, beroepen en demografie in je stamboom.</p>

            {/* Births Per Year Graph */}
            <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                <BirthsPerYear persons={persons} />
            </div>

            {/* Lifespan Distribution Card (with drilldown) */}
            <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Levensduur Verdeling (Leeftijd bij overlijden)</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                    Klik op een balk in de grafiek om in te zoomen op de individuele jaren en personen binnen dat bereik.
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: selectedAgeRange ? '1fr 340px' : '1fr', gap: '30px', transition: 'all 0.3s' }}>
                    <div style={{ width: '100%', height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lifespanDist} onClick={(event: any) => event && setSelectedAgeRange(event.activeLabel)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.02)' }} />
                                <Bar dataKey="aantal" fill="var(--primary-color)" radius={[4, 4, 0, 0]} cursor="pointer" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {selectedAgeRange && (
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px', maxHeight: '320px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px' }}>Details: {selectedAgeRange}</h4>
                                <button 
                                    onClick={() => setSelectedAgeRange(null)}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '13px'
                                    }}
                                >
                                    ✕ Sluiten
                                </button>
                            </div>
                            
                            {/* Year-by-year mini distribution chart */}
                            <div style={{ width: '100%', height: '140px', marginBottom: '20px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getDetailedAgeDistribution(persons, selectedAgeRange)}>
                                        <XAxis dataKey="leeftijd" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="aantal" fill="var(--female-color)" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* List of people in this range */}
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                    Personen in dit bereik:
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {getPeopleInAgeRange(persons, selectedAgeRange).map(p => {
                                        const bYear = getYearSafe(p.birth?.date) || getYearSafe(p.christening?.date);
                                        const dYear = getYearSafe(p.death?.date) || getYearSafe(p.burial?.date);
                                        return (
                                            <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                                <Link to={`/personen/${p.pointer}`} style={{ fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                                                >{p.firstName || ''} {p.lastName || ''}</Link>
                                                <span style={{ color: 'var(--female-color)', fontWeight: '700' }}>
                                                    {dYear - bYear} jr
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Layout for Month Births / Verjaardagen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '35px' }}>
                {/* Birth Month */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Geboortemaanden</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                        Totaal aantal geboortes met maand: {birthdateMonths.reduce((acc, m) => acc + m.aantal, 0)}
                    </span>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={birthdateMonths}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="maand" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.02)' }} />
                                <Bar dataKey="aantal" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Death Month */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Overlijdensmaanden</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                        Totaal aantal overlijdens met maand: {deathMonths.reduce((acc, m) => acc + m.aantal, 0)}
                    </span>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deathMonths}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="maand" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(236, 72, 153, 0.02)' }} />
                                <Bar dataKey="aantal" fill="var(--female-color)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Birthdays Per Day with Listing */}
            <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Verjaardagskalender</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                    Klik op een balk in de grafiek om de personen te bekijken die op die dag jarig zijn.
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ width: '100%', height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getBirthdaysPerDay(persons)} onClick={(event: any) => event && setSelectedBirthday(event.activeLabel)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey={(item: { dag: string; maand: string }) => `${item.dag} ${item.maand}`} stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="aantal" fill="var(--primary-color)" radius={[3, 3, 0, 0]} cursor="pointer" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px', maxHeight: '320px', overflowY: 'auto' }}>
                        {selectedBirthday ? (
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '15px' }}>Jarigen op {selectedBirthday}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {persons.persons
                                        .filter(p => p.birth?.date?.startsWith(selectedBirthday))
                                        .map(p => (
                                            <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                                <Link to={`/personen/${p.pointer}`} style={{ fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                                                >{p.firstName || ''} {p.lastName || ''}</Link>
                                                <span style={{ color: 'var(--text-secondary)' }}>{p.birth?.date?.slice(-4)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                                Selecteer een verjaardag in de grafiek.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Overleden Per Jaar */}
            <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Sterfgevallen door de jaren heen</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                    Klik op de grafieklijn om de personen te tonen die in dat specifieke jaar zijn overleden.
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ width: '100%', height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={deathYears} onClick={(event: any) => event && setDeathSelectedYear(event.activeLabel)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="jaar" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="aantal" stroke="var(--female-color)" strokeWidth={2} dot={{ r: 3, fill: 'var(--female-color)' }} activeDot={{ r: 6 }} cursor="pointer" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px', maxHeight: '320px', overflowY: 'auto' }}>
                        {deathSelectedYear ? (
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '15px' }}>Overleden in {deathSelectedYear}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                     {selectedDeathYear.map(p => (
                                        <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                            <Link to={`/personen/${p.pointer}`} style={{ fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-color)')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                                            >{p.firstName || ''} {p.lastName || ''}</Link>
                                            <span style={{ color: 'var(--text-secondary)' }}>{p.death?.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                                Selecteer een jaar in de grafiek.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Demographics / Names Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '35px' }}>
                {/* Names Men */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Populaire Voornamen (Mannen)</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Voornaam</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.sex === 'M' && person.firstName && person.firstName !== '?') {
                                        acc[person.firstName] = (acc[person.firstName] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 50)
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td style={{ fontWeight: '700' }}>{rank}</td>
                                            <td>{name}</td>
                                            <td style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Names Women */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Populaire Voornamen (Vrouwen)</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Voornaam</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.sex === 'F' && person.firstName && person.firstName !== '?') {
                                        acc[person.firstName] = (acc[person.firstName] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 50)
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td style={{ fontWeight: '700' }}>{rank}</td>
                                            <td>{name}</td>
                                            <td style={{ color: 'var(--female-color)', fontWeight: '600' }}>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Occupations / Surnames Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '35px' }}>
                {/* Occupations */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Meest Voorkomende Beroepen</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Beroep</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.occupation) {
                                        acc[person.occupation] = (acc[person.occupation] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 50)
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td style={{ fontWeight: '700' }}>{rank}</td>
                                            <td>{name}</td>
                                            <td style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Surnames */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Populaire Achternamen</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Achternaam</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.lastName && person.lastName !== '?') {
                                        acc[person.lastName] = (acc[person.lastName] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 50)
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td style={{ fontWeight: '700' }}>{rank}</td>
                                            <td>{name}</td>
                                            <td style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Birthplaces & Gender Pie Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '35px' }}>
                {/* Birthplaces */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Populaire Geboorteplaatsen</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Geboorteplaats</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    const place = person.birth?.place || 'Onbekend';
                                    acc[place] = (acc[place] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 50)
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td style={{ fontWeight: '700' }}>{rank}</td>
                                            <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={name}>{name}</td>
                                            <td style={{ color: 'var(--primary-color)', fontWeight: '600' }}>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gender Pie Chart */}
                <div className="card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Verdeling Mannen en Vrouwen</h3>
                    <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Mannen', value: persons.persons.filter(person => person.sex === 'M').length },
                                        { name: 'Vrouwen', value: persons.persons.filter(person => person.sex === 'F').length },
                                        { name: 'Overig', value: persons.persons.filter(person => person.sex !== 'M' && person.sex !== 'F').length }
                                    ]}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label
                                >
                                    <Cell key="Mannen" fill="var(--male-color)" />
                                    <Cell key="Vrouwen" fill="var(--female-color)" />
                                    <Cell key="Overig" fill="#cbd5e1" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Statistics;