import React, { useState } from 'react';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { IPersons } from '../interfaces/IPersons';
import BirthsPerYear from '../components/BirthsPerYear';

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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
    let amountPerDay = [];
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
        if (year) {
            acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(deathCounts).map(year => ({
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

function Statistics({ persons }: { persons: IPersons }) {
    const birthdateMonths = getBirthdateMonths(persons);
    const deathYears = getDeathYears(persons);
    const deathMonths = getDeathMonths(persons);
    const [deathSelectedYear, setDeathSelectedYear] = useState<string | null>(null);
    const [selectedBirthday, setSelectedBirthday] = useState<string | null>(null);

    const selectedDeathYear = deathSelectedYear
        ? persons.persons.filter(person => person.death?.date?.slice(-4) === deathSelectedYear)
        : [];

    return (
        <div>
            <h1>Statistieken</h1>
            <BirthsPerYear persons={persons} />

            <h2>Aantal personen per geboortemaand</h2>
            <h3>Totaal: {birthdateMonths.reduce((acc, month) => acc + month.aantal, 0)}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <BarChart width={800} height={400} data={birthdateMonths}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="maand" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aantal" fill="#8884d8" />
                </BarChart>
            </div>

            <h2>Aantal personen per verjaardag</h2>
            <h3>Totaal: {persons.persons.filter(person => person.birth?.date).length}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <div>
                    <BarChart width={800} height={400} data={getBirthdaysPerDay(persons)} onClick={(event: any) => setSelectedBirthday(event.activeLabel)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={(item: { dag: string; maand: string }) => `${item.dag} ${item.maand}`} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="aantal" fill="#8884d8" />
                    </BarChart>
                </div>
                <div style={{ marginLeft: '50px' }}>
                    {selectedBirthday ? (
                        <div>
                            <h3>Personen jarig op {selectedBirthday}</h3>
                            <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                                <thead>
                                    <tr>
                                        <th>Naam</th>
                                        <th>Geboortedatum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {persons.persons.filter(person => person.birth?.date?.startsWith(selectedBirthday)).map(person => (
                                        <tr key={person.tag}>
                                            <td>{person.firstName || ''} {person.lastName || ''}</td>
                                            <td>{person.birth?.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p>Selecteer een verjaardag om personen te zien</p>}
                </div>
            </div>

            <h2>Aantal overleden per jaar</h2>
            <h3>Totaal: {deathYears.reduce((acc, year) => acc + year.aantal, 0)}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <div>
                    <LineChart width={800} height={400} data={deathYears} onClick={(event: any) => setDeathSelectedYear(event.activeLabel)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="jaar" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="aantal" stroke="#8884d8" />
                    </LineChart>
                </div>
                <div style={{ marginLeft: '50px' }}>
                    {deathSelectedYear ? (
                        <div>
                            <h3>Personen overleden in {deathSelectedYear}</h3>
                            <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                                <thead>
                                    <tr>
                                        <th>Naam</th>
                                        <th>Overlijdensdatum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDeathYear.map(person => (
                                        <tr key={person.tag}>
                                            <td>{person.firstName || ''} {person.lastName || ''}</td>
                                            <td>{person.death?.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p>Selecteer een jaar om personen te zien</p>}
                </div>
            </div>
            <h2>Aantal personen per overlijdensmaand</h2>
            <h3>Totaal: {deathMonths.reduce((acc, month) => acc + month.aantal, 0)}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <BarChart width={800} height={400} data={deathMonths}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="maand" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aantal" fill="#8884d8" />
                </BarChart>
            </div>
            <h2>Meest voorkomende voornamen</h2>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>Mannen</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Voornaam</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.sex === 'M') {
                                        acc[person.firstName] = (acc[person.firstName] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td>{rank}</td>
                                            <td>{name}</td>
                                            <td>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '50px' }}>
                    <h3>Vrouwen</h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Voornaam</th>
                                    <th>Aantal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(persons.persons.reduce((acc, person) => {
                                    if (person.sex === 'F') {
                                        acc[person.firstName] = (acc[person.firstName] || 0) + 1;
                                    }
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort((a, b) => b[1] - a[1])
                                    .reduce((acc, [name, count], index, array) => {
                                        const rank = index > 0 && array[index - 1][1] === count ? acc[acc.length - 1].rank : index + 1;
                                        acc.push({ rank, name, count });
                                        return acc;
                                    }, [] as { rank: number, name: string, count: number }[])
                                    .map(({ rank, name, count }) => (
                                        <tr key={name}>
                                            <td>{rank}</td>
                                            <td>{name}</td>
                                            <td>{count}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <h2>Verdeling mannen en vrouwen</h2>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <PieChart width={800} height={400}>
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
                        outerRadius={150}
                        fill="#8884d8"
                        label
                    >
                        <Cell key="Mannen" fill="#87CEEB" />
                        <Cell key="Vrouwen" fill="#FFB6C1" />
                        <Cell key="Overig" fill="#FFD700" />
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>
        </div>
    );
};

export default Statistics;