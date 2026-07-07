import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { IPerson, IPersons } from '../interfaces/IPersons';
import { Link, useSearchParams } from 'react-router-dom';
import { getYearSafe, formatDate } from '../utils/dateUtils';

interface IMrcaGroup {
    parent1: IPerson;
    parent2: IPerson | null;
    path1: IPerson[];
    path2: IPerson[];
    l1: number;
    l2: number;
    degree: number;
    relName: string;
}

const getYearStr = (p: IPerson) => {
    const y = getYearSafe(p.birth?.date) || getYearSafe(p.christening?.date);
    return isNaN(y) ? '' : ` (${y < 0 ? Math.abs(y) + ' v.Chr.' : y})`;
};

const getRelationshipName = (l1: number, l2: number, sex1: string | null, sex2: string | null): string => {
    if (l1 === 0 && l2 === 0) return 'Zelfde persoon';
    if (l1 === 1 && l2 === 0) return sex1 === 'M' ? 'Vader' : sex1 === 'F' ? 'Moeder' : 'Ouder';
    if (l1 === 0 && l2 === 1) return sex1 === 'M' ? 'Zoon' : sex1 === 'F' ? 'Dochter' : 'Kind';
    
    if (l1 === 2 && l2 === 0) return sex1 === 'M' ? 'Grootvader' : sex1 === 'F' ? 'Grootmoeder' : 'Grootouder';
    if (l1 === 0 && l2 === 2) return sex1 === 'M' ? 'Kleinzoon' : sex1 === 'F' ? 'Kleindochter' : 'Kleinkind';
    
    if (l1 > 2 && l2 === 0) {
        const prefix = 'over'.repeat(l1 - 2);
        return sex1 === 'M' ? `${prefix}grootvader` : sex1 === 'F' ? `${prefix}grootmoeder` : `${prefix}grootouder`;
    }
    if (l1 === 0 && l2 > 2) {
        const prefix = 'over'.repeat(l2 - 2);
        return sex1 === 'M' ? `${prefix}kleinzoon` : sex1 === 'F' ? `${prefix}kleindochter` : `${prefix}kleinkind`;
    }
    
    // Collateral relations
    if (l1 === 1 && l2 === 1) return sex1 === 'M' ? 'Broer' : sex1 === 'F' ? 'Zus' : 'Broer / Zus';
    
    if (l1 === 2 && l2 === 1) return sex1 === 'M' ? 'Oom' : sex1 === 'F' ? 'Tante' : 'Oom / Tante';
    if (l1 === 1 && l2 === 2) return sex1 === 'M' ? 'Neef (oomzegger)' : sex1 === 'F' ? 'Nicht (tantezegger)' : 'Neef / Nicht';
    
    if (l1 === 3 && l2 === 1) return sex1 === 'M' ? 'Oudoom' : sex1 === 'F' ? 'Oudtante' : 'Oudoom / Oudtante';
    if (l1 === 1 && l2 === 3) return sex1 === 'M' ? 'Oudneef' : sex1 === 'F' ? 'Oudnicht' : 'Oudneef / Oudnicht';
    
    if (l1 === 2 && l2 === 2) return sex1 === 'M' ? 'Volle neef' : sex1 === 'F' ? 'Volle nicht' : 'Volle neef / nicht';
    if (l1 === 3 && l2 === 3) return sex1 === 'M' ? 'Tweede neef (achterneef)' : sex1 === 'F' ? 'Tweede nicht (achternicht)' : 'Tweede neef / nicht (achterneef)';
    
    // Fallback: general degree calculation
    const degree = l1 + l2;
    return `bloedverwant in de ${degree}e graad (voorouder ${l1} generaties terug voor P1, ${l2} voor P2)`;
};

