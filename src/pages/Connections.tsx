import React, { useState } from 'react';
import { IPerson, IPersons } from '../interfaces/IPersons';
import Person from '../components/Person';

interface IMrcaGroup {
    parent1: IPerson;
    parent2: IPerson | null;
}

function Connections({ persons }: { persons: IPersons }) {
    const personsList: IPerson[] = persons.persons.filter((person) => person.firstName && person.lastName && person.firstName !== '?' && person.lastName !== '?' && person.firstName !== '(?)' && person.lastName !== '(?)' && person.lastName !== '...');
    const [person1Name, setPerson1Name] = useState('');
    const [person2Name, setPerson2Name] = useState('');
    const [person1, setPerson1] = useState<IPerson | null>(null);
    const [person2, setPerson2] = useState<IPerson | null>(null);
    const [mrcaGroups, setMrcaGroups] = useState<IMrcaGroup[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const handleAutocomplete = (event: React.ChangeEvent<HTMLInputElement>, setPerson: React.Dispatch<React.SetStateAction<string>>) => {
        const value = event.target.value;
        setPerson(value);
    };

    const resetStates = () => {
        setPerson1Name('');
        setPerson2Name('');
        setPerson1(null);
        setPerson2(null);
        setMrcaGroups([]);
        setSubmitted(false);
    }

    // DFS with cycle protection to retrieve all ancestors
    const getAncestors = (person: IPerson, visited = new Set<string>(), list: IPerson[] = []): IPerson[] => {
        if (!person || visited.has(person.pointer || '')) return list;
        visited.add(person.pointer || '');
        list.push(person);
        if (person.father) getAncestors(person.father, visited, list);
        if (person.mother) getAncestors(person.mother, visited, list);
        return list;
    };

    const findCommonAncestors = (p1Name: string, p2Name: string) => {
        setMrcaGroups([]);

        const p1Obj = personsList.find((p) => `${p.firstName} ${p.lastName} (${p.birth.date ? p.birth.date.slice(-4) : ''})` === p1Name);
        const p2Obj = personsList.find((p) => `${p.firstName} ${p.lastName} (${p.birth.date ? p.birth.date.slice(-4) : ''})` === p2Name);
        if (!p1Obj || !p2Obj) return;

        setPerson1(p1Obj);
        setPerson2(p2Obj);

        // Fetch unique ancestors for both targets (Linear O(N) traversal)
        const p1Ancestors = getAncestors(p1Obj);
        const p2Ancestors = getAncestors(p2Obj);

        const p2AncestorSet = new Set(p2Ancestors.map(a => a.pointer));
        
        // Find common ancestors (intersection)
        const common = p1Ancestors.filter(a => p2AncestorSet.has(a.pointer));
        const commonSet = new Set(common.map(a => a.pointer || ''));

        if (common.length === 0) return;

        // Find Most Recent Common Ancestors (MRCAs)
        // An ancestor is an MRCA if none of their children is also in the common set.
        const mrcas = common.filter(anc => {
            return !anc.children || !anc.children.some(child => commonSet.has(child.pointer || ''));
        });

        // Group MRCAs into couples (husband & wife) or single individuals
        const groups: IMrcaGroup[] = [];
        const groupedPointers = new Set<string>();

        mrcas.forEach(person => {
            if (groupedPointers.has(person.pointer || '')) return;

            const partner = person.partners?.find(p => p && mrcas.some(m => m.pointer === p.pointer));
            if (partner) {
                groups.push({ parent1: person, parent2: partner });
                groupedPointers.add(person.pointer || '');
                groupedPointers.add(partner.pointer || '');
            } else {
                groups.push({ parent1: person, parent2: null });
                groupedPointers.add(person.pointer || '');
            }
        });

        setMrcaGroups(groups);
    };

    // Breadth-First path traversal to trace exact lineage steps safely
    const getPathToCommonAncestor = (ancestor: IPerson, person: IPerson): IPerson[] => {
        const path: IPerson[] = [];

        const findPath = (currentPerson: IPerson, targetAncestor: IPerson, currentPath: IPerson[], visited = new Set<string>()): boolean => {
            if (!currentPerson || visited.has(currentPerson.pointer || '')) return false;
            visited.add(currentPerson.pointer || '');
            currentPath.push(currentPerson);
            if (currentPerson.pointer === targetAncestor.pointer) return true;
            if (currentPerson.father && findPath(currentPerson.father, targetAncestor, currentPath, visited)) return true;
            if (currentPerson.mother && findPath(currentPerson.mother, targetAncestor, currentPath, visited)) return true;
            currentPath.pop();
            return false;
        };

        findPath(person, ancestor, path);
        // Exclude self (start) and final ancestor (end)
        return path.reverse().slice(1, path.length - 1);
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Connecties</h1>
            <p className="page-subtitle">Vind de gemeenschappelijke voorouders en de bloedverwantschap tussen twee personen in je stamboom.</p>

            {/* Inputs Form */}
            <div className="card" style={{ marginBottom: '35px', padding: '30px' }}>
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor='person1' style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-secondary)' }}>Persoon 1</label>
                            <input
                                type='text'
                                id='person1'
                                placeholder='Naam van persoon 1'
                                value={person1Name}
                                onChange={(e) => { handleAutocomplete(e, setPerson1Name) }}
                                list='person1-options'
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                            <datalist id='person1-options'>
                                {personsList
                                    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                                    .map((person) => (
                                        <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                                    ))}
                            </datalist>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor='person2' style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-secondary)' }}>Persoon 2</label>
                            <input
                                type='text'
                                id='person2'
                                placeholder='Naam van persoon 2'
                                value={person2Name}
                                onChange={(e) => handleAutocomplete(e, setPerson2Name)}
                                list='person2-options'
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                            <datalist id='person2-options'>
                                {personsList
                                    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                                    .map((person) => (
                                        <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                                    ))}
                            </datalist>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        {person1Name && person2Name && (
                            <button 
                                type="button" 
                                onClick={() => { setSubmitted(true); findCommonAncestors(person1Name, person2Name); }}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '20px',
                                    background: 'var(--primary-gradient)',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    border: 'none',
                                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Connectie Zoeken
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={() => resetStates()}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'white',
                                color: 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {submitted && (
                <div className="card" style={{ padding: '30px' }}>
                    {mrcaGroups.length > 0 ? (
                        <>
                            <h3 style={{ margin: '0 0 8px 0', fontWeight: '800' }}>Gemeenschappelijke voorouders</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                                {mrcaGroups.length} groep{mrcaGroups.length > 1 ? 'en' : ''} gemeenschappelijke voorouders gevonden:
                            </p>
                            
                            <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <svg width="560" height={Math.max(mrcaGroups.length * 150 + 150, 500)} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px' }}>
                                    {mrcaGroups.map((group, index) => {
                                        const ancestor1 = group.parent1;
                                        const ancestor2 = group.parent2;

                                        return (
                                            <React.Fragment key={`group-${index}`}>
                                                <Person person={ancestor1} position={{ x: ancestor2 ? 0 : 150, y: index * 150 }} width={200} height={100} />
                                                {ancestor2 && (
                                                    <>
                                                        <Person person={ancestor2} position={{ x: 300, y: index * 150 }} width={200} height={100} />
                                                        <line
                                                            x1={200}
                                                            y1={index * 150 + 50}
                                                            x2={300}
                                                            y2={index * 150 + 50}
                                                            stroke="#94a3b8"
                                                            strokeWidth="1.5"
                                                        />
                                                    </>
                                                )}
                                                <text 
                                                    x={520} 
                                                    y={index * 150 + 60} 
                                                    fontSize="50" 
                                                    fill="var(--primary-color)" 
                                                    style={{ userSelect: 'none', cursor: 'pointer', fontWeight: 'bold' }} 
                                                    onClick={() => {
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
                                                                svg.setAttribute('width', '560');
                                                                return;
                                                            }
                                                            const square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                                                            square.setAttribute('x', '600');
                                                            square.setAttribute('y', '25');
                                                            square.setAttribute('width', '400');
                                                            square.setAttribute('height', `500`);
                                                            square.setAttribute('fill', '#1e293b');
                                                            square.setAttribute('rx', '12');
                                                            svg.appendChild(square);
                                                            const textElement = svg.querySelector(`text[x='520'][y='${index * 150 + 60}']`);
                                                            if (textElement && textElement.textContent === '→') {
                                                                textElement.textContent = '✕';
                                                                textElement.setAttribute('font-size', '30');
                                                                textElement.setAttribute('x', '530');
                                                            }

                                                            const pathPerson1: IPerson[] = getPathToCommonAncestor(ancestor1, person1!);
                                                            const pathPerson2: IPerson[] = getPathToCommonAncestor(ancestor1, person2!);

                                                            const column1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                                            column1.setAttribute('x', '620');
                                                            column1.setAttribute('y', '55');
                                                            column1.setAttribute('fill', person1!.sex === 'M' ? '#60a5fa' : person1!.sex === 'F' ? '#f472b6' : 'white');
                                                            column1.setAttribute('font-weight', 'bold');
                                                            column1.setAttribute('font-size', '13');
                                                            column1.textContent = person1!.firstName + ' ' + person1!.lastName;
                                                            svg.appendChild(column1);

                                                            pathPerson1.forEach((p, i) => {
                                                                const tEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                                                tEl.setAttribute('x', '620');
                                                                tEl.setAttribute('y', `${110 + i * ((mrcaGroups.length * 150 - 200) / pathPerson1.length)}`);
                                                                tEl.setAttribute('fill', '#e2e8f0');
                                                                tEl.setAttribute('font-size', '12');
                                                                tEl.textContent = `• ${p.firstName} ${p.lastName}`;
                                                                svg.appendChild(tEl);
                                                            });

                                                            const column2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                                            column2.setAttribute('x', '820');
                                                            column2.setAttribute('y', '55');
                                                            column2.setAttribute('fill', person2!.sex === 'M' ? '#60a5fa' : person2!.sex === 'F' ? '#f472b6' : 'white');
                                                            column2.setAttribute('font-weight', 'bold');
                                                            column2.setAttribute('font-size', '13');
                                                            column2.textContent = person2!.firstName + ' ' + person2!.lastName;
                                                            svg.appendChild(column2);

                                                            pathPerson2.forEach((p, i) => {
                                                                const tEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                                                tEl.setAttribute('x', '820');
                                                                tEl.setAttribute('y', `${110 + i * ((mrcaGroups.length * 150 - 200) / pathPerson2.length)}`);
                                                                tEl.setAttribute('fill', '#e2e8f0');
                                                                tEl.setAttribute('font-size', '12');
                                                                tEl.textContent = `• ${p.firstName} ${p.lastName}`;
                                                                svg.appendChild(tEl);
                                                            });

                                                            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                                            arrow.setAttribute('x1', '810');
                                                            arrow.setAttribute('y1', '70');
                                                            arrow.setAttribute('x2', '810');
                                                            arrow.setAttribute('y2', `${Math.max(mrcaGroups.length * 150 - 100, 450)}`);
                                                            arrow.setAttribute('stroke', '#475569');
                                                            arrow.setAttribute('stroke-width', '1.5');
                                                            arrow.setAttribute('marker-start', 'url(#arrow)');
                                                            arrow.setAttribute('marker-end', 'url(#arrow)');
                                                            svg.appendChild(arrow);

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
                                                            path.setAttribute('fill', '#475569');
                                                            marker.appendChild(path);
                                                            defs.appendChild(marker);
                                                            svg.appendChild(defs);
                                                        }
                                                    }}
                                                >
                                                    →
                                                </text>
                                            </React.Fragment>
                                        );
                                    })}
                                    {person1 && <Person person={person1} position={{ x: 0, y: mrcaGroups.length * 150 + 50 }} width={200} height={100} />}
                                    {person2 && <Person person={person2} position={{ x: 300, y: mrcaGroups.length * 150 + 50 }} width={200} height={100} />}
                                    <line
                                        x1={250}
                                        y1={50}
                                        x2={250}
                                        y2={mrcaGroups.length * 150}
                                        stroke="#cbd5e1"
                                        strokeDasharray="5,5"
                                        strokeWidth="1.5"
                                    />
                                    <line
                                        x1={100}
                                        y1={mrcaGroups.length * 150 + 50}
                                        x2={250}
                                        y2={mrcaGroups.length * 150}
                                        stroke="#cbd5e1"
                                        strokeDasharray="5,5"
                                        strokeWidth="1.5"
                                    />
                                    <line
                                        x1={400}
                                        y1={mrcaGroups.length * 150 + 50}
                                        x2={250}
                                        y2={mrcaGroups.length * 150}
                                        stroke="#cbd5e1"
                                        strokeDasharray="5,5"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </div>
                        </>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, fontStyle: 'italic' }}>
                            Geen gemeenschappelijke voorouders gevonden.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Connections;