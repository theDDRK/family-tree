import React, { useState } from 'react';
import { IPerson, IPersons } from '../interfaces/IPersons';
import Person from '../components/Person';

function Connections({ persons }: { persons: IPersons }) {
    const personsList: IPerson[] = persons.persons.filter((person) => person.firstName && person.lastName && person.firstName !== '?' && person.lastName !== '?' && person.firstName !== '(?)' && person.lastName !== '(?)' && person.lastName !== '...');
    const [person1Name, setPerson1Name] = useState('');
    const [person2Name, setPerson2Name] = useState('');
    const [person1, setPerson1] = useState<IPerson | null>(null);
    const [person1GenerationDifference, setPerson1GenerationDifference] = useState(0);
    const [person2, setPerson2] = useState<IPerson | null>(null);
    const [person2GenerationDifference, setPerson2GenerationDifference] = useState(0);
    const [commonAncestors, setCommonAncestors] = useState<IPerson[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const handleAutocomplete = (event: React.ChangeEvent<HTMLInputElement>, setPerson: React.Dispatch<React.SetStateAction<string>>) => {
        const value = event.target.value;
        setPerson(value);
    };

    const resetStates = () => {
        setPerson1Name('');
        setPerson2Name('');
        setPerson1(null);
        setPerson1GenerationDifference(0);
        setPerson2(null);
        setPerson2GenerationDifference(0);
        setCommonAncestors([]);
        setSubmitted(false);
    }

    const findCommonAncestors = (person1: string, person2: string) => {
        const person1Obj: IPerson | undefined = personsList.find((person) => `${person.firstName} ${person.lastName} (${person.birth.date ? person.birth.date.slice(-4) : ''})` === person1);
        const person2Obj: IPerson | undefined = personsList.find((person) => `${person.firstName} ${person.lastName} (${person.birth.date ? person.birth.date.slice(-4) : ''})` === person2);

        if (!person1Obj || !person2Obj) {
            return;
        }

        setPerson1(person1Obj);
        setPerson2(person2Obj);
        console.log(person1Obj, person2Obj);

        const person1Ancestors: IPerson[] = findAncestors(person1Obj);
        const person2Ancestors: IPerson[] = findAncestors(person2Obj);

        const commonAncestors: IPerson[] = person1Ancestors.filter((ancestor) => person2Ancestors.includes(ancestor));
        console.log(commonAncestors);
        if (commonAncestors.length === 0) {
            return;
        }
        const highestGenerationAncestor: IPerson = commonAncestors.sort((a, b) => b.generation - a.generation)[0];
        setCommonAncestors(commonAncestors.filter((ancestor) => ancestor.generation === highestGenerationAncestor?.generation));
        setPerson1GenerationDifference(person1Obj.generation - highestGenerationAncestor.generation);
        setPerson2GenerationDifference(person2Obj.generation - highestGenerationAncestor.generation);
    };

    const findAncestors = (person: IPerson, ancestors: IPerson[] = []) => {
        if (!person) {
            return [];
        }
        if (person.father) {
            ancestors.push(person.father);
            findAncestors(person.father, ancestors);
        }
        if (person.mother) {
            ancestors.push(person.mother);
            findAncestors(person.mother, ancestors);
        }

        return ancestors;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Connecties</h1>
            <h2>Gemeenschappelijke voorouders</h2>
            {!person1 && !person2 && <p>Voer de namen van twee personen in om hun gemeenschappelijke voorouders te vinden.</p>}
            <form>
                <div>
                    <label htmlFor='person1'>Persoon 1: </label>
                    <input
                        type='text'
                        id='person1'
                        placeholder='Naam van persoon 1'
                        value={person1Name}
                        onChange={(e) => { handleAutocomplete(e, setPerson1Name) }}
                        list='person1-options'
                    />
                    <datalist id='person1-options'>
                        {personsList
                            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                            .map((person) => (
                                <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                            ))}
                    </datalist>
                </div>
                <div>
                    <label htmlFor='person2'>Persoon 2: </label>
                    <input
                        type='text'
                        id='person2'
                        placeholder='Naam van persoon 2'
                        value={person2Name}
                        onChange={(e) => handleAutocomplete(e, setPerson2Name)}
                        list='person2-options'
                    />
                    <datalist id='person2-options'>
                        {personsList
                            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                            .map((person) => (
                                <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                            ))}
                    </datalist>
                </div>
                {person1Name && person2Name && <button type="button" onClick={() => { setSubmitted(true); findCommonAncestors(person1Name, person2Name); }}>Zoeken</button>}
                <button type="button" onClick={() => resetStates()}>Reset</button>
            </form>
            {submitted && (commonAncestors.length > 0 ?
                <>
                    <h3>Resultaat</h3>
                    <ul>
                        <svg width="500" height="500">
                            {commonAncestors.map((ancestor, index) => (
                                <Person person={ancestor} position={{ x: (index) * 300, y: 0 }} width={200} height={100} />
                            ))}
                            <Person person={person1} position={{ x: 0, y: 200 }} width={200} height={100} />
                            <Person person={person2} position={{ x: 300, y: 200 }} width={200} height={100} />
                            {commonAncestors.map((ancestor, index) => (
                                index > 0 &&
                                <>
                                    <line
                                        key={`${commonAncestors[index - 1].pointer}-${ancestor.pointer}`}
                                        x1={(index - 1) * 300 + 200}
                                        y1={50}
                                        x2={index * 300}
                                        y2={50}
                                        stroke="black"
                                    />
                                    <line
                                        key={`${commonAncestors[index - 1].pointer}-${ancestor.pointer}`}
                                        x1={(index) * 300 - 50}
                                        y1={50}
                                        x2={(index) * 300 - 50}
                                        y2={150}
                                        stroke="black"
                                        strokeDasharray="5,5"
                                    />
                                    <line
                                        key={`${person1.pointer}-${ancestor.pointer}`}
                                        x1={(index - 1) * 300 + 100}
                                        y1={200}
                                        x2={(index) * 300 - 50}
                                        y2={150}
                                        stroke="black"
                                        strokeDasharray="5,5"
                                    />
                                    <text
                                        key={`${person1.pointer}-${ancestor.pointer}`}
                                        x={(index - 1) * 300 + 150}
                                        y={166}
                                        fontSize="12"
                                        fill="black"
                                        textAnchor="middle"
                                    >
                                        {`${person1GenerationDifference} generatie${person1GenerationDifference > 1 ? 's' : ''}`}
                                    </text>
                                    <line
                                        key={`${person2.pointer}-${ancestor.pointer}`}
                                        x1={(index) * 300 + 100}
                                        y1={200}
                                        x2={(index) * 300 - 50}
                                        y2={150}
                                        stroke="black"
                                        strokeDasharray="5,5"
                                    />
                                    <text
                                        key={`${person2.pointer}-${ancestor.pointer}`}
                                        x={(index) * 300 + 50}
                                        y={166}
                                        fontSize="12"
                                        fill="black"
                                        textAnchor="middle"
                                    >
                                        {`${person2GenerationDifference} generatie${person2GenerationDifference > 1 ? 's' : ''}`}
                                    </text>
                                </>
                            ))}
                        </svg>
                    </ul>
                </>
                : <p>Geen gemeenschappelijke voorouders gevonden.</p>
            )}
        </div>
    );
};

export default Connections;