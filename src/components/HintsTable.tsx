import React, { useState } from 'react';
import { IPerson } from '../interfaces/IPersons';
import { Link } from 'react-router-dom';

function HintsTable({ id, title, persons }: { id: string, title: string, persons: IPerson[] }) {
    const [showBody, setShowBody] = useState(false);

    const toggleBody = () => setShowBody(!showBody);

    const getYear = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        const match = dateStr.match(/\d{4}/);
        return match ? `(${match[0]})` : '';
    };

    return (
        <table id={id} style={{ marginBottom: '20px' }}>
            <thead>
                <tr onClick={toggleBody} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}>
                    <th style={{ padding: '16px 20px', backgroundColor: showBody ? 'rgba(79, 70, 229, 0.04)' : '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: showBody ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>{`${title} (${persons.length})`}</span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{showBody ? '−' : '+'}</span>
                        </div>
                    </th>
                </tr>
            </thead>
            {showBody && (
                <tbody>
                    {persons.length > 0 ? (
                        persons.map(person => (
                            <tr key={person.pointer}>
                                <td style={{ padding: '12px 20px' }}>
                                    <Link to={`/personen/${person.pointer}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                                        👤 {person.firstName || '?'} {person.lastName || '?'} {getYear(person.birth?.date)}
                                    </Link>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                                        ({person.pointer})
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Geen personen gevonden voor deze categorie.
                            </td>
                        </tr>
                    )}
                </tbody>
            )}
        </table>
    );
};

export default HintsTable;