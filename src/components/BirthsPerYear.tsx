import React, { useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";
import { IPersons } from "../interfaces/IPersons";

function getBirthdateYears(persons: IPersons) {
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

function BirthsPerYear({ persons }: { persons: any }) {
        const birthdateYears = getBirthdateYears(persons);
        const [birthSelectedYear, setBirthSelectedYear] = useState<string | null>(null);
    
        const selectedPersonsYear = birthSelectedYear
            ? persons.persons.filter(person => person.birth?.date?.slice(-4) === birthSelectedYear)
            : [];

    return (
        <>
            <h2>Aantal geboortes per jaar</h2>
            <h3>Totaal: {birthdateYears.reduce((acc, year) => acc + year.aantal, 0)}</h3>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                <div>
                    <LineChart width={800} height={400} data={birthdateYears} onClick={(event: any) => setBirthSelectedYear(event.activeLabel)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="jaar" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="aantal" stroke="#8884d8" />
                    </LineChart>
                </div>
                <div style={{ marginLeft: '50px' }}>
                    {birthSelectedYear ? (
                        <div>
                            <h3>Personen geboren in {birthSelectedYear}</h3>
                            <table style={{ textAlign: 'left', borderSpacing: '10px 0' }}>
                                <thead>
                                    <tr>
                                        <th>Naam</th>
                                        <th>Geboortedatum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPersonsYear.map(person => (
                                        <tr key={person.tag}>
                                            <td>{person.firstName || ''} {person.lastName || ''}</td>
                                            <td>{person.birth?.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p>Selecteer een jaar om personen te zien</p>}
                </div>
            </div>
        </>
    );
}
export default BirthsPerYear;
