import React from 'react';
import { useParams } from 'react-router-dom';
import { IPerson, IPersons } from '../interfaces/IPersons';

function PersonDetail({ persons }: { persons: IPersons }) {
    const { id } = useParams<{ id: string }>();

    const person = persons.persons.find(person => person.pointer === id) as IPerson;

    return (
        <div>
            <h1>{`${person.firstName} ${person.lastName}`}</h1>
            <table>
                <tbody>
                    <tr>
                        <td>Voornaam</td>
                        <td>{person.firstName}</td>
                    </tr>
                    <tr>
                        <td>Achternaam</td>
                        <td>{person.lastName}</td>
                    </tr>
                    <tr>
                        <td>Geboortedatum</td>
                        <td>{person.birth?.date}</td>
                    </tr>
                    <tr>
                        <td>Overlijdensdatum</td>
                        <td>{person.death?.date}</td>
                    </tr>
                    <tr>
                        <td>Vader</td>
                        <td>
                            {person.father && (
                                <a href={`/personen/${person.father.pointer}`} className={`label ${person.father.sex}`}>
                                    {`${person.father.firstName} ${person.father.lastName} ${person.father.birth?.date ? `(${new Date(person.father.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                    </a>
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>Moeder</td>
                        <td>
                            {person.mother && (
                                <a href={`/personen/${person.mother.pointer}`} className={`label ${person.mother.sex}`}>
                                    {`${person.mother.firstName} ${person.mother.lastName} ${person.mother.birth?.date ? `(${new Date(person.mother.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                </a>
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>Broers en zussen</td>
                        <td>
                            {person.siblings && person.siblings.map(sibling => (
                                <a href={`/personen/${sibling.pointer}`} className={`label ${sibling.sex}`} key={sibling.pointer}>
                                    {`${sibling.firstName} ${sibling.lastName} ${sibling.birth?.date ? `(${new Date(sibling.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                </a>
                            ))}
                        </td>
                    </tr>
                    {person.partners.length > 0 &&
                        person.partners.map((partner, index) => (
                            <React.Fragment key={partner.pointer}>
                                <tr>
                                    <td>{`(${index + 1}) Partner:`}</td>
                                    <td>
                                        <a href={`/personen/${partner.pointer}`} className={`label ${partner.sex}`}>
                                            {`${partner.firstName} ${partner.lastName} ${partner.birth?.date ? `(${new Date(partner.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                        </a>
                                    </td>
                                </tr>
                                {partner.children && partner.children.length > 0 && <tr>
                                    <td></td>
                                    <td>
                                        Kinderen:
                                        {partner.children && partner.children.length > 0 ? (
                                            partner.children.map(child => (
                                                <a href={`/personen/${child.pointer}`} className={`label ${child.sex}`} key={child.pointer}>
                                                    {`${child.firstName} ${child.lastName} ${child.birth?.date ? `(${new Date(child.birth.date.substring(-4)).getFullYear()})` : ''}`}
                                                </a>
                                            ))
                                        ) : (
                                            <span>Geen kinderen</span>
                                        )}
                                    </td>
                                </tr>}
                            </React.Fragment>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default PersonDetail;