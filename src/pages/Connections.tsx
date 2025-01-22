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
    const [commonAncestor, setCommonAncestor] = useState<IPerson | null>(null);

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
        setCommonAncestor(null);
        setSubmitted(false);
    }

    const findCommonAncestors = (person1: string, person2: string) => {
        setCommonAncestors([]);
        setCommonAncestor(null);
        const person1Obj: IPerson | undefined = personsList.find((person) => `${person.firstName} ${person.lastName} (${person.birth.date ? person.birth.date.slice(-4) : ''})` === person1);
        const person2Obj: IPerson | undefined = personsList.find((person) => `${person.firstName} ${person.lastName} (${person.birth.date ? person.birth.date.slice(-4) : ''})` === person2);
        if (!person1Obj || !person2Obj) return;

        setPerson1(person1Obj);
        setPerson2(person2Obj);

        const person1Ancestors: Map<number, IPerson[]> = findAncestors(person1Obj);
        const person2Ancestors: Map<number, IPerson[]> = findAncestors(person2Obj);
        const commonAncestors: IPerson[] = findSimilarities(person1Ancestors, person2Ancestors, false);
        const singleCommonAncestor: IPerson | undefined = findSimilarities(person1Ancestors, person2Ancestors, true)[0];
        if (singleCommonAncestor) setCommonAncestor(singleCommonAncestor);
        if (commonAncestors.length === 0) return;

        setCommonAncestors(commonAncestors);
        let person1GenDiff = 0;
        person1Ancestors.forEach((ancestors, generation) => {
            if (ancestors.includes(commonAncestors[0])) person1GenDiff = generation;
        });
        let person2GenDiff = 0;
        person2Ancestors.forEach((ancestors, generation) => {
            if (ancestors.includes(commonAncestors[0])) person2GenDiff = generation;
        });
        setPerson1GenerationDifference(person1GenDiff);
        setPerson2GenerationDifference(person2GenDiff);
    };

    const findAncestors = (person: IPerson, ancestors: Map<number, IPerson[]> = new Map(), generation: number = 1): Map<number, IPerson[]> => {
        let generationAncestor = [];
        if (!person) {
            return ancestors;
        }
        if (person.father) {
            generationAncestor.push(person.father);
        }
        if (person.mother) {
            generationAncestor.push(person.mother);
        }
        ancestors.set(generation, ancestors.get(generation) ? [...ancestors.get(generation), ...generationAncestor] : generationAncestor);
        generationAncestor.forEach((ancestor) => {
            findAncestors(ancestor, ancestors, generation + 1);
        });
        return ancestors;
    };

    const findSimilarities = (person1Ancestors: Map<number, IPerson[]>, person2Ancestors: Map<number, IPerson[]>, single: boolean) => {
        const commonAncestors: IPerson[] = [];
        person1Ancestors.forEach((ancestors1) => {
            person2Ancestors.forEach((ancestors2) => {
                let count = 0;
                ancestors1.forEach((ancestor1) => {
                    ancestors2.forEach((ancestor2) => {
                        if (ancestor1 === ancestor2) {
                            count++;
                        }
                    });
                });
                if (single || count > 1) {
                    commonAncestors.push(...ancestors1.filter((ancestor1) => ancestors2.includes(ancestor1)));
                }
            });
        });
        return commonAncestors;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Connecties</h1>
            <h2>Gemeenschappelijke voorouder(s)</h2>
            {!person1 && !person2 && <p>Voer de namen van twee personen in om hun gemeenschappelijke voorouder(s) te vinden.</p>}
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
            {submitted && (commonAncestor && 
                <>
                    <h3>Gemeenschappelijke voorouder</h3>
                    <svg width="200" height="100">
                        <Person person={commonAncestor} position={{ x: 0, y: 0 }} width={200} height={100} />
                    </svg>
                </>
            )}
            {submitted && (commonAncestors.length > 0 ?
                <>
                    <h3>Gemeenschappelijke voorouders</h3>
                    <ul>
                        <svg width="500" height="500">
                            {commonAncestors.map((ancestor, index) => (
                                <Person person={ancestor} position={{ x: (index) * 300, y: 0 }} width={200} height={100} />
                            ))}
                            <Person person={person1} position={{ x: 0, y: 200 }} width={200} height={100} />
                            <Person person={person2} position={{ x: 300, y: 200 }} width={200} height={100} />
                            <>
                                <line
                                    key={`a1-a2`}
                                    x1={200}
                                    y1={50}
                                    x2={300}
                                    y2={50}
                                    stroke="black"
                                />
                                <line
                                    key={`a1-a2-down`}
                                    x1={250}
                                    y1={50}
                                    x2={250}
                                    y2={150}
                                    stroke="black"
                                    strokeDasharray="5,5"
                                />
                                <line
                                    key={`p1-a1`}
                                    x1={100}
                                    y1={200}
                                    x2={250}
                                    y2={150}
                                    stroke="black"
                                    strokeDasharray="5,5"
                                />
                                <text
                                    key={`p1-a1`}
                                    x={150}
                                    y={166}
                                    fontSize="12"
                                    fill="black"
                                    textAnchor="middle"
                                >
                                    {`${person1GenerationDifference} generatie${person1GenerationDifference > 1 ? 's' : ''}`}
                                </text>
                                <line
                                    key={`p2-a2`}
                                    x1={400}
                                    y1={200}
                                    x2={250}
                                    y2={150}
                                    stroke="black"
                                    strokeDasharray="5,5"
                                />
                                <text
                                    key={`p2-a2`}
                                    x={350}
                                    y={166}
                                    fontSize="12"
                                    fill="black"
                                    textAnchor="middle"
                                >
                                    {`${person2GenerationDifference} generatie${person2GenerationDifference > 1 ? 's' : ''}`}
                                </text>
                            </>
                        </svg>
                    </ul>
                </>
                : <p>Geen gemeenschappelijke voorouders gevonden.</p>
            )}
        </div>
    );
};

export default Connections;