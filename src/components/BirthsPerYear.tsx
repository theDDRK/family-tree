import React, { useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from "recharts";
import { IPersons } from "../interfaces/IPersons";

function getBirthdateYears(persons: IPersons) {
    const birthdateCounts = persons.persons.reduce((acc, person) => {
        if (!person.birth?.date) return acc;
        const year = person.birth.date?.slice(-4);
        if (year && /^\d{4}$/.test(year)) {
            acc[year] = (acc[year] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(birthdateCounts)
        .sort()
        .map(year => ({
            jaar: year,
            aantal: birthdateCounts[year],
        }));
}

function BirthsPerYear({ persons }: { persons: IPersons }) {
    const birthdateYears = getBirthdateYears(persons);
    const [birthSelectedYear, setBirthSelectedYear] = useState<string | null>(null);

    const selectedPersonsYear = birthSelectedYear
        ? persons.persons.filter(person => person.birth?.date?.slice(-4) === birthSelectedYear)
        : [];

    return (
        <div>
            <h3 style={{ margin: '0 0 4px 0', fontWeight: '800' }}>Geboortes door de jaren heen</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>
                Klik op de grafieklijn om de personen te tonen die in dat specifieke jaar zijn geboren.
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ width: '100%', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={birthdateYears} onClick={(event: any) => event && setBirthSelectedYear(event.activeLabel)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="jaar" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="aantal" stroke="var(--primary-color)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} cursor="pointer" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px', maxHeight: '320px', overflowY: 'auto' }}>
                    {birthSelectedYear ? (
                        <div>
                            <h4 style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '15px' }}>Geboren in {birthSelectedYear}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedPersonsYear.map(p => (
                                    <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                        <span style={{ fontWeight: '600' }}>{p.firstName || ''} {p.lastName || ''}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{p.birth?.date}</span>
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
    );
}

export default BirthsPerYear;