function Connections({ persons }: { persons: IPersons }) {
    const [searchParams, setSearchParams] = useSearchParams();

    const personsList: IPerson[] = useMemo(() => {
        if (!persons?.persons) return [];
        return persons.persons.filter(
            (p) => p.firstName && p.lastName && p.firstName !== '?' && p.lastName !== '?' && p.firstName !== '(?)' && p.lastName !== '(?)' && p.lastName !== '...'
        );
    }, [persons]);

    const [person1Name, setPerson1Name] = useState('');
    const [person2Name, setPerson2Name] = useState('');
    const [person1, setPerson1] = useState<IPerson | null>(null);
    const [person2, setPerson2] = useState<IPerson | null>(null);
    const [mrcaGroups, setMrcaGroups] = useState<IMrcaGroup[]>([]);
    const [selectedMrcaIndex, setSelectedMrcaIndex] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);


    // DFS to retrieve all ancestors
    const getAncestors = useCallback((person: IPerson, visited = new Set<string>(), list: IPerson[] = []): IPerson[] => {
        if (!person || visited.has(person.pointer || '')) return list;
        visited.add(person.pointer || '');
        list.push(person);
        if (person.father) getAncestors(person.father, visited, list);
        if (person.mother) getAncestors(person.mother, visited, list);
        return list;
    }, []);

    // BFS to find the shortest lineage path (ancestor to person, inclusive)
    const findPathFromAncestor = useCallback((ancestor: IPerson, targetPerson: IPerson): IPerson[] | null => {
        const queue: { current: IPerson; path: IPerson[] }[] = [{ current: targetPerson, path: [targetPerson] }];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const { current, path } = queue.shift()!;
            if (!current.pointer || visited.has(current.pointer)) continue;
            visited.add(current.pointer);

            if (current.pointer === ancestor.pointer) {
                return path.reverse(); // returns [ancestor, ..., targetPerson]
            }

            if (current.father) {
                queue.push({ current: current.father, path: [...path, current.father] });
            }
            if (current.mother) {
                queue.push({ current: current.mother, path: [...path, current.mother] });
            }
        }
        return null;
    }, []);

    // Effect to sync search from URL parameters
    useEffect(() => {
        if (!personsList.length) return;

        const p1Pointer = searchParams.get('p1');
        const p2Pointer = searchParams.get('p2');
        const mrcaParam = searchParams.get('mrca');

        if (p1Pointer && p2Pointer) {
            const p1Obj = personsList.find(p => p.pointer === p1Pointer);
            const p2Obj = personsList.find(p => p.pointer === p2Pointer);

            if (p1Obj && p2Obj) {
                setPerson1(p1Obj);
                setPerson2(p2Obj);
                setPerson1Name(`${p1Obj.firstName || ''} ${p1Obj.lastName || ''}${getYearStr(p1Obj)}`);
                setPerson2Name(`${p2Obj.firstName || ''} ${p2Obj.lastName || ''}${getYearStr(p2Obj)}`);

                const p1Ancestors = getAncestors(p1Obj);
                const p2Ancestors = getAncestors(p2Obj);

                const p2AncestorSet = new Set(p2Ancestors.map(a => a.pointer));
                const common = p1Ancestors.filter(a => p2AncestorSet.has(a.pointer));
                const commonSet = new Set(common.map(a => a.pointer || ''));

                if (common.length > 0) {
                    const mrcas = common.filter(anc => {
                        return !anc.children || !anc.children.some(child => commonSet.has(child.pointer || ''));
                    });

                    const groups: IMrcaGroup[] = [];
                    const groupedPointers = new Set<string>();

                    mrcas.forEach(person => {
                        if (groupedPointers.has(person.pointer || '')) return;

                        const partner = person.partners?.find(p => p && mrcas.some(m => m.pointer === p.pointer));
                        const path1 = findPathFromAncestor(person, p1Obj);
                        const path2 = findPathFromAncestor(person, p2Obj);

                        if (path1 && path2) {
                            const l1 = path1.length - 1;
                            const l2 = path2.length - 1;
                            const degree = l1 + l2;
                            const relName = getRelationshipName(l1, l2, p1Obj.sex, p2Obj.sex);

                            if (partner) {
                                groups.push({ 
                                    parent1: person, 
                                    parent2: partner,
                                    path1,
                                    path2,
                                    l1,
                                    l2,
                                    degree,
                                    relName
                                });
                                groupedPointers.add(person.pointer || '');
                                groupedPointers.add(partner.pointer || '');
                            } else {
                                groups.push({ 
                                    parent1: person, 
                                    parent2: null,
                                    path1,
                                    path2,
                                    l1,
                                    l2,
                                    degree,
                                    relName
                                });
                                groupedPointers.add(person.pointer || '');
                            }
                        }
                    });

                    groups.sort((a, b) => a.degree - b.degree);
                    setMrcaGroups(groups);
                    
                    const mrcaIdx = mrcaParam !== null && !isNaN(Number(mrcaParam)) ? Number(mrcaParam) : 0;
                    setSelectedMrcaIndex(mrcaIdx < groups.length ? mrcaIdx : 0);
                    setSubmitted(true);
                } else {
                    setMrcaGroups([]);
                    setSelectedMrcaIndex(null);
                    setSubmitted(true);
                }
            }
        } else {
            setPerson1(null);
            setPerson2(null);
            setMrcaGroups([]);
            setSelectedMrcaIndex(null);
            setSubmitted(false);
        }
    }, [searchParams, personsList, getAncestors, findPathFromAncestor]);

    const handleSearchSubmit = () => {
        const p1Obj = personsList.find((p) => `${p.firstName} ${p.lastName}${getYearStr(p)}` === person1Name);
        const p2Obj = personsList.find((p) => `${p.firstName} ${p.lastName}${getYearStr(p)}` === person2Name);
        if (!p1Obj || !p2Obj) return;

        setSearchParams({
            p1: p1Obj.pointer,
            p2: p2Obj.pointer,
            mrca: '0'
        });
    };

    const handleSelectMrca = (idx: number) => {
        const p1Pointer = searchParams.get('p1') || '';
        const p2Pointer = searchParams.get('p2') || '';
        setSearchParams({
            p1: p1Pointer,
            p2: p2Pointer,
            mrca: String(idx)
        });
    };

    const resetStates = () => {
        setPerson1Name('');
        setPerson2Name('');
        setSearchParams({});
    };

    // Compute stats of common lines by direct parent combination
    const parentComboStats = useMemo(() => {
        let vv = 0; // Father - Father
        let vm = 0; // Father - Mother / Mother - Father
        let mm = 0; // Mother - Mother

        mrcaGroups.forEach(group => {
            const p1Parent = group.path1.length >= 2 ? group.path1[group.path1.length - 2] : null;
            const p2Parent = group.path2.length >= 2 ? group.path2[group.path2.length - 2] : null;

            const r1 = p1Parent ? (p1Parent.sex === 'M' ? 'Vader' : 'Moeder') : 'Vader';
            const r2 = p2Parent ? (p2Parent.sex === 'M' ? 'Vader' : 'Moeder') : 'Vader';

            if (r1 === 'Vader' && r2 === 'Vader') vv++;
            else if (r1 === 'Moeder' && r2 === 'Moeder') mm++;
            else vm++;
        });

        return { vv, vm, mm };
    }, [mrcaGroups]);

    // Compute details for the active group
    const activePathDetails = useMemo(() => {
        if (selectedMrcaIndex === null || mrcaGroups.length === 0) return null;
        return mrcaGroups[selectedMrcaIndex];
    }, [selectedMrcaIndex, mrcaGroups]);

    return (
        <div className="page-container" style={{ maxWidth: '1000px' }}>
            <h1 className="page-title">Connecties & Bloedverwantschap</h1>
            <p className="page-subtitle">Vind de gemeenschappelijke voorouders en traceer de exacte familietijdlijn tussen twee personen.</p>

            {/* Inputs Form */}
            <div className="card" style={{ marginBottom: '30px', padding: '30px' }}>
                <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor='person1' style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Eerste persoon</label>
                            <input
                                type='text'
                                id='person1'
                                placeholder='Type om te zoeken...'
                                value={person1Name}
                                onChange={(e) => setPerson1Name(e.target.value)}
                                list='person1-options'
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <datalist id='person1-options'>
                                {personsList
                                    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                                    .map((person) => (
                                        <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''}${getYearStr(person)}`} />
                                    ))}
                            </datalist>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor='person2' style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tweede persoon</label>
                            <input
                                type='text'
                                id='person2'
                                placeholder='Type om te zoeken...'
                                value={person2Name}
                                onChange={(e) => setPerson2Name(e.target.value)}
                                list='person2-options'
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <datalist id='person2-options'>
                                {personsList
                                    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''))
                                    .map((person) => (
                                        <option key={person.pointer} value={`${person.firstName || ''} ${person.lastName || ''}${getYearStr(person)}`} />
                                    ))}
                            </datalist>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        {person1Name && person2Name && (
                            <button 
                                type="submit" 
                                style={{
                                    padding: '11px 26px',
                                    borderRadius: '24px',
                                    background: 'var(--primary-gradient)',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    border: 'none',
                                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                            >
                                Connectie Zoeken
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={resetStates}
                            style={{
                                padding: '11px 26px',
                                borderRadius: '24px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--card-bg)',
                                color: 'var(--text-secondary)',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Results section */}
            {submitted && (
                <div>
                    {mrcaGroups.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {/* Summary relations banner */}
                            {activePathDetails && (
                                <div className="card" style={{ 
                                    padding: '24px 30px', 
                                    borderLeft: '5px solid var(--primary-color)',
                                    background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.02) 0%, rgba(255, 255, 255, 0) 100%)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '15px'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                            Vastgestelde Relatie
                                        </span>
                                        <h2 style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                            <span style={{ color: 'var(--primary-color)' }}>{person1?.firstName} {person1?.lastName}</span> is de <span style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>{activePathDetails.relName.toLowerCase()}</span> van <span style={{ color: 'var(--primary-color)' }}>{person2?.firstName} {person2?.lastName}</span>
                                        </h2>
                                    </div>
                                    <div style={{ display: 'flex', gap: '25px', paddingRight: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Graad</span>
                                            <span style={{ fontSize: '20px', fontWeight: '800' }}>{activePathDetails.degree}e graad</span>
                                        </div>
                                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '25px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Generatieverschil</span>
                                            <span style={{ fontSize: '20px', fontWeight: '800' }}>{Math.abs(activePathDetails.l1 - activePathDetails.l2)} generatie(s)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Parent combination stats for common lines */}
                            <div className="card" style={{ padding: '24px 30px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                                    Lijn-Verdeling over Ouder-Combinaties
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                    <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Vader ↔ Vader</span>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--male-color)', marginTop: '6px' }}>{parentComboStats.vv}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>lijn(en)</span>
                                    </div>
                                    <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Vader ↔ Moeder</span>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)', marginTop: '6px' }}>{parentComboStats.vm}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>lijn(en)</span>
                                    </div>
                                    <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Moeder ↔ Moeder</span>
                                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--female-color)', marginTop: '6px' }}>{parentComboStats.mm}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>lijn(en)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ancestors selector tabs */}
                            {mrcaGroups.length > 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', paddingLeft: '4px' }}>
                                        Gemeenschappelijke lijnen ({mrcaGroups.length}) - gesorteerd op graad
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {mrcaGroups.map((group, idx) => {
                                            const active = selectedMrcaIndex === idx;
                                            return (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => handleSelectMrca(idx)} 
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderRadius: '20px',
                                                        border: `1px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                                        backgroundColor: active ? 'rgba(79, 70, 229, 0.06)' : 'var(--card-bg)',
                                                        color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        fontFamily: 'inherit',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    👑 {group.parent1.firstName} {group.parent2 ? `& ${group.parent2.firstName}` : ''} ({group.degree}e graad)
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Lineage Visual Flowchart */}
                            {activePathDetails && (
                                <div className="card" style={{ padding: '40px 30px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                            Gemeenschappelijke Voorouder(s)
                                        </span>
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            gap: '12px', 
                                            backgroundColor: 'var(--bg-color)', 
                                            padding: '16px 24px', 
                                            borderRadius: '20px', 
                                            border: '1px dashed var(--primary-color)',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <Link to={`/personen/${activePathDetails.parent1.pointer}`} style={{ fontWeight: '800', fontSize: '15px', color: 'var(--primary-color)', textDecoration: 'none', display: 'block' }}>
                                                    👨 {activePathDetails.parent1.firstName} {activePathDetails.parent1.lastName}
                                                </Link>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {formatDate(activePathDetails.parent1.birth?.date) || '?'} – {formatDate(activePathDetails.parent1.death?.date) || '?'}
                                                </span>
                                            </div>
                                            {activePathDetails.parent2 && (
                                                <>
                                                    <div style={{ borderLeft: '1px solid var(--border-color)', alignSelf: 'stretch' }} />
                                                    <div style={{ textAlign: 'center' }}>
                                                        <Link to={`/personen/${activePathDetails.parent2.pointer}`} style={{ fontWeight: '800', fontSize: '15px', color: 'var(--primary-color)', textDecoration: 'none', display: 'block' }}>
                                                            👩 {activePathDetails.parent2.pointer === 'dummy' ? 'Onbekend' : `${activePathDetails.parent2.firstName} ${activePathDetails.parent2.lastName}`}
                                                        </Link>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                            {formatDate(activePathDetails.parent2.birth?.date) || '?'} – {formatDate(activePathDetails.parent2.death?.date) || '?'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lineage trees side-by-side */}
                                    <div className="flowchart-grid">
                                        {/* Center divider line */}
                                        <div className="flowchart-divider" style={{ 
                                            position: 'absolute', 
                                            top: '0', 
                                            bottom: '0', 
                                            left: '50%', 
                                            borderLeft: '2px dashed var(--border-color)', 
                                            transform: 'translateX(-50%)',
                                            pointerEvents: 'none'
                                        }} />

                                        {/* Lineage Path to Person 1 */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 1 }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>
                                                Lijn naar {person1!.firstName}
                                            </h4>
                                            {activePathDetails.path1.map((p, idx) => {
                                                const isEnd = idx === activePathDetails.path1.length - 1;
                                                const isMale = p.sex === 'M';
                                                const boxColor = isEnd ? 'rgba(79, 70, 229, 0.05)' : 'var(--card-bg)';
                                                const borderColor = isEnd ? 'var(--primary-color)' : 'var(--border-color)';
                                                
                                                return (
                                                    <React.Fragment key={p.pointer || idx}>
                                                        {idx > 0 && <span style={{ fontSize: '16px', color: 'var(--border-color)' }}>↓</span>}
                                                        <div style={{
                                                            width: '100%',
                                                            maxWidth: '280px',
                                                            backgroundColor: boxColor,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: '16px',
                                                            padding: '12px 16px',
                                                            boxShadow: 'var(--shadow-sm)',
                                                            textAlign: 'center',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <Link to={`/personen/${p.pointer}`} style={{ 
                                                                fontWeight: '800', 
                                                                fontSize: '13px', 
                                                                color: isMale ? 'var(--male-color)' : 'var(--female-color)', 
                                                                textDecoration: 'none' 
                                                            }}>
                                                                {p.firstName} {p.lastName}
                                                            </Link>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                {getYearSafe(p.birth?.date) ? (getYearSafe(p.birth.date) < 0 ? `${Math.abs(getYearSafe(p.birth.date))} v.Chr.` : getYearSafe(p.birth.date)) : '?'} 
                                                                {idx > 0 && ` (generatie ${idx})`}
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>

                                        {/* Lineage Path to Person 2 */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 1 }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>
                                                Lijn naar {person2!.firstName}
                                            </h4>
                                            {activePathDetails.path2.map((p, idx) => {
                                                const isEnd = idx === activePathDetails.path2.length - 1;
                                                const isMale = p.sex === 'M';
                                                const boxColor = isEnd ? 'rgba(79, 70, 229, 0.05)' : 'var(--card-bg)';
                                                const borderColor = isEnd ? 'var(--primary-color)' : 'var(--border-color)';

                                                return (
                                                    <React.Fragment key={p.pointer || idx}>
                                                        {idx > 0 && <span style={{ fontSize: '16px', color: 'var(--border-color)' }}>↓</span>}
                                                        <div style={{
                                                            width: '100%',
                                                            maxWidth: '280px',
                                                            backgroundColor: boxColor,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: '16px',
                                                            padding: '12px 16px',
                                                            boxShadow: 'var(--shadow-sm)',
                                                            textAlign: 'center',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <Link to={`/personen/${p.pointer}`} style={{ 
                                                                fontWeight: '800', 
                                                                fontSize: '13px', 
                                                                color: isMale ? 'var(--male-color)' : 'var(--female-color)', 
                                                                textDecoration: 'none' 
                                                            }}>
                                                                {p.firstName} {p.lastName}
                                                            </Link>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                {getYearSafe(p.birth?.date) ? (getYearSafe(p.birth.date) < 0 ? `${Math.abs(getYearSafe(p.birth.date))} v.Chr.` : getYearSafe(p.birth.date)) : '?'}
                                                                {idx > 0 && ` (generatie ${idx})`}
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '30px' }}>🔍</span>
                            <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', fontSize: '14px' }}>
                                Geen gemeenschappelijke voorouders gevonden tussen deze twee personen.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Connections;