import React, { useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, Brush } from "recharts";
import { IPersons } from "../interfaces/IPersons";
import { getYearSafe, formatDate } from "../utils/dateUtils";

function getBirthdateYears(persons: IPersons) {
    const birthdateCounts = persons.persons.reduce((acc, person) => {
        const yearVal = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
        if (!isNaN(yearVal)) {
            acc[yearVal] = (acc[yearVal] || 0) + 1;
        }
        return acc;
    }, {} as Record<number, number>);

    return Object.keys(birthdateCounts)
        .map(Number)
        .sort((a, b) => a - b)
        .map(year => ({
            jaar: year < 0 ? `${Math.abs(year)} v.Chr.` : `${year}`,
            rawYear: year,
            aantal: birthdateCounts[year],
        }));
}

function BirthsPerYear({ persons }: { persons: IPersons }) {
    const birthdateYears = getBirthdateYears(persons);
    const [birthSelectedYear, setBirthSelectedYear] = useState<number | null>(null);

    const selectedPersonsYear = birthSelectedYear !== null
        ? persons.persons.filter(person => {
            const y = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
            return y === birthSelectedYear;
        })
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
                        <LineChart data={birthdateYears} onClick={(event: any) => event && event.activePayload && setBirthSelectedYear(event.activePayload[0].payload.rawYear)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="jaar" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                            <Line type="monotone" dataKey="aantal" stroke="var(--primary-color)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} cursor="pointer" />
                            <Brush dataKey="jaar" height={30} stroke="var(--primary-color)" fill="var(--bg-color)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '30px', maxHeight: '320px', overflowY: 'auto' }}>
                    {birthSelectedYear !== null ? (
                        <div>
                            <h4 style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '15px' }}>
                                Geboren in {birthSelectedYear < 0 ? `${Math.abs(birthSelectedYear)} v.Chr.` : birthSelectedYear}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedPersonsYear.map(p => (
                                    <div key={p.pointer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                                        <span style={{ fontWeight: '600' }}>{p.firstName || ''} {p.lastName || ''}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{formatDate(p.birth?.date) || formatDate(p.christening?.date)}</span>
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
