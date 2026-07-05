import React, { useState, useMemo } from 'react';
import { IPersons, IPerson } from '../interfaces/IPersons';
import { Link } from 'react-router-dom';

function Persons({ persons }: { persons: IPersons }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Filter persons based on search query
    const filteredPersons = useMemo(() => {
        if (!persons?.persons) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return persons.persons;

        return persons.persons.filter(person => {
            const firstName = (person.firstName || '').toLowerCase();
            const lastName = (person.lastName || '').toLowerCase();
            const birthYear = person.birth?.date ? person.birth.date.slice(-4) : '';
            return firstName.includes(query) || lastName.includes(query) || birthYear.includes(query);
        });
    }, [persons, searchQuery]);

    // Paginate results
    const paginatedPersons = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPersons.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPersons, currentPage]);

    const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Personenlijst</h1>
            <p className="page-subtitle">Blader door alle leden van je stamboom en bekijk hun details.</p>

            {/* Search Input */}
            <div style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
                <input
                    type="text"
                    placeholder="Zoek op voornaam, achternaam of geboortejaar..."
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
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {filteredPersons.length} resultaten gevonden
                </div>
            </div>

            {/* Table */}
            {filteredPersons.length > 0 ? (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Naam</th>
                                    <th>Geslacht</th>
                                    <th>Geboorte</th>
                                    <th>Overlijden</th>
                                    <th>Kinderen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPersons.map(person => {
                                    const genderLabel = person.sex === 'M' ? 'Man' : person.sex === 'F' ? 'Vrouw' : 'Onbekend';
                                    const genderColor = person.sex === 'M' ? 'rgba(59, 130, 246, 0.08)' : person.sex === 'F' ? 'rgba(236, 72, 153, 0.08)' : '#f1f5f9';
                                    const textColor = person.sex === 'M' ? 'var(--male-color)' : person.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)';

                                    return (
                                        <tr key={person.pointer}>
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
                                            <td>{person.birth?.date || '-'}</td>
                                            <td>{person.death?.date || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {person.children.map(child => (
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
                                    backgroundColor: currentPage === 1 ? '#f8fafc' : 'white',
                                    color: currentPage === 1 ? '#94a3b8' : 'var(--text-primary)',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
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
                                    backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white',
                                    color: currentPage === totalPages ? '#94a3b8' : 'var(--text-primary)',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
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