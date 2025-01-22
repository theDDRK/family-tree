import React, { useEffect, useRef, useState } from 'react';
import dTree from '../dtree.js';
import '../App.css';
import { IPerson } from '../interfaces/IPersons';

function Tree({ persons, rootPerson, generations }) {
    const [selectedPerson, setSelectedPerson] = React.useState<IPerson | null>(null);
    const [personName, setPersonName] = useState('');

    const handleAutocomplete = (event: React.ChangeEvent<HTMLInputElement>, setPerson: React.Dispatch<React.SetStateAction<string>>) => {
        const value = event.target.value;
        setPerson(value);
        setSelectedPerson(persons.persons.find(person => `${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}` === value));
        const tree = document.getElementById('tree');
        if (tree) {
            tree.innerHTML = '';
        }
    };

    const resetStates = () => {
        setPersonName('');
        setSelectedPerson(null);
        const tree = document.getElementById('tree');
        if (tree) {
            tree.innerHTML = '';
        }
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

    useEffect(() => {
        if (!persons || !selectedPerson) return;

        //parse the persons to the required format
        // const treeData = parsePersons(persons.persons);
        const ancestors = findAncestors(selectedPerson);
        console.log(ancestors);
        const treeData = ancestors.get(ancestors.size - 1).map(person => parsePerson(person));

        dTree.init(treeData, {
            target: '#tree',
            debug: true,
            height: window.innerHeight - 175,
            width: window.innerWidth - 100,
            callbacks: {
                nodeClick: function (name, extra) {
                    const nodes = document.getElementsByClassName('node');
                    let currentNode;
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].innerHTML.includes(extra.firstName) && nodes[i].innerHTML.includes(extra.lastName)) {
                            currentNode = nodes[i];
                        }
                    }
                    const alreadySelected = currentNode.classList.contains('selected');

                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].classList.contains('selected')) {
                            (nodes[i] as HTMLElement).classList.remove('selected');
                        }
                    }
                    if (!alreadySelected) {
                        for (let i = 0; i < nodes.length; i++) {
                            if (nodes[i].innerHTML.includes(extra.lastName)) {
                                (nodes[i] as HTMLElement).classList.add('selected');
                            }
                        }
                    }
                },
                textRenderer: function (name, extra, textClass) {
                    if (extra) {
                        return `<div class="nodeDiv">
                        <p class=${textClass}>${extra.firstName ? extra.firstName : '?'}</p>
                        <p class=${textClass}>${extra.lastName ? extra.lastName : '?'}</p>
                        <br />
                        <p class=${textClass}>${extra.birthDate ? extra.birthDate : ''}</p>
                        <p class=${textClass}>${extra.deathDate ? extra.deathDate : ''}</p>
                        </div>`;
                    }

                },
            },
        });
    }, [selectedPerson, setSelectedPerson]);

    function parsePersons(persons: IPerson[]) {
        const treeData = [];
        const personsWithoutParents = persons.filter(person => !person.father && !person.mother);
        personsWithoutParents.slice(0, 10).forEach(person => {
            treeData.push(parsePerson(person));
        });
        console.log(treeData);
        return treeData;
    }

    function parsePerson(person: IPerson) {
        const childrenPerPartner: Map<IPerson, IPerson[]> = new Map();

        if (person.partners) {
            person.partners?.forEach(p => {
                const partner = p ? p : { firstName: '?', lastName: '?' } as IPerson;
                const children = person.children.filter(child => child.father === person || child.mother === person);
                childrenPerPartner.set(partner, children);
            });

            return {
                ...getPersonData(person),
                marriages: Array.from(childrenPerPartner.entries())?.map(([partner]) => {
                    return {
                        spouse: getPersonData(partner),
                        children: childrenPerPartner.get(partner)?.map(child => {
                            return parsePerson(child);
                        }),
                    }
                }),
            };
        } else {
            const children = person.children.filter(child => child.father === person || child.mother === person);
            return {
                ...getPersonData(person),
                children: children?.map(child => {
                    return parsePerson(child);
                }),
            };
        }
    }

    function getPersonData(person: IPerson) {
        return {
            name: `${person.firstName}-${person.lastName}`,
            class: `node ${person.sex}`,
            extra: {
                firstName: person.firstName ? person.firstName : '?',
                lastName: person.lastName ? person.lastName : '?',
                birthDate: person.birth ? person.birth.date : '',
                deathDate: person.death ? person.death.date : '',
            }
        };
    }

    return (
        <div className="App">
            <h1>Stamboom</h1>
            {!selectedPerson && <p>Voer een naam in om te zoeken</p>}
            <form>
                <div>
                    <label htmlFor='person1'>Persoon: </label>
                    <input
                        type='text'
                        id='person'
                        placeholder='Naam van persoon'
                        value={personName}
                        onChange={(e) => { handleAutocomplete(e, setPersonName) }}
                        list='person1-options'
                    />
                    <datalist id='person1-options'>
                        {persons.persons
                            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                            .map((person) => (
                                <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                            ))}
                    </datalist>
                </div>
                {personName && <button type="button">Zoeken</button>}
                <button type="button" onClick={() => resetStates()}>Reset</button>
            </form>
            <div id='tree'></div>
        </div>
    );
}

export default Tree;