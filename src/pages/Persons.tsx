import React from 'react';
import { IPersons } from '../interfaces/IPersons';

function Persons({persons}: {persons: IPersons}) {
        return (
            <div>
                <h1>Persons Page</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Voornaam</th>
                            <th>Achternaam</th>
                            <th>Geboortedatum</th>
                            <th>Overlijdensdatum</th>
                            <th></th>


                        </tr>
                    </thead>
                    <tbody>
                        {persons.persons.map(person => (
                            <tr key={person.pointer}>
                                <td>{person.firstName}</td>
                                <td>{person.lastName}</td>
                                <td>{person.birth?.date}</td>
                                <td>{person.death?.date}</td>
                                <td>{person.children.map(child => (
                                    <a href={`/family-tree/personen/${child.pointer}`} className={`label ${child.sex}`} key={person.pointer + child.pointer}>
                                        {child.firstName}
                                    </a>
                                ))}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

export default Persons;