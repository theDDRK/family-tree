import React, { useState } from 'react';
import { IPerson } from '../interfaces/IPersons';

function HintsTable({ id, title, persons }: { id: string, title: string, persons: IPerson[] }) {
    const [showBody, setShowBody] = useState(false);

    const toggleBody = () => setShowBody(!showBody);

    return (
        <table id={id}>
            <thead>
                <tr onClick={toggleBody}>
                    <th>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{`${title} (${persons.length})`}</span>
                            <span>{showBody ? '-' : '+'}</span>
                        </div>
                    </th>
                </tr>
            </thead>
            {showBody && (
                <tbody>
                    {persons.map(person => (
                        <tr key={person.pointer}>
                            <td>
                                <a href={`/family-tree/personen/${person.pointer}`}>
                                    {`${person.firstName} ${person.lastName} ${person.birth?.date ? `(${new Date(person.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            )}
        </table>
    );
};

export default HintsTable;