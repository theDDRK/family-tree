import React, { useState } from 'react';
import { IPersons } from '../interfaces/IPersons';
import HintsTable from '../components/HintsTable';

function Hints({ persons }: { persons: IPersons }) {
    const hintsList = [
        { id: "no-parents", title: "Personen zonder ouders", persons: persons.persons.filter(person => !person.father && !person.mother) },
        { id: "no-children", title: "Personen zonder kinderen", persons: persons.persons.filter(person => !person.children.length && new Date().getFullYear() - new Date(person.birth.date).getFullYear() > 18) },
        { id: "no-siblings", title: "Personen zonder broers of zussen", persons: persons.persons.filter(person => !person.siblings.length) },
        { id: "no-partners", title: "Personen zonder partner", persons: persons.persons.filter(person => !person.partners.length) },
        { id: "no-birth", title: "Personen zonder geboortedatum", persons: persons.persons.filter(person => !person.birth.date) },
        { id: "no-death", title: "Personen zonder overlijdensdatum", persons: persons.persons.filter(person => !person.death.date) },
        { id: "no-birth-location", title: "Personen zonder geboorteplaats", persons: persons.persons.filter(person => !person.birth.place) },
        { id: "no-death-location", title: "Personen zonder overlijdensplaats", persons: persons.persons.filter(person => !person.death.place) },
        { id: "wrong-family-name", title: "Personen met een andere achternaam dan hun vader", persons: persons.persons.filter(person => person.father && person.lastName !== person.father.lastName) },
        { id: "younger-mother", title: "Personen met een moeder die jonger is", persons: persons.persons.filter(person => person.birth.date && person.mother && person.mother.birth.date && new Date(person.mother.birth.date.substring(-4)).getFullYear() > new Date(person.birth.date.substring(-4)).getFullYear()) },
        { id: "younger-father", title: "Personen met een vader die jonger is", persons: persons.persons.filter(person => person.birth.date && person.father && person.father.birth.date && new Date(person.father.birth.date.substring(-4)).getFullYear() > new Date(person.birth.date.substring(-4)).getFullYear()) },
        { id: "older-children", title: "Personen met kind die ouder is", persons: persons.persons.filter(person => person.birth.date && person.children.some(child => child.birth.date && new Date(child.birth.date.substring(-4)).getFullYear() < new Date(person.birth.date.substring(-4)).getFullYear())) },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>Hints</h1>
            {persons.persons.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Er zijn geen personen om hints voor te genereren.</p>}
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {hintsList.map(hint => (
                    <li key={hint.id} style={{ margin: '10px 0' }}>
                        <a href={`#${hint.id}`} style={{ textDecoration: 'none', color: '#007bff' }}>{hint.title}</a>
                    </li>
                ))}
            </ul>
            {hintsList.map(hint => (
                <HintsTable key={hint.id} id={hint.id} title={hint.title} persons={hint.persons} />
            ))}
        </div>
    );
};

export default Hints;