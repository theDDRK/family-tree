import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IPersons, IPerson } from '../interfaces/IPersons';
import { getYearSafe } from '../utils/dateUtils';

interface SearchPaletteProps {
    persons: IPersons | undefined;
}

interface RecentSearchItem {
    pointer: string;
    firstName: string;
    lastName: string;
    sex: string | null;
    birthYear: number | null;
}

const SearchPalette: React.FC<SearchPaletteProps> = ({ persons }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IPerson[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    
    const navigate = useNavigate();
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle overlay
    const togglePalette = () => {
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
    };

    // Listen to Ctrl+K and Global Custom Event
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                togglePalette();
            }
        };

        const handleCustomEvent = () => {
            togglePalette();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('toggle-search-palette', handleCustomEvent);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('toggle-search-palette', handleCustomEvent);
        };
    }, []);

    // Load recent searches on mount and when palette opens
    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('recentSearches');
            if (stored) {
                try {
                    setRecentSearches(JSON.parse(stored));
                } catch (err) {
                    console.error('Failed to parse recent searches', err);
                }
            }
            // Auto focus input
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Handle searching
    useEffect(() => {
        if (!persons?.persons || query.trim() === '') {
            setResults([]);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const filtered = persons.persons
            .filter(person => {
                const fullName = `${person.firstName || ''} ${person.lastName || ''}`.toLowerCase();
                return fullName.includes(normalizedQuery) || 
                       (person.pointer && person.pointer.toLowerCase().includes(normalizedQuery));
            })
            .slice(0, 8); // Limit to 8 results for performance

        setResults(filtered);
        setSelectedIndex(0);
    }, [query, persons]);

    // Keyboard navigation inside modal
    useEffect(() => {
        const handleModalKeys = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const totalItems = query.trim() === '' ? recentSearches.length : results.length;
                if (totalItems > 0) {
                    setSelectedIndex(prev => (prev + 1) % totalItems);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const totalItems = query.trim() === '' ? recentSearches.length : results.length;
                if (totalItems > 0) {
                    setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (query.trim() === '') {
                    if (recentSearches[selectedIndex]) {
                        selectPerson(recentSearches[selectedIndex]);
                    }
                } else {
                    if (results[selectedIndex]) {
                        const p = results[selectedIndex];
                        selectPerson({
                            pointer: p.pointer || '',
                            firstName: p.firstName || '',
                            lastName: p.lastName || '',
                            sex: p.sex,
                            birthYear: getYearSafe(p.birth?.date)
                        });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleModalKeys);
        return () => window.removeEventListener('keydown', handleModalKeys);
    }, [isOpen, selectedIndex, results, recentSearches, query]);

    const selectPerson = (person: RecentSearchItem | { pointer: string; firstName: string; lastName: string; sex: string | null; birthYear: number }) => {
        // Save to recent searches
        const updatedRecent = [
            person as RecentSearchItem,
            ...recentSearches.filter(item => item.pointer !== person.pointer)
        ].slice(0, 5); // Keep top 5

        localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
        setRecentSearches(updatedRecent);

        // Navigate and close
        setIsOpen(false);
        navigate(`/personen/${person.pointer}`);
    };

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    const showRecent = query.trim() === '';

    return (
        <div 
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '10vh',
                zIndex: 99999,
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div 
                ref={modalRef}
                style={{
                    backgroundColor: 'var(--card-bg)',
                    width: '100%',
                    maxWidth: '600px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-xl)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Search Bar Input */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '20px', marginRight: '12px', opacity: 0.6 }}>🔍</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Zoek personen op naam of ID..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                        }}
                    />
                    <kbd style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        boxShadow: 'inset 0 -1px 0 var(--border-color)',
                        fontFamily: 'monospace'
                    }}>
                        ESC
                    </kbd>
                </div>

                {/* Results Section */}
                <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '10px' }}>
                    {showRecent && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.5px' }}>
                                Recent gezocht
                            </div>
                            {recentSearches.length === 0 ? (
                                <div style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                    Geen recente zoekopdrachten. Typ een naam om te beginnen.
                                </div>
                            ) : (
                                recentSearches.map((p, idx) => (
                                    <div 
                                        key={p.pointer}
                                        onClick={() => selectPerson(p)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedIndex === idx ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                                            transition: 'background-color 0.15s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: p.sex === 'M' ? 'rgba(59, 130, 246, 0.1)' : p.sex === 'F' ? 'rgba(236, 72, 153, 0.1)' : 'var(--border-color)',
                                            color: p.sex === 'M' ? 'var(--male-color)' : p.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '12px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {p.sex === 'M' ? '♂' : p.sex === 'F' ? '♀' : '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: selectedIndex === idx ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                                                {p.firstName} {p.lastName}
                                            </span>
                                            {p.birthYear && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                                    (* {p.birthYear < 0 ? `${Math.abs(p.birthYear)} v.Chr.` : p.birthYear})
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {p.pointer}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {!showRecent && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.5px' }}>
                                Zoekresultaten ({results.length})
                            </div>
                            {results.length === 0 ? (
                                <div style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                    Geen personen gevonden voor "{query}".
                                </div>
                            ) : (
                                results.map((p, idx) => {
                                    const birthYear = getYearSafe(p.birth?.date);
                                    return (
                                        <div 
                                            key={p.pointer}
                                            onClick={() => selectPerson({
                                                pointer: p.pointer || '',
                                                firstName: p.firstName || '',
                                                lastName: p.lastName || '',
                                                sex: p.sex,
                                                birthYear: isNaN(birthYear) ? null : birthYear
                                            })}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedIndex === idx ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: p.sex === 'M' ? 'rgba(59, 130, 246, 0.1)' : p.sex === 'F' ? 'rgba(236, 72, 153, 0.1)' : 'var(--border-color)',
                                                color: p.sex === 'M' ? 'var(--male-color)' : p.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px',
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}>
                                                {p.sex === 'M' ? '♂' : p.sex === 'F' ? '♀' : '?'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: selectedIndex === idx ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                                                    {p.firstName || ''} {p.lastName || ''}
                                                </span>
                                                {!isNaN(birthYear) && (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                                        (* {birthYear < 0 ? `${Math.abs(birthYear)} v.Chr.` : birthYear})
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {p.pointer}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Help */}
                <div style={{ 
                    padding: '12px 20px', 
                    backgroundColor: 'var(--bg-color)', 
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                }}>
                    <span>Gebruik <kbd>↑</kbd> <kbd>↓</kbd> om te bladeren en <kbd>Enter</kbd> om te selecteren</span>
                    <span>Sluiten met <kbd>ESC</kbd></span>
                </div>
            </div>
        </div>
    );
};

export default SearchPalette;
