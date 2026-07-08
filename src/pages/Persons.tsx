import React, { useState, useMemo, useEffect } from 'react';
import { IPersons } from '../interfaces/IPersons';
import { Link } from 'react-router-dom';
import { parseDateToNumber, formatDate } from '../utils/dateUtils';
import { getBookmarks, toggleBookmark } from '../utils/bookmarks';
import { exportToGedcom, downloadGedcomFile } from '../utils/gedcomExport';
import { showToast } from '../components/Toast';

function Persons({ persons }: { persons: IPersons }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<'name' | 'sex' | 'birth' | 'death'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const itemsPerPage = 25;

    const [starredPointers, setStarredPointers] = useState<string[]>(getBookmarks());

    useEffect(() => {
        const handleChanged = () => {
            setStarredPointers(getBookmarks());
        };
        window.addEventListener('bookmarks-changed', handleChanged);
        return () => window.removeEventListener('bookmarks-changed', handleChanged);
    }, []);

    // Filter persons based on search query
    const filteredPersons = useMemo(() => {
        if (!persons?.persons) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return persons.persons;

        return persons.persons.filter(person => {
            const firstName = (person.firstName || '').toLowerCase();
            const lastName = (person.lastName || '').toLowerCase();
            
            // Format dates first to ensure we can search for human-readable terms too
            const birthFormatted = (formatDate(person.birth?.date) || formatDate(person.christening?.date) || '').toLowerCase();
            const deathFormatted = (formatDate(person.death?.date) || formatDate(person.burial?.date) || '').toLowerCase();
            
            return firstName.includes(query) || 
                   lastName.includes(query) || 
                   birthFormatted.includes(query) || 
                   deathFormatted.includes(query);
        });
    }, [persons, searchQuery]);

    // Sort persons
    const sortedPersons = useMemo(() => {
        const result = [...filteredPersons];
        return result.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';
            
            if (sortKey === 'name') {
                valA = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
                valB = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
            } else if (sortKey === 'sex') {
                valA = a.sex || '';
                valB = b.sex || '';
            } else if (sortKey === 'birth') {
                const yearA = parseDateToNumber(a.birth?.date) ?? parseDateToNumber(a.christening?.date);
                const yearB = parseDateToNumber(b.birth?.date) ?? parseDateToNumber(b.christening?.date);
                
                if (yearA === null) return sortDirection === 'asc' ? 1 : -1;
                if (yearB === null) return sortDirection === 'asc' ? -1 : 1;
                return sortDirection === 'asc' ? yearA - yearB : yearB - yearA;
            } else if (sortKey === 'death') {
                const yearA = parseDateToNumber(a.death?.date) ?? parseDateToNumber(a.burial?.date);
                const yearB = parseDateToNumber(b.death?.date) ?? parseDateToNumber(b.burial?.date);
                
                if (yearA === null) return sortDirection === 'asc' ? 1 : -1;
                if (yearB === null) return sortDirection === 'asc' ? -1 : 1;
                return sortDirection === 'asc' ? yearA - yearB : yearB - yearA;
            }
            
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPersons, sortKey, sortDirection]);

    // Paginate results
    const paginatedPersons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedPersons.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedPersons, currentPage]);

    const totalPages = Math.ceil(sortedPersons.length / itemsPerPage);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSort = (key: 'name' | 'sex' | 'birth' | 'death') => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const renderSortIndicator = (key: 'name' | 'sex' | 'birth' | 'death') => {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    const handleExport = () => {
        if (sortedPersons.length === 0) {
            showToast('Geen personen om te exporteren!', 'warning');
            return;
        }
        const content = exportToGedcom(sortedPersons);
        downloadGedcomFile('stamboom-selectie.ged', content);
        showToast(`${sortedPersons.length} personen geëxporteerd naar GEDCOM!`, 'success');
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Personenlijst</h1>
            <p className="page-subtitle">Blader door alle leden van je stamboom en bekijk hun details.</p>

            {/* Search and Sort Toolbar */}
            <div style={{ marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                <input
                    type="text"
                    placeholder="Zoek op voornaam, achternaam of datum..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                        padding: '12px 20px',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '400px',
                        fontSize: '14px',
                        outline: 'none',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'border-color 0.2s',
                        fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {sortedPersons.length} resultaten gevonden
                </div>
                <div style={{ flex: 1 }} />
                <button
                    onClick={handleExport}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
                >
                    📥 Exporteer selectie (.ged)
                </button>
            </div>

            {/* Table */}
            {sortedPersons.length > 0 ? (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>★</th>
                                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none', position: 'relative' }}>
                                        Naam{renderSortIndicator('name')}
                                    </th>
                                    <th onClick={() => handleSort('sex')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Geslacht{renderSortIndicator('sex')}
                                    </th>
                                    <th onClick={() => handleSort('birth')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Geboorte{renderSortIndicator('birth')}
                                    </th>
                                    <th onClick={() => handleSort('death')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        Overlijden{renderSortIndicator('death')}
                                    </th>
                                    <th>Kinderen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPersons.map(person => {
                                    const genderLabel = person.sex === 'M' ? 'Man' : person.sex === 'F' ? 'Vrouw' : 'Onbekend';
                                    const genderColor = person.sex === 'M' ? 'rgba(59, 130, 246, 0.08)' : person.sex === 'F' ? 'rgba(236, 72, 153, 0.08)' : 'var(--border-color)';
                                    const textColor = person.sex === 'M' ? 'var(--male-color)' : person.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)';

                                    const birthVal = formatDate(person.birth?.date) || formatDate(person.christening?.date) || '-';
                                    const deathVal = formatDate(person.death?.date) || formatDate(person.burial?.date) || '-';

                                    const isStarred = starredPointers.includes(person.pointer || '');

                                    return (
                                        <tr key={person.pointer}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => toggleBookmark(person.pointer || '')}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '18px',
                                                        padding: 0,
                                                        color: isStarred ? '#fbbf24' : 'var(--text-secondary)',
                                                        transition: 'transform 0.15s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                    title={isStarred ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
                                                >
                                                    {isStarred ? '★' : '☆'}
                                                </button>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>
                                                <Link to={`/personen/${person.pointer}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                                                    {person.firstName || '?'} {person.lastName || '?'}
                                                </Link>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '11px', 
                                                    fontWeight: '700', 
                                                    backgroundColor: genderColor, 
                                                    color: textColor,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {genderLabel}
                                                </span>
                                            </td>
                                            <td>{birthVal}</td>
                                            <td>{deathVal}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {(person.children || []).map(child => (
                                                        <Link to={`/personen/${child.pointer}`} className={`label ${child.sex}`} key={person.pointer + child.pointer}>
                                                            {child.firstName}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '25px' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: currentPage === 1 ? 'var(--bg-color)' : 'var(--card-bg)',
                                    color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    fontFamily: 'inherit'
                                }}
                            >
                                Vorige
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                Pagina {currentPage} van {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: currentPage === totalPages ? 'var(--bg-color)' : 'var(--card-bg)',
                                    color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    fontFamily: 'inherit'
                                }}
                            >
                                Volgende
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Geen personen gevonden die voldoen aan je zoekcriteria.
                </div>
            )}
        </div>
    );
}

export default Persons;