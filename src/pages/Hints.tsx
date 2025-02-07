import React, { useState } from 'react';
import { IPerson, IPersons } from '../interfaces/IPersons';
import HintsTable from '../components/HintsTable';
import { get } from 'https';

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
        { id: "incorrect-characters", title: "Personen met incorrecte karakters in hun naam", persons: persons.persons.filter(person => /[^a-zA-Z\s-öäüëéèß??.]/.test(person.firstName) || /[^a-zA-Z\s-öäüëéèß??']/.test(person.lastName)) },
        { id: "moved-location", title: "Personen die op verschillende locaties zijn geboren en overleden", persons: persons.persons.filter(person => person.birth.place && person.death.place && person.birth.place !== person.death.place) },
        { id: "incorrect-location", title: "Personen waarvan een locatie niet de juiste syntax heeft", persons: persons.persons.filter(person => (person.birth.place && (person.birth.place.match(/,/g) || []).length !== 4) || (person.death.place && (person.death.place.match(/,/g) || []).length !== 4)) },
        // {id: "duplicates", title: "Personen die mogelijk dubbel zijn", persons: getPossibleDuplicates(persons)}
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

    function getPossibleDuplicates(persons: IPersons): IPerson[] {
        let personScore = new Map<IPerson, number>();

        persons.persons
        .filter(
        person => {
            let fullName = `${person.firstName} ${person.lastName}`;
            return persons.persons.filter(p => `${p.firstName} ${p.lastName}` === fullName).length > 1;
        })
        .forEach(person => {
            let score = 0;

            persons.persons.forEach(p => {
                if (p.pointer === person.pointer) return;

                //if birth date is the same or within 1 year
                if (p.birth.date && person.birth.date && Math.abs(new Date(p.birth.date).getFullYear() - new Date(person.birth.date).getFullYear()) <= 1) score++;
                //if death date is the same or within 1 year
                if (p.death.date && person.death.date && Math.abs(new Date(p.death.date).getFullYear() - new Date(person.death.date).getFullYear()) <= 1) score++;
                // if father is the same
                if (p.father && person.father && p.father.firstName === person.father.firstName && p.father.lastName === person.father.lastName) score++;
                // if mother is the same
                if (p.mother && person.mother && p.mother.firstName === person.mother.firstName && p.mother.lastName === person.mother.lastName) score++;
            });

            personScore.set(person, score);

        });

        return [...personScore.entries()].filter(([_, score]) => score > 3).map(([person, _]) => person);
    };
};

export default Hints;