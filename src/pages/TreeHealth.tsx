import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IPerson, IPersons } from '../interfaces/IPersons';
import { getYearSafe, parseDateToNumber, dateToDays } from '../utils/dateUtils';

// ─── Cycle detector (O(N) single-pass DFS) ────────────────────────────────────

function detectAllCycles(persons: IPerson[]): Set<string> {
    const cyclePointers = new Set<string>();
    const globalVisited = new Set<string>();
    const personMap = new Map<string, IPerson>();
    persons.forEach(p => { if (p.pointer) personMap.set(p.pointer, p); });

    const hasCycle = (start: string): boolean => {
        const stack: { pointer: string; inPath: Set<string> }[] = [
            { pointer: start, inPath: new Set() },
        ];
        while (stack.length > 0) {
            const { pointer, inPath } = stack.pop()!;
            if (!pointer || globalVisited.has(pointer)) continue;
            if (inPath.has(pointer)) return true;
            const path = new Set(inPath);
            path.add(pointer);
            globalVisited.add(pointer);
            const p = personMap.get(pointer);
            if (!p) continue;
            if (p.father?.pointer) stack.push({ pointer: p.father.pointer, inPath: path });
            if (p.mother?.pointer) stack.push({ pointer: p.mother.pointer, inPath: path });
        }
        return false;
    };

    persons.forEach(p => {
        if (!p.pointer || globalVisited.has(p.pointer)) return;
        if (hasCycle(p.pointer)) cyclePointers.add(p.pointer);
    });
    return cyclePointers;
}

// ─── Severity / Category style maps ───────────────────────────────────────────

