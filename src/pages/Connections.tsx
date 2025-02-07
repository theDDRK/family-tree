import React, { useState } from 'react';
import { IPerson, IPersons } from '../interfaces/IPersons';
import Person from '../components/Person';
import { text } from 'stream/consumers';
import { get } from 'http';

function Connections({ persons }: { persons: IPersons }) {
    const personsList: IPerson[] = persons.persons.filter((person) => person.firstName && person.lastName && person.firstName !== '?' && person.lastName !== '?' && person.firstName !== '(?)' && person.lastName !== '(?)' && person.lastName !== '...');
    const [person1Name, setPerson1Name] = useState('');
    const [person2Name, setPerson2Name] = useState('');
    const [person1, setPerson1] = useState<IPerson | null>(null);
    const [person1GenerationDifference, setPerson1GenerationDifference] = useState<Map<IPerson, number>>(new Map<IPerson, number>());
    const [person2, setPerson2] = useState<IPerson | null>(null);
    const [person2GenerationDifference, setPerson2GenerationDifference] = useState<Map<IPerson, number>>(new Map<IPerson, number>());
    const [commonAncestors, setCommonAncestors] = useState<IPerson[]>([]);
    const [commonAncestorPairs, setCommonAncestorPairs] = useState<IPerson[][]>([]);
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
        setPerson1GenerationDifference(new Map<IPerson, number>());
        setPerson2(null);
        setPerson2GenerationDifference(new Map<IPerson, number>());
        setCommonAncestors([]);
        setCommonAncestor(null);
        setCommonAncestorPairs([]);
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

        const filteredCommonAncestors: IPerson[] = commonAncestors
        .filter((ancestor) => !commonAncestors.some((a) => a.father === ancestor || a.mother === ancestor));
        const ancestorPairs: IPerson[][] = [];
        filteredCommonAncestors.forEach((ancestor) => {
            if (ancestor.partners.some((partner) => filteredCommonAncestors.includes(partner))) {
                if (!ancestorPairs.some(([a1, a2]) => (a1 === ancestor && a2 === ancestor.partners.find((partner) => filteredCommonAncestors.includes(partner))) || (a1 === ancestor.partners.find((partner) => filteredCommonAncestors.includes(partner)) && a2 === ancestor))) {
                    ancestorPairs.push([ancestor, ancestor.partners.find((partner) => filteredCommonAncestors.includes(partner)) as IPerson]);
                }
            }
        });
        console.log(ancestorPairs);
        setCommonAncestorPairs(ancestorPairs);
        
        setCommonAncestors(filteredCommonAncestors);
        let person1AncestorsGenerationDifference: Map<IPerson, number> = new Map();
        let person2AncestorsGenerationDifference: Map<IPerson, number> = new Map();
        filteredCommonAncestors.forEach((ancestor) => {
            person1Ancestors.forEach((ancestors, generation) => {
                if (ancestors.includes(ancestor)) {
                    person1AncestorsGenerationDifference.set(ancestor, generation);
                }
            });
            person2Ancestors.forEach((ancestors, generation) => {
                if (ancestors.includes(ancestor)) {
                    person2AncestorsGenerationDifference.set(ancestor, generation);
                }
            });
        });
        setPerson1GenerationDifference(person1AncestorsGenerationDifference);
        setPerson2GenerationDifference(person2AncestorsGenerationDifference);
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

    const getPathToCommonAncestor = (ancestor1: IPerson, ancestor2: IPerson, person: IPerson): IPerson[] => {
        const path: IPerson[] = [];

        const findPath = (currentPerson: IPerson, targetAncestor: IPerson, currentPath: IPerson[]): boolean => {
            if (!currentPerson) return false;
            currentPath.push(currentPerson);
            if (currentPerson === targetAncestor) return true;
            if (currentPerson.father && findPath(currentPerson.father, targetAncestor, currentPath)) return true;
            if (currentPerson.mother && findPath(currentPerson.mother, targetAncestor, currentPath)) return true;
            currentPath.pop();
            return false;
        };

        findPath(person, ancestor1, path);
        //remove first and last element
        return path.reverse().slice(1, path.length - 1);
    };

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
            {submitted && (commonAncestorPairs.length > 0 ?
            <>
                <h3>Gemeenschappelijke voorouders</h3>
                <p>
                {commonAncestorPairs.length + ' gemeenschappelijke voorouder' + (commonAncestorPairs.length > 1 ? 's' : '') + ' gevonden:'}
                </p>
                <ul>
                <svg width="560" height={Math.max(commonAncestorPairs.length * 150 + 150, 500)}>
                    {commonAncestorPairs.map(([ancestor1, ancestor2], index) => (
                    <>
                        <Person person={ancestor1} position={{ x: 0, y: index * 150 }} width={200} height={100} />
                        <Person person={ancestor2} position={{ x: 300, y: index * 150 }} width={200} height={100} />
                        <line
                            key={`a1-a2-${index}`}
                            x1={200}
                            y1={index * 150 + 50}
                            x2={300}
                            y2={index * 150 + 50}
                            stroke="black"
                        />
                        <text x={520} y={index * 150 + 60} fontSize="50" fill="black" style={{ userSelect: 'none' }} onClick={() => {
                            const svg = document.querySelector('svg');
                            if (svg) {
                                svg.setAttribute('width', '1000');
                                const existingSquare = svg.querySelector(`rect[x='600'][y='25']`);
                                const textElements = [...svg.querySelectorAll(`text[x='520']`), ...svg.querySelectorAll(`text[x='530']`)];
                                const currentIsSelected = existingSquare && svg.querySelector(`text[x='530'][y='${index * 150 + 60}']`)?.textContent === '✕';
                                if (existingSquare) {
                                    svg.removeChild(existingSquare);
                                    textElements.forEach((textElement) => {
                                        textElement.textContent = '→';
                                        textElement.setAttribute('font-size', '50');
                                        textElement.setAttribute('x', '520');
                                    });
                                }
                                if (currentIsSelected) {
                                    // set the width of the svg to 800
                                    svg.setAttribute('width', '560');
                                    return;
                                }
                                const square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                square.setAttribute('x', '600');
                                square.setAttribute('y', '25');
                                square.setAttribute('width', '400');
                                square.setAttribute('height', `500`);
                                square.setAttribute('fill', '#2B4162');
                                svg.appendChild(square);
                                const textElement = svg.querySelector(`text[x='520'][y='${index * 150 + 60}']`);
                                if (textElement && textElement.textContent === '→') {
                                    textElement.textContent = '✕';
                                    textElement.setAttribute('font-size', '30');
                                    textElement.setAttribute('x', '530');
                                }

                                const pathPerson1: IPerson[] = getPathToCommonAncestor(ancestor1, ancestor2, person1);
                                const pathPerson2: IPerson[] = getPathToCommonAncestor(ancestor1, ancestor2, person2);
                                console.log(pathPerson1, pathPerson2);

                                const column1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                column1.setAttribute('x', '610');
                                column1.setAttribute('y', '45');
                                column1.setAttribute('fill', person1.sex === 'M' ? '#87CEEB' : person1.sex === 'F' ? '#FFB6C1' : 'white');
                                column1.setAttribute('font-size', '13');
                                column1.textContent = person1.firstName + ' ' + person1.lastName;
                                svg.appendChild(column1);

                                pathPerson1.forEach((person, i) => {
                                    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                    textElement.setAttribute('x', '610');
                                    textElement.setAttribute('y', `${100 + i * ((commonAncestorPairs.length * 150 - 200) / pathPerson1.length)}`);
                                    textElement.setAttribute('fill', 'white');
                                    textElement.setAttribute('font-size', '12');
                                    textElement.textContent = `${person.firstName} ${person.lastName}`;
                                    svg.appendChild(textElement);
                                });

                                const column2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                column2.setAttribute('x', '810');
                                column2.setAttribute('y', '45');
                                column2.setAttribute('fill', person2.sex === 'M' ? '#87CEEB' : person2.sex === 'F' ? '#FFB6C1' : 'white');
                                column2.setAttribute('font-size', '13');
                                column2.textContent = person2.firstName + ' ' + person2.lastName;
                                svg.appendChild(column2);

                                pathPerson2.forEach((person, i) => {
                                    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                    textElement.setAttribute('x', '810');
                                    textElement.setAttribute('y', `${100 + i * ((commonAncestorPairs.length * 150 - 200) / pathPerson2.length)}`);
                                    textElement.setAttribute('fill', 'white');
                                    textElement.setAttribute('font-size', '12');
                                    textElement.textContent = `${person.firstName} ${person.lastName}`;
                                    svg.appendChild(textElement);
                                });

                                // Add vertical bidirectional arrow
                                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                arrow.setAttribute('x1', '800');
                                arrow.setAttribute('y1', '60');
                                arrow.setAttribute('x2', '800');
                                arrow.setAttribute('y2', `${Math.max(commonAncestorPairs.length * 150 - 100, 450)}`);
                                arrow.setAttribute('stroke', 'white');
                                arrow.setAttribute('stroke-width', '2');
                                arrow.setAttribute('marker-start', 'url(#arrow)');
                                arrow.setAttribute('marker-end', 'url(#arrow)');
                                svg.appendChild(arrow);

                                // Define arrow marker
                                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                                marker.setAttribute('id', 'arrow');
                                marker.setAttribute('markerWidth', '10');
                                marker.setAttribute('markerHeight', '10');
                                marker.setAttribute('refX', '5');
                                marker.setAttribute('refY', '5');
                                marker.setAttribute('orient', 'auto-start-reverse');
                                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
                                path.setAttribute('fill', 'white');
                                marker.appendChild(path);
                                defs.appendChild(marker);
                                svg.appendChild(defs);
                            }
                        }}>{'→'}</text>
                    </>
                    ))}
                    <Person person={person1} position={{ x: 0, y: commonAncestorPairs.length * 150 + 50 }} width={200} height={100} />
                    <Person person={person2} position={{ x: 300, y: commonAncestorPairs.length * 150 + 50 }} width={200} height={100} />
                    <line
                    key={`a1-a2-down`}
                    x1={250}
                    y1={50}
                    x2={250}
                    y2={commonAncestorPairs.length * 150}
                    stroke="black"
                    strokeDasharray="5,5"
                    />
                    <line
                    key={`p1-a1`}
                    x1={100}
                    y1={commonAncestorPairs.length * 150 + 50}
                    x2={250}
                    y2={commonAncestorPairs.length * 150}
                    stroke="black"
                    strokeDasharray="5,5"
                    />
                    <line
                    key={`p2-a2`}
                    x1={400}
                    y1={commonAncestorPairs.length * 150 + 50}
                    x2={250}
                    y2={commonAncestorPairs.length * 150}
                    stroke="black"
                    strokeDasharray="5,5"
                    />
                </svg>
                </ul>
            </>
            : <p>Geen gemeenschappelijke voorouders gevonden.</p>
            )}
        </div>
    );
};

export default Connections;