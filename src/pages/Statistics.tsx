import React, { useState } from 'react';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { IPersons } from '../interfaces/IPersons';

function getBirthdateData(persons: IPersons) {
    const birthdateCounts = persons.persons.reduce((acc, person) => {
        if (!person.birth?.date) return acc;
        const year = person.birth.date?.slice(-4);
        if (year) {
            acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(birthdateCounts).map(year => ({
        jaar: year,
        aantal: birthdateCounts[year],
    }));
}

function Statistics({ persons }: { persons: IPersons }) {
    const birthdateData = getBirthdateData(persons);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    const selectedPersons = selectedYear
        ? persons.persons.filter(person => person.birth?.date?.slice(-4) === selectedYear)
        : [];

    return (
        <div>
            <h1>Statistics</h1>
            <h2>Aantal geboortes per jaar</h2>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <LineChart width={800} height={400} data={birthdateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jaar" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aantal" stroke="#8884d8" activeDot={{ r: 8, onClick: (event: any, payload: any) => {console.log(payload.payload.jaar); setSelectedYear(payload.payload.jaar)} }} />
            </LineChart>
            <div style={{ marginLeft: '50px' }}>
            {selectedYear ? (
                <div>
                    <h3>Personen geboren in {selectedYear}</h3>
                    <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Geboortedatum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedPersons.map(person => (
                                <tr key={person.tag}>
                                    <td>{person.firstName || ''} {person.lastName || ''}</td>
                                    <td>{person.birth?.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ): <p>Selecteer een jaar om personen te zien</p>}
            </div>
            </div>
        </div>
    );
};

export default Statistics;