const SEV_STYLE: Record<Severity, { bg: string; color: string; border: string; label: string; icon: string }> = {
    error:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Fout',         icon: '❌' },
    warning: { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa', label: 'Waarschuwing', icon: '⚠️' },
    info:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Info',         icon: 'ℹ️' },
};

const CAT_ICONS: Record<Category, string> = {
    'Levensduur':           '⏳',
    'Ouderleeftijd':        '👶',
    'Datumfouten':          '📅',
    'Gezinsrelaties':       '👨‍👩‍👧',
    'Gegevensvolledigheid': '📋',
};

const CURRENT_YEAR = new Date().getFullYear();

// ─── All audit rules ──────────────────────────────────────────────────────────

function runAudit(persons: IPerson[]): IHealthIssue[] {
    const issues: IHealthIssue[] = [];
    const cyclePointers = detectAllCycles(persons);

    persons.forEach(person => {
        const bYear = getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date);
        const dYear = getYearSafe(person.death?.date) || getYearSafe(person.burial?.date);
        const bNum = parseDateToNumber(person.birth?.date) ?? parseDateToNumber(person.christening?.date);
        const dNum = parseDateToNumber(person.death?.date);
        const burNum = parseDateToNumber(person.burial?.date);
        const doopNum = parseDateToNumber(person.christening?.date);

        const push = (
            severity: Severity,
            category: Category,
            rule: string,
            details: string
        ) => issues.push({ person, severity, category, rule, details });

        // ── LEVENSDUUR ──────────────────────────────────────────────────────
        if (!isNaN(bYear) && !isNaN(dYear) && dYear < bYear) {
            push('error', 'Levensduur', 'Negatieve levensduur',
                `Geboren ${bYear}, maar gestorven/begraven ${dYear} (${dYear - bYear} jaar verschil).`);
        }

        if (!isNaN(bYear) && !isNaN(dYear)) {
            const age = dYear - bYear;
            if (age > 110) {
                push('warning', 'Levensduur', 'Onwaarschijnlijk hoge leeftijd',
                    `Heeft ${age} jaar geleefd (${bYear}–${dYear}). Mogelijk een datumfout.`);
            }
        }

        if (!isNaN(bYear) && isNaN(dYear) && CURRENT_YEAR - bYear > 115) {
            push('warning', 'Levensduur', 'Geen overlijdensdatum — onwaarschijnlijk oud',
                `Geboren in ${bYear} (${CURRENT_YEAR - bYear} jaar geleden) zonder overlijdensdatum.`);
        }

        if (!isNaN(bYear) && isNaN(dYear) && CURRENT_YEAR - bYear > 100 && CURRENT_YEAR - bYear <= 115) {
            push('info', 'Levensduur', 'Mogelijke 100-plusser zonder overlijdensdatum',
                `Geboren in ${bYear} (${CURRENT_YEAR - bYear} jaar geleden). Is de overlijdensdatum bekend?`);
        }

        // ── DATUMFOUTEN ─────────────────────────────────────────────────────
        if (!isNaN(bYear) && bYear > CURRENT_YEAR) {
            push('error', 'Datumfouten', 'Geboortedatum in de toekomst',
                `Geboortejaar ${bYear} ligt na het huidige jaar ${CURRENT_YEAR}.`);
        }

        if (!isNaN(dYear) && dYear > CURRENT_YEAR) {
            push('error', 'Datumfouten', 'Overlijdensdatum in de toekomst',
                `Overlijdensjaar ${dYear} ligt na het huidige jaar ${CURRENT_YEAR}.`);
        }

        if (bNum !== null && dNum !== null && dNum < bNum) {
            push('error', 'Datumfouten', 'Overlijden voor geboorte (exacte datum)',
                `Overlijdensdatum (${person.death?.date}) ligt voor de geboortedatum (${person.birth?.date}).`);
        }

        if (burNum !== null && dNum !== null && burNum < dNum) {
            push('error', 'Datumfouten', 'Begrafenis voor overlijden',
                `Begrafenisdatum (${person.burial?.date}) ligt voor de overlijdensdatum (${person.death?.date}).`);
        }

        if (bNum !== null && doopNum !== null && doopNum < bNum) {
            push('error', 'Datumfouten', 'Doop voor geboorte',
                `Doopdatum (${person.christening?.date}) ligt voor de geboortedatum (${person.birth?.date}).`);
        }

        if (!isNaN(bYear) && !isNaN(dYear) && dYear === bYear) {
            push('info', 'Datumfouten', 'Geboren en gestorven in hetzelfde jaar',
                `Geboorte- en overlijdensjaar zijn beide ${bYear}. Kindersterfte of een datumfout?`);
        }

        // ── OUDERLEEFTIJD ───────────────────────────────────────────────────
        if (person.children) {
            const sortedChildren = [...person.children]
                .map(c => ({ child: c, cYear: getYearSafe(c.birth?.date) || getYearSafe(c.christening?.date) }))
                .filter(x => !isNaN(x.cYear))
                .sort((a, b) => a.cYear - b.cYear);

            sortedChildren.forEach(({ child, cYear }) => {
                if (!isNaN(bYear)) {
                    const parentAge = cYear - bYear;
                    const isMale = person.sex === 'M';
                    const isFemale = person.sex === 'F';
                    const label = isMale ? 'Vader' : 'Moeder';

                    if (isMale && parentAge < 14) {
                        push('error', 'Ouderleeftijd', 'Vader biologisch onmogelijk jong',
                            `Was slechts ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isFemale && parentAge < 13) {
                        push('error', 'Ouderleeftijd', 'Moeder biologisch onmogelijk jong',
                            `Was slechts ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isMale && parentAge < 16) {
                        push('warning', 'Ouderleeftijd', 'Vader zeer jong bij geboorte kind',
                            `${label} was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isFemale && parentAge < 15) {
                        push('warning', 'Ouderleeftijd', 'Moeder zeer jong bij geboorte kind',
                            `${label} was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    }

                    if (isMale && parentAge > 85) {
                        push('error', 'Ouderleeftijd', 'Vader biologisch onmogelijk oud',
                            `Was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isFemale && parentAge > 60) {
                        push('error', 'Ouderleeftijd', 'Moeder biologisch onmogelijk oud',
                            `Was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isMale && parentAge > 75) {
                        push('warning', 'Ouderleeftijd', 'Vader extreem oud bij geboorte kind',
                            `Was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    } else if (isFemale && parentAge > 50) {
                        push('warning', 'Ouderleeftijd', 'Moeder extreem oud bij geboorte kind',
                            `Was ${parentAge} jaar bij geboorte van ${child.firstName || '?'} (${cYear}).`);
                    }
                }

                // Child born after father's death (9+ months)
                if (!isNaN(dYear) && person.sex === 'M' && cYear > dYear + 1) {
                    push('error', 'Ouderleeftijd', 'Kind geboren meer dan een jaar na overlijden vader',
                        `Vader overleed in ${dYear}, maar ${child.firstName || '?'} werd geboren in ${cYear}.`);
                }
            });

            // Two children born less than 9 months apart (not twins)
            for (let i = 0; i < sortedChildren.length - 1; i++) {
                const a = sortedChildren[i];
                const b = sortedChildren[i + 1];
                const aDays = dateToDays(a.child.birth?.date);
                const bDays = dateToDays(b.child.birth?.date);
                if (aDays !== null && bDays !== null) {
                    const diffDays = bDays - aDays;
                    if (diffDays > 1 && diffDays < 270) {
                        push('warning', 'Ouderleeftijd', 'Twee kinderen geboren binnen 9 maanden',
                            `${a.child.firstName || '?'} (${a.child.birth?.date}) en ${b.child.firstName || '?'} (${b.child.birth?.date}) zijn te kort na elkaar geboren.`);
                    }
                } else if (a.cYear === b.cYear && a.child.pointer !== b.child.pointer) {
                    push('info', 'Ouderleeftijd', 'Twee kinderen geboren in hetzelfde jaar',
                        `${a.child.firstName || '?'} en ${b.child.firstName || '?'} zijn beide geboren in ${a.cYear}. Mogelijk tweelingen, of een datumfout.`);
                }
            }

            // Extremely large family
            if (person.children.length > 20) {
                push('warning', 'Gezinsrelaties', 'Ongewoon groot aantal kinderen',
                    `${person.children.length} kinderen geregistreerd. Controleer op duplicaten of verkeerde koppeling.`);
            }
        }

        // ── GEZINSRELATIES ──────────────────────────────────────────────────
        if (cyclePointers.has(person.pointer || '')) {
            push('error', 'Gezinsrelaties', 'Circulaire afstammingslijn',
                'Deze persoon is geregistreerd als een voorouder van zichzelf (oneindige cirkel in de boom).');
        }

        // Sibling age gap > 30 years
        if (person.siblings && person.siblings.length > 0) {
            const sibYears = [person, ...person.siblings]
                .map(s => getYearSafe(s.birth?.date) || getYearSafe(s.christening?.date))
                .filter(y => !isNaN(y));
            if (sibYears.length >= 2) {
                const minY = Math.min(...sibYears);
                const maxY = Math.max(...sibYears);
                if (maxY - minY > 30) {
                    push('info', 'Gezinsrelaties', 'Groot leeftijdsverschil tussen broers/zussen',
                        `Oudste broer/zus geboren ~${minY}, jongste ~${maxY} (${maxY - minY} jaar verschil).`);
                }
            }
        }

        // Parent born after child
        if (person.father) {
            const fBYear = getYearSafe(person.father.birth?.date) || getYearSafe(person.father.christening?.date);
            if (!isNaN(bYear) && !isNaN(fBYear) && fBYear > bYear) {
                push('error', 'Gezinsrelaties', 'Vader geboren na kind',
                    `Vader ${person.father.firstName} ${person.father.lastName} is geboren in ${fBYear}, maar het kind in ${bYear}.`);
            }
        }
        if (person.mother) {
            const mBYear = getYearSafe(person.mother.birth?.date) || getYearSafe(person.mother.christening?.date);
            if (!isNaN(bYear) && !isNaN(mBYear) && mBYear > bYear) {
                push('error', 'Gezinsrelaties', 'Moeder geboren na kind',
                    `Moeder ${person.mother.firstName} ${person.mother.lastName} is geboren in ${mBYear}, maar het kind in ${bYear}.`);
            }
        }

        // ── GEGEVENSVOLLEDIGHEID ────────────────────────────────────────────
        if (!person.firstName || person.firstName === '?' || person.firstName === '(?)') {
            push('info', 'Gegevensvolledigheid', 'Geen voornaam',
                'Voornaam is leeg, "?" of "(?)". Overweeg dit aan te vullen.');
        }

        if (!person.lastName || person.lastName === '?' || person.lastName === '...' || person.lastName === '(?)') {
            push('info', 'Gegevensvolledigheid', 'Geen achternaam',
                'Achternaam is leeg, "?" of "...". Overweeg dit aan te vullen.');
        }

        if (!person.sex || person.sex === 'U') {
            push('info', 'Gegevensvolledigheid', 'Geslacht onbekend',
                'Geen of onbekend geslacht geregistreerd. Dit beïnvloedt analyses op geslacht.');
        }

        if (isNaN(bYear)) {
            push('info', 'Gegevensvolledigheid', 'Geen geboortedatum of doopdatum',
                'Er is geen geboorte- of doopdatum geregistreerd. Voortijdig sorteren en leeftijdsberekeningen zijn niet mogelijk.');
        }

        if (!isNaN(bYear) && isNaN(dYear) && CURRENT_YEAR - bYear > 30 && CURRENT_YEAR - bYear <= 100) {
            if (!person.death && !person.burial) {
                push('info', 'Gegevensvolledigheid', 'Mogelijk ontbrekende overlijdensdatum',
                    `Geboren in ${bYear}. Als deze persoon is overleden, ontbreekt de overlijdensdatum.`);
            }
        }
    });

    return issues;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: Category[] = [
    'Levensduur', 'Ouderleeftijd', 'Datumfouten', 'Gezinsrelaties', 'Gegevensvolledigheid',
];
const ALL_SEVERITIES: Severity[] = ['error', 'warning', 'info'];

function TreeHealth({ persons }: { persons: IPersons }) {
    const [searchQuery, setSearchQuery]         = useState('');
    const [activeSeverities, setActiveSev]      = useState<Set<Severity>>(new Set(ALL_SEVERITIES));
    const [activeCategories, setActiveCat]      = useState<Set<Category>>(new Set(ALL_CATEGORIES));
    const [sortMode, setSortMode]               = useState<'severity' | 'name' | 'category'>('severity');

    const allIssues = useMemo(() => runAudit(persons.persons), [persons]);

    const errors   = allIssues.filter(i => i.severity === 'error').length;
    const warnings = allIssues.filter(i => i.severity === 'warning').length;
    const infos    = allIssues.filter(i => i.severity === 'info').length;

    const toggleSev = (s: Severity) => setActiveSev(prev => {
        const next = new Set(prev);
        next.has(s) ? next.delete(s) : next.add(s);
        return next;
    });
    const toggleCat = (c: Category) => setActiveCat(prev => {
        const next = new Set(prev);
        next.has(c) ? next.delete(c) : next.add(c);
        return next;
    });

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        let result = allIssues.filter(i =>
            activeSeverities.has(i.severity) &&
            activeCategories.has(i.category) &&
            (!q || `${i.person.firstName} ${i.person.lastName}`.toLowerCase().includes(q) || i.rule.toLowerCase().includes(q))
        );

        const sevOrder: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
        if (sortMode === 'severity') {
            result = result.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
        } else if (sortMode === 'name') {
            result = result.sort((a, b) =>
                `${a.person.lastName} ${a.person.firstName}`.localeCompare(`${b.person.lastName} ${b.person.firstName}`)
            );
        } else {
            result = result.sort((a, b) => a.category.localeCompare(b.category));
        }
        return result;
    }, [allIssues, activeSeverities, activeCategories, searchQuery, sortMode]);

    // Category breakdown counts
    const catCounts = useMemo(() => {
        const map: Record<string, number> = {};
        allIssues.forEach(i => { map[i.category] = (map[i.category] || 0) + 1; });
        return map;
    }, [allIssues]);

    const statusLabel = allIssues.length === 0 ? '✅ Perfect' : errors > 0 ? '❌ Fouten gevonden' : warnings > 0 ? '⚠️ Aandacht vereist' : 'ℹ️ Kleine opmerkingen';
    const statusColor = allIssues.length === 0 ? '#16a34a' : errors > 0 ? '#dc2626' : warnings > 0 ? '#ea580c' : '#1d4ed8';

    return (
        <div className="page-container" style={{ maxWidth: '1100px' }}>
            <h1 className="page-title">Gezondheid van de Stamboom</h1>
            <p className="page-subtitle">
                Automatische audit van logische inconsistenties, onmogelijke data en ontbrekende informatie in je GEDCOM-stamboom.
                {allIssues.length > 0 && ` ${allIssues.length} bevindingen gevonden over ${persons.persons.length} personen.`}
            </p>

            {/* Dashboard Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Status',        value: statusLabel, color: statusColor,   border: statusColor },
                    { label: 'Fouten',         value: errors,      color: '#dc2626',     border: '#ef4444' },
                    { label: 'Waarschuwingen', value: warnings,    color: '#ea580c',     border: '#f97316' },
                    { label: 'Info',           value: infos,       color: '#1d4ed8',     border: '#60a5fa' },
                    { label: 'Personen',       value: persons.persons.length, color: 'var(--text-primary)', border: '#cbd5e1' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '20px', textAlign: 'center', borderTop: `4px solid ${s.border}` }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{s.label}</span>
                        <div style={{ fontSize: typeof s.value === 'string' && s.value.length > 4 ? '15px' : '26px', margin: '6px 0 0 0', fontWeight: '800', color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Category breakdown */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '14px' }}>Bevindingen per categorie</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {ALL_CATEGORIES.map(cat => {
                        const count = catCounts[cat] || 0;
                        const active = activeCategories.has(cat);
                        return (
                            <button key={cat} onClick={() => toggleCat(cat)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', borderRadius: '20px', cursor: 'pointer',
                                border: `1px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                backgroundColor: active ? 'rgba(79,70,229,0.06)' : 'white',
                                color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', fontFamily: 'inherit', transition: 'all 0.15s',
                            }}>
                                <span>{CAT_ICONS[cat]}</span>
                                <span>{cat}</span>
                                <span style={{
                                    padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: '800',
                                    backgroundColor: active ? 'var(--primary-color)' : '#f1f5f9',
                                    color: active ? 'white' : 'var(--text-secondary)',
                                }}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Zoek op naam of regelomschrijving…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        padding: '9px 16px', borderRadius: '20px', border: '1px solid var(--border-color)',
                        fontSize: '13px', outline: 'none', flex: '1', minWidth: '220px',
                        boxShadow: 'var(--shadow-sm)', fontFamily: 'inherit',
                    }}
                />

                {/* Severity toggles */}
                <div style={{ display: 'flex', gap: '6px' }}>
                    {ALL_SEVERITIES.map(s => {
                        const st = SEV_STYLE[s];
                        const on = activeSeverities.has(s);
                        return (
                            <button key={s} onClick={() => toggleSev(s)} style={{
                                padding: '7px 13px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                                border: `1px solid ${on ? st.border : 'var(--border-color)'}`,
                                backgroundColor: on ? st.bg : 'white',
                                color: on ? st.color : 'var(--text-secondary)',
                                fontWeight: '700', fontSize: '12px', transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                                <span>{st.icon}</span> {st.label}
                            </button>
                        );
                    })}
                </div>

                {/* Sort */}
                <select
                    value={sortMode}
                    onChange={e => setSortMode(e.target.value as any)}
                    style={{
                        padding: '9px 14px', borderRadius: '12px', border: '1px solid var(--border-color)',
                        fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer',
                        backgroundColor: 'white', color: 'var(--text-primary)', outline: 'none',
                    }}
                >
                    <option value="severity">Sorteren: Ernst</option>
                    <option value="category">Sorteren: Categorie</option>
                    <option value="name">Sorteren: Naam</option>
                </select>

                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {filtered.length} van {allIssues.length} zichtbaar
                </span>
            </div>

            {/* Issues list */}
            <div className="card" style={{ padding: '24px' }}>
                {filtered.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map((issue, idx) => {
                            const st = SEV_STYLE[issue.severity];
                            return (
                                <div key={idx} style={{
                                    padding: '14px 18px',
                                    borderRadius: '10px',
                                    border: `1px solid ${st.border}`,
                                    borderLeft: `4px solid ${st.border}`,
                                    backgroundColor: st.bg,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                }}>
                                    <div style={{ flex: '1', minWidth: '260px' }}>
                                        {/* Tags row */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '5px' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                                                backgroundColor: 'white', color: st.color, border: `1px solid ${st.border}`,
                                                textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px',
                                            }}>
                                                {st.icon} {st.label}
                                            </span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                                                backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                            }}>
                                                {CAT_ICONS[issue.category]} {issue.category}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                {issue.person.pointer}
                                            </span>
                                        </div>

                                        {/* Rule name */}
                                        <div style={{ fontWeight: '800', fontSize: '13px', color: st.color, marginBottom: '2px' }}>
                                            {issue.rule}
                                        </div>

                                        {/* Person name */}
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                                            {issue.person.firstName || '?'} {issue.person.lastName || '?'}
                                        </div>

                                        {/* Details */}
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                            {issue.details}
                                        </p>
                                    </div>

                                    <Link
                                        to={`/personen/${issue.person.pointer}`}
                                        style={{
                                            padding: '7px 14px', borderRadius: '20px',
                                            border: `1px solid ${st.border}`, backgroundColor: 'white',
                                            color: st.color, textDecoration: 'none',
                                            fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap',
                                            boxShadow: 'var(--shadow-sm)', flexShrink: 0,
                                        }}
                                    >
                                        Inspecteer →
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                ) : allIssues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                        <span style={{ fontSize: '48px' }}>🎉</span>
                        <h4 style={{ margin: '15px 0 5px 0', fontWeight: '800' }}>Geen problemen gevonden!</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Je stamboomdata is logisch consistent en vrij van alle gecontroleerde inconsistenties.
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '32px' }}>🔍</span>
                        <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', fontSize: '13px' }}>
                            Geen resultaten voor huidige filters. Pas de filters aan om meer te zien.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TreeHealth;
