import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dTree from '../dtree.js';
import '../App.css';
import { IPerson } from '../interfaces/IPersons';

function Tree({ persons, rootPerson, generations }: { persons: any, rootPerson: IPerson | undefined, generations: number | undefined }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Read ID from URL query parameters
    const initialPerson = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const urlId = params.get('id');
        if (urlId && persons?.persons) {
            const found = persons.persons.find((p: IPerson) => p.pointer === urlId);
            if (found) return found;
        }
        return rootPerson || null;
    }, [location.search, persons, rootPerson]);

    const [selectedPerson, setSelectedPerson] = useState<IPerson | null>(initialPerson);
    const [personName, setPersonName] = useState(
        initialPerson ? `${initialPerson.firstName || ''} ${initialPerson.lastName || ''} ${initialPerson.birth?.date ? `(${initialPerson.birth.date.slice(-4)})` : ''}` : ''
    );
    const [viewMode, setViewMode] = useState<'full' | 'descendants' | 'ancestors'>('full');
    const [ancestorRange, setAncestorRange] = useState<number>(3);

    // Sync selectedPerson when URL query parameters change
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlId = params.get('id');
        if (urlId && persons?.persons) {
            const found = persons.persons.find((p: IPerson) => p.pointer === urlId);
            if (found && found.pointer !== selectedPerson?.pointer) {
                setSelectedPerson(found);
                setPersonName(`${found.firstName || ''} ${found.lastName || ''} ${found.birth?.date ? `(${found.birth.date.slice(-4)})` : ''}`);
            }
        }
    }, [location.search, persons, selectedPerson]);

    const handleAutocomplete = (event: React.ChangeEvent<HTMLInputElement>, setPerson: React.Dispatch<React.SetStateAction<string>>) => {
        const value = event.target.value;
        setPerson(value);
        const found = persons.persons.find((person: IPerson) => `${person.firstName || ''} ${person.lastName || ''} ${person.birth?.date ? `(${person.birth.date.slice(-4)})` : ''}` === value);
        if (found) {
            navigate(`/stamboom?id=${found.pointer}`);
        }
    };

    const resetStates = () => {
        if (rootPerson) {
            navigate(`/stamboom?id=${rootPerson.pointer}`);
        } else {
            setPersonName('');
            setSelectedPerson(null);
            const tree = document.getElementById('tree');
            if (tree) {
                tree.innerHTML = '';
            }
        }
    };

    const getAncestors = useCallback((person: IPerson, visited = new Set<string>(), results: IPerson[] = []): IPerson[] => {
        if (!person || visited.has(person.pointer)) return results;
        visited.add(person.pointer);
        results.push(person);
        if (person.father) getAncestors(person.father, visited, results);
        if (person.mother) getAncestors(person.mother, visited, results);
        return results;
    }, []);

    const getAncestorsLimit = useCallback((person: IPerson, depth: number, maxDepth = 4, visited = new Set<string>(), results: IPerson[] = []): IPerson[] => {
        if (!person || depth > maxDepth || visited.has(person.pointer)) return results;
        visited.add(person.pointer);
        results.push(person);
        if (person.father) getAncestorsLimit(person.father, depth + 1, maxDepth, visited, results);
        if (person.mother) getAncestorsLimit(person.mother, depth + 1, maxDepth, visited, results);
        return results;
    }, []);

    // Get relationship label relative to the selected person
    const getRelationLabel = useCallback((person: IPerson): string => {
        if (!selectedPerson) return '';
        if (person.pointer === selectedPerson.pointer) return 'Geselecteerd';
        
        if (selectedPerson.father && person.pointer === selectedPerson.father.pointer) return 'Vader';
        if (selectedPerson.mother && person.pointer === selectedPerson.mother.pointer) return 'Moeder';
        
        if (selectedPerson.partners?.some(p => p && p.pointer === person.pointer)) return 'Partner';
        if (selectedPerson.children?.some(c => c && c.pointer === person.pointer)) return 'Kind';
        
        // Siblings
        const isSibling = (selectedPerson.father && selectedPerson.father.children?.some(c => c && c.pointer === person.pointer)) ||
                         (selectedPerson.mother && selectedPerson.mother.children?.some(c => c && c.pointer === person.pointer));
        if (isSibling && person.pointer !== selectedPerson.pointer) return 'Broer/Zus';

        // Grandparents
        if (selectedPerson.father?.father && person.pointer === selectedPerson.father.father.pointer) return 'Grootvader';
        if (selectedPerson.father?.mother && person.pointer === selectedPerson.father.mother.pointer) return 'Grootmoeder';
        if (selectedPerson.mother?.father && person.pointer === selectedPerson.mother.father.pointer) return 'Grootvader';
        if (selectedPerson.mother?.mother && person.pointer === selectedPerson.mother.mother.pointer) return 'Grootmoeder';

        return '';
    }, [selectedPerson]);

    const getPersonData = useCallback((person: IPerson) => {
        return {
            name: `${person.firstName || '?'}-${person.lastName || '?'}`,
            class: `node ${person.sex || 'U'} ${person.pointer === selectedPerson?.pointer ? 'selected' : ''}`,
            extra: {
                pointer: person.pointer,
                sex: person.sex,
                firstName: person.firstName ? person.firstName : '?',
                lastName: person.lastName ? person.lastName : '?',
                birthDate: person.birth ? person.birth.date : '',
                deathDate: person.death ? person.death.date : '',
                relation: getRelationLabel(person),
            }
        };
    }, [selectedPerson, getRelationLabel]);

    // Allowed set restricts tree traversal based on the chosen range to control performance and prevent duplicates
    const allowedSet = useMemo(() => {
        const allowed = new Set<string>();
        if (!selectedPerson) return allowed;

        if (viewMode === 'descendants') {
            // Immediate descendants up to ancestorRange + 1 generations down
            const maxDepth = ancestorRange + 1;
            const addDescendants = (person: IPerson, depth: number, visited = new Set<string>()) => {
                if (!person || depth > maxDepth || visited.has(person.pointer)) return;
                visited.add(person.pointer);
                allowed.add(person.pointer);
                person.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                person.children?.forEach(child => {
                    if (child) addDescendants(child, depth + 1, visited);
                });
            };
            addDescendants(selectedPerson, 1);
        } else if (viewMode === 'ancestors') {
            // Only ancestors up to ancestorRange generations back
            const processAncestors = (person: IPerson, depth: number, visited = new Set<string>()) => {
                if (!person || depth > ancestorRange || visited.has(person.pointer)) return;
                visited.add(person.pointer);
                allowed.add(person.pointer);
                if (person.father) processAncestors(person.father, depth + 1, visited);
                if (person.mother) processAncestors(person.mother, depth + 1, visited);
            };
            processAncestors(selectedPerson, 0);
        } else {
            // 'full' mode: Focused family tree centered on selectedPerson
            allowed.add(selectedPerson.pointer);
            
            selectedPerson.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
            
            // Children & Grandchildren
            const maxDescendantDepth = Math.max(2, ancestorRange);
            const addOwnDescendants = (person: IPerson, depth: number) => {
                if (!person || depth > maxDescendantDepth) return;
                allowed.add(person.pointer);
                person.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                person.children?.forEach(child => {
                    if (child) addOwnDescendants(child, depth + 1);
                });
            };
            addOwnDescendants(selectedPerson, 1);

            // Siblings
            const addSiblings = (parent: IPerson | undefined) => {
                if (!parent) return;
                parent.children?.forEach(sib => {
                    if (sib) {
                        allowed.add(sib.pointer);
                        sib.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                    }
                });
            };
            addSiblings(selectedPerson.father);
            addSiblings(selectedPerson.mother);

            // Parents and Aunts/Uncles (up to ancestorRange)
            const addParentsAndUncles = (parent: IPerson | undefined, depth: number) => {
                if (!parent || depth > ancestorRange) return;
                allowed.add(parent.pointer);
                parent.partners?.forEach(p => { if (p) allowed.add(p.pointer); });

                // Grandparents
                const gp1 = parent.father;
                const gp2 = parent.mother;
                if (gp1) {
                    allowed.add(gp1.pointer);
                    gp1.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                    gp1.children?.forEach(uncle => {
                        if (uncle) {
                            allowed.add(uncle.pointer);
                            uncle.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                        }
                    });
                }
                if (gp2) {
                    allowed.add(gp2.pointer);
                    gp2.partners?.forEach(p => { if (p) allowed.add(p.pointer); });
                }

                if (parent.father) addParentsAndUncles(parent.father, depth + 1);
                if (parent.mother) addParentsAndUncles(parent.mother, depth + 1);
            };
            addParentsAndUncles(selectedPerson.father, 1);
            addParentsAndUncles(selectedPerson.mother, 1);
        }

        return allowed;
    }, [selectedPerson, viewMode, ancestorRange]);

    // Parse person for descendants & full view modes (Top-Down tree starting from roots)
    const parsePerson = useCallback((person: IPerson, allowedSet: Set<string>, renderedMarriages: Set<string>, visitedNodes = new Set<string>()): any => {
        if (visitedNodes.has(person.pointer)) {
            return {
                ...getPersonData(person),
                children: []
            };
        }
        visitedNodes.add(person.pointer);

        const childrenPerPartner = new Map<string, { partner: IPerson | null, children: IPerson[] }>();

        if (person.partners && person.partners.length > 0) {
            person.partners.forEach(partner => {
                if (partner && allowedSet.has(partner.pointer)) {
                    childrenPerPartner.set(partner.pointer, { partner, children: [] });
                }
            });
        }

        const singleParentChildren: IPerson[] = [];

        person.children.forEach(child => {
            if (child && allowedSet.has(child.pointer)) {
                const otherParent = child.father?.pointer === person.pointer ? child.mother : child.father;
                if (otherParent && childrenPerPartner.has(otherParent.pointer)) {
                    childrenPerPartner.get(otherParent.pointer)!.children.push(child);
                } else {
                    singleParentChildren.push(child);
                }
            }
        });

        const marriages: any[] = [];
        childrenPerPartner.forEach(({ partner, children }) => {
            const partnerData = getPersonData(partner!);

            // Multi-root DAG de-duplication:
            // Check if this marriage was already rendered elsewhere (e.g. through the other parent's tree)
            const marriageKey = [person.pointer, partner.pointer].sort().join('_');
            if (renderedMarriages.has(marriageKey)) {
                marriages.push({
                    spouse: partnerData,
                    children: []
                });
            } else {
                renderedMarriages.add(marriageKey);
                marriages.push({
                    spouse: partnerData,
                    children: children.map(child => parsePerson(child, allowedSet, renderedMarriages, visitedNodes))
                });
            }
        });

        if (singleParentChildren.length > 0) {
            marriages.push({
                spouse: {
                    name: '?',
                    class: 'node unknown',
                    extra: { firstName: 'Onbekend', lastName: '', birthDate: '', deathDate: '', relation: 'Partner' }
                },
                children: singleParentChildren.map(child => parsePerson(child, allowedSet, renderedMarriages, visitedNodes))
            });
        }

        if (marriages.length > 0) {
            return {
                ...getPersonData(person),
                marriages
            };
        } else {
            return {
                ...getPersonData(person),
                children: []
            };
        }
    }, [getPersonData]);

    // Parse person for ancestors view mode (Top-Down tree showing ancestors branching down to selectedPerson)
    const parseAncestor = useCallback((person: IPerson, visitedNodes = new Set<string>()): any => {
        if (visitedNodes.has(person.pointer)) {
            return {
                ...getPersonData(person),
                children: []
            };
        }
        visitedNodes.add(person.pointer);

        const children: any[] = [];
        
        if (person.father && allowedSet.has(person.father.pointer)) {
            const fatherData = parseAncestor(person.father, visitedNodes);
            children.push(fatherData);
        }
        
        if (person.mother && allowedSet.has(person.mother.pointer)) {
            const motherData = parseAncestor(person.mother, visitedNodes);
            children.push(motherData);
        }

        return {
            ...getPersonData(person),
            children
        };
    }, [getPersonData, allowedSet]);

    useEffect(() => {
        if (!persons || !selectedPerson || allowedSet.size === 0) return;

        const target = document.getElementById('tree');
        if (target) {
            target.innerHTML = '';
        }

        let treeData: any[] = [];
        const visitedNodes = new Set<string>();
        const renderedMarriages = new Set<string>();

        if (viewMode === 'ancestors') {
            const rootData = parseAncestor(selectedPerson, visitedNodes);
            treeData = [rootData];
        } else if (viewMode === 'descendants') {
            const rootData = parsePerson(selectedPerson, allowedSet, renderedMarriages, visitedNodes);
            treeData = [rootData];
        } else {
            const ancestorList = getAncestorsLimit(selectedPerson, 1, ancestorRange);
            const focusedAncestors = ancestorList.filter(p => allowedSet.has(p.pointer));
            const focusedAncestorSet = new Set(focusedAncestors.map(p => p.pointer));

            const roots = focusedAncestors.filter(person => {
                const hasFather = person.father && focusedAncestorSet.has(person.father.pointer);
                const hasMother = person.mother && focusedAncestorSet.has(person.mother.pointer);
                return !hasFather && !hasMother;
            });

            const standaloneRoots: IPerson[] = [];
            const spouseSet = new Set<string>();

            roots.forEach(person => {
                if (!spouseSet.has(person.pointer)) {
                    standaloneRoots.push(person);
                    if (person.partners) {
                        person.partners.forEach(partner => {
                            if (partner) spouseSet.add(partner.pointer);
                        });
                    }
                }
            });

            const parsedRoots = standaloneRoots.map(person => parsePerson(person, allowedSet, renderedMarriages, visitedNodes));

            const dummyRoot = {
                name: 'Voorouders',
                class: 'node dummy-root',
                extra: {
                    pointer: 'dummy',
                    firstName: 'Voorouders van',
                    lastName: selectedPerson.firstName + ' ' + (selectedPerson.lastName || ''),
                    sex: 'U',
                    relation: 'Stamboom',
                    birthDate: '',
                    deathDate: ''
                },
                marriages: [
                    {
                        spouse: {
                            name: 'hidden-spouse',
                            class: 'node hidden',
                            hidden: true,
                            extra: { firstName: '', lastName: '', birthDate: '', deathDate: '' }
                        },
                        children: parsedRoots
                    }
                ]
            };

            treeData = [dummyRoot];
        }

        dTree.init(treeData, {
            target: '#tree',
            debug: false,
            height: window.innerHeight - 275,
            width: window.innerWidth - 100,
            nodeWidth: 160,
            callbacks: {
                nodeClick: function (name, extra) {
                    if (extra && extra.pointer && extra.pointer !== 'dummy') {
                        navigate(`/stamboom?id=${extra.pointer}`);
                    }
                },
                textRenderer: function (name, extra) {
                    if (extra) {
                        const isDummy = extra.pointer === 'dummy';
                        const isMale = extra.sex === 'M';
                        const isSelected = extra.pointer === selectedPerson?.pointer;
                        
                        let borderStyle = '1px solid #e2e8f0';
                        let shadowStyle = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
                        let genderColor = isDummy ? '#cbd5e1' : (isMale ? '#87CEEB' : '#FFB6C1');
                        
                        if (isSelected) {
                            borderStyle = '2px solid #f97316';
                            shadowStyle = '0 10px 25px -5px rgba(249, 115, 22, 0.4), 0 8px 10px -6px rgba(249, 115, 22, 0.4)';
                            genderColor = '#f97316';
                        }
                        
                        return `
                          <div style="
                            display: flex;
                            flex-direction: column;
                            padding: 8px 12px;
                            background-color: #ffffff;
                            border: ${borderStyle};
                            border-radius: 8px;
                            box-shadow: ${shadowStyle};
                            width: 100%;
                            height: 100%;
                            box-sizing: border-box;
                            position: relative;
                            overflow: hidden;
                            font-family: sans-serif;
                            justify-content: center;
                          ">
                            <div style="
                              position: absolute;
                              left: 0;
                              top: 0;
                              bottom: 0;
                              width: 5px;
                              background-color: ${genderColor};
                            "></div>
                            
                            ${extra.relation ? `
                            <span style="
                              font-size: 8px; 
                              font-weight: 700; 
                              color: ${isSelected ? '#ea580c' : '#64748b'}; 
                              text-transform: uppercase; 
                              margin-bottom: 2px; 
                              padding-left: 4px;
                              letter-spacing: 0.5px;
                            ">
                              ${extra.relation}
                            </span>` : ''}

                            <div style="font-weight: bold; font-size: 12px; color: #1e293b; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 4px;">
                              ${extra.firstName || '?'}
                            </div>
                            <div style="font-weight: 500; font-size: 11px; color: #475569; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 4px;">
                              ${extra.lastName || '?'}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; font-size: 9px; color: #64748b; padding-left: 4px; line-height: 1.2;">
                              ${extra.birthDate ? `<span>Geb: ${extra.birthDate}</span>` : ''}
                              ${extra.deathDate ? `<span>Overl: ${extra.deathDate}</span>` : ''}
                            </div>
                          </div>
                        `;
                    }
                    return '';
                },
            },
        });
    }, [selectedPerson, persons, getAncestors, getAncestorsLimit, parsePerson, parseAncestor, allowedSet, viewMode, ancestorRange, navigate]);

    return (
        <div className="App" style={{ marginTop: '80px', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#2B4162', marginBottom: '20px' }}>Stamboom</h1>
            
            <form onSubmit={(e) => e.preventDefault()} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type='text'
                        id='person'
                        placeholder='Naam van persoon'
                        value={personName}
                        onChange={(e) => { handleAutocomplete(e, setPersonName) }}
                        list='person1-options'
                        style={{
                            padding: '10px 15px',
                            borderRadius: '20px',
                            border: '1px solid #cbd5e1',
                            width: '280px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    <datalist id='person1-options'>
                        {persons?.persons
                            ?.sort((a: IPerson, b: IPerson) => (a.lastName || '').localeCompare(b.lastName || ''))
                            ?.map((person: IPerson) => (
                                <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''} ${person.birth?.date ? `(${person.birth.date.slice(-4)})` : ''}`} />
                            ))}
                    </datalist>
                </div>
                <button 
                    type="button" 
                    onClick={() => resetStates()}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        backgroundColor: '#2B4162',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Reset naar Root
                </button>
            </form>

            {selectedPerson && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    {/* Parents Navigation */}
                    {(selectedPerson.father || selectedPerson.mother) && (
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            backgroundColor: '#f1f5f9',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px'
                        }}>
                            <span style={{ fontWeight: 600, color: '#475569' }}>Ouders:</span>
                            {selectedPerson.father && (
                                <button
                                    onClick={() => {
                                        navigate(`/stamboom?id=${selectedPerson.father!.pointer}`);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        color: '#2B4162',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {selectedPerson.father.firstName} (Vader)
                                </button>
                            )}
                            {selectedPerson.father && selectedPerson.mother && <span style={{ color: '#cbd5e1' }}>|</span>}
                            {selectedPerson.mother && (
                                <button
                                    onClick={() => {
                                        navigate(`/stamboom?id=${selectedPerson.mother!.pointer}`);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        color: '#2B4162',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {selectedPerson.mother.firstName} (Moeder)
                                </button>
                            )}
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        backgroundColor: '#e2e8f0',
                        padding: '3px',
                        borderRadius: '20px'
                    }}>
                        <button
                            onClick={() => setViewMode('full')}
                            style={{
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '17px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backgroundColor: viewMode === 'full' ? '#2B4162' : 'transparent',
                                color: viewMode === 'full' ? 'white' : '#475569',
                                transition: 'all 0.2s'
                            }}
                        >
                            Volledig (Full)
                        </button>
                        <button
                            onClick={() => setViewMode('descendants')}
                            style={{
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '17px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backgroundColor: viewMode === 'descendants' ? '#2B4162' : 'transparent',
                                color: viewMode === 'descendants' ? 'white' : '#475569',
                                transition: 'all 0.2s'
                            }}
                        >
                            Nakomelingen
                        </button>
                        <button
                            onClick={() => setViewMode('ancestors')}
                            style={{
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '17px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backgroundColor: viewMode === 'ancestors' ? '#2B4162' : 'transparent',
                                color: viewMode === 'ancestors' ? 'white' : '#475569',
                                transition: 'all 0.2s'
                            }}
                        >
                            Voorouders
                        </button>
                    </div>

                    {/* Generation Range Slider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#f1f5f9',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px'
                    }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>Generaties:</span>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={ancestorRange}
                            onChange={(e) => setAncestorRange(Number(e.target.value))}
                            style={{
                                cursor: 'pointer',
                                width: '80px',
                                accentColor: '#2B4162'
                            }}
                        />
                        <span style={{ fontWeight: '600', color: '#2B4162', minWidth: '15px' }}>{ancestorRange}</span>
                    </div>
                </div>
            )}

            <div id='tree' style={{ border: '1px solid #e2e8f0', borderRadius: '12px', margin: '0 20px', backgroundColor: '#f8fafc', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}></div>
        </div>
    );
}

export default Tree;