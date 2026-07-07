import React, { useState, useMemo } from 'react';
import { IPersons } from '../interfaces/IPersons';
import { getYearSafe } from '../utils/dateUtils';

interface IQuestion {
    type: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}



function Trivia({ persons }: { persons: IPersons }) {
    const validPersons = useMemo(() => {
        return persons.persons.filter(p => p.firstName && p.lastName && p.firstName !== '?' && p.lastName !== '?');
    }, [persons]);

    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizEnded, setQuizEnded] = useState(false);

    // Shuffle helper
    const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Question generation logic
    const generateQuiz = () => {
        if (validPersons.length < 5) return;
        const newQuestions: IQuestion[] = [];
        const usedPersons = new Set<string>();

        while (newQuestions.length < 5) {
            // Pick a random subject
            const subject = validPersons[Math.floor(Math.random() * validPersons.length)];
            if (usedPersons.has(subject.pointer || '')) continue;
            usedPersons.add(subject.pointer || '');

            const randType = Math.floor(Math.random() * 4); // 4 templates

            if (randType === 0 && subject.occupation) {
                // Template 0: Occupation
                const correct = subject.occupation;
                const pool = validPersons
                    .filter(p => p.occupation && p.occupation !== correct)
                    .map(p => p.occupation!);
                const distinctPool = Array.from(new Set(pool));
                
                if (distinctPool.length >= 3) {
                    const options = shuffleArray([correct, ...distinctPool.slice(0, 3)]);
                    newQuestions.push({
                        type: 'occupation',
                        text: `Welk beroep had voorouder ${subject.firstName} ${subject.lastName}?`,
                        options,
                        correctIndex: options.indexOf(correct),
                        explanation: `${subject.firstName} ${subject.lastName} werkte als ${correct}.`
                    });
                }
            } else if (randType === 1 && subject.birth?.date && subject.birth?.place) {
                // Template 1: Birthplace "Wie ben ik?"
                const correctName = `${subject.firstName} ${subject.lastName}`;
                const birthYear = getYearSafe(subject.birth.date);
                const place = subject.birth.place;
                const deathYear = getYearSafe(subject.death?.date);
                
                const pool = validPersons
                    .filter(p => p.pointer !== subject.pointer)
                    .map(p => `${p.firstName} ${p.lastName}`);
                const distinctPool = Array.from(new Set(pool));

                if (distinctPool.length >= 3) {
                    const options = shuffleArray([correctName, ...distinctPool.slice(0, 3)]);
                    const lifeSpanStr = !isNaN(birthYear) ? `geboren in ${birthYear} te ${place}${!isNaN(deathYear) ? ` en overleden in ${deathYear}` : ''}` : `geboren te ${place}`;
                    
                    newQuestions.push({
                        type: 'who_am_i',
                        text: `Wie ben ik? Ik ben ${lifeSpanStr}.`,
                        options,
                        correctIndex: options.indexOf(correctName),
                        explanation: `Dit gaat over ${correctName}.`
                    });
                }
            } else if (randType === 2 && subject.partners && subject.partners.length > 0) {
                // Template 2: Relationship
                const partner = subject.partners[0];
                if (partner && partner.firstName) {
                    const correctPartnerName = `${partner.firstName} ${partner.lastName || ''}`;
                    const pool = validPersons
                        .filter(p => p.pointer !== partner.pointer && p.sex === partner.sex)
                        .map(p => `${p.firstName} ${p.lastName}`);
                    const distinctPool = Array.from(new Set(pool));

                    if (distinctPool.length >= 3) {
                        const options = shuffleArray([correctPartnerName, ...distinctPool.slice(0, 3)]);
                        newQuestions.push({
                            type: 'relationship',
                            text: `Met wie was ${subject.firstName} ${subject.lastName} getrouwd?`,
                            options,
                            correctIndex: options.indexOf(correctPartnerName),
                            explanation: `${subject.firstName} ${subject.lastName} was getrouwd met ${correctPartnerName}.`
                        });
                    }
                }
            } else {
                // Template 3: Lifespan
                const bYear = getYearSafe(subject.birth?.date) || getYearSafe(subject.christening?.date);
                const dYear = getYearSafe(subject.death?.date) || getYearSafe(subject.burial?.date);
                
                if (!isNaN(bYear) && !isNaN(dYear)) {
                    const lifespan = dYear - bYear;
                    if (lifespan > 50) {
                        const correctName = `${subject.firstName} ${subject.lastName}`;
                        // Find other candidates who lived shorter
                        const shorterCandidates = validPersons.filter(p => {
                            const pb = getYearSafe(p.birth?.date);
                            const pd = getYearSafe(p.death?.date);
                            return !isNaN(pb) && !isNaN(pd) && (pd - pb) < lifespan - 10;
                        });

                        if (shorterCandidates.length >= 3) {
                            const options = shuffleArray([correctName, ...shorterCandidates.slice(0, 3).map(p => `${p.firstName} ${p.lastName}`)]);
                            newQuestions.push({
                                type: 'lifespan',
                                text: `Welke van de volgende personen heeft de hoogste leeftijd bereikt (${lifespan} jaar)?`,
                                options,
                                correctIndex: options.indexOf(correctName),
                                explanation: `${correctName} overleed op ${lifespan}-jarige leeftijd.`
                            });
                        }
                    }
                }
            }
        }

        setQuestions(newQuestions);
        setCurrentQuestionIndex(0);
        setSelectedOptionIndex(null);
        setScore(0);
        setQuizStarted(true);
        setQuizEnded(false);
    };

    const handleOptionSelect = (idx: number) => {
        if (selectedOptionIndex !== null) return; // Prevent double select
        setSelectedOptionIndex(idx);
        if (idx === questions[currentQuestionIndex].correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOptionIndex(null);
        } else {
            setQuizEnded(true);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 className="page-title">Familie Trivia</h1>
                <p className="page-subtitle">Test je kennis over je voorouders! De vragen worden ter plekke gegenereerd op basis van jouw GEDCOM-data.</p>
            </div>

            {!quizStarted ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '50px' }}>🧠</span>
                    <h3 style={{ margin: 0, fontWeight: '800' }}>Ben je klaar voor de uitdaging?</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', maxWidth: '400px' }}>
                        De quiz bevat 5 willekeurige meerkeuzevragen over de beroepen, geboorteplaatsen, leeftijden en huwelijken van je voorouders.
                    </p>
                    {validPersons.length >= 10 ? (
                        <button
                            onClick={() => generateQuiz()}
                            style={{
                                padding: '12px 35px',
                                borderRadius: '25px',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                border: 'none',
                                fontWeight: '700',
                                fontSize: '15px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                        >
                            Start de Quiz
                        </button>
                    ) : (
                        <p style={{ color: '#ef4444', fontWeight: '600', fontSize: '13px' }}>
                            Upload eerst een stamboombestand met minimaal 10 personen om de quiz te kunnen spelen.
                        </p>
                    )}
                </div>
            ) : quizEnded ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '50px' }}>🏆</span>
                    <h3 style={{ margin: 0, fontWeight: '800' }}>Quiz Voltooid!</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Je hebt een score behaald van:
                    </p>
                    <h2 style={{ fontSize: '48px', margin: 0, fontWeight: '800', color: 'var(--primary-color)' }}>
                        {score} / {questions.length}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {score === questions.length ? 'Perfecte score! Jij kent je familiehistorie door en door!' : score >= 3 ? 'Goede score! Je bent goed op weg.' : 'Blijf oefenen en bekijk de details van je voorouders.'}
                    </p>
                    
                    <button
                        onClick={() => generateQuiz()}
                        style={{
                            padding: '12px 30px',
                            borderRadius: '25px',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Speel Nogmaals
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {/* Progress indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Vraag {currentQuestionIndex + 1} van {questions.length}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>
                            Score: {score}
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-color)',
                            transition: 'width 0.3s'
                        }}></div>
                    </div>

                    {/* Question Text */}
                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '18px', lineHeight: '1.5' }}>
                        {questions[currentQuestionIndex].text}
                    </h3>

                    {/* Options list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {questions[currentQuestionIndex].options.map((opt, idx) => {
                            const isSelected = selectedOptionIndex === idx;
                            const isCorrect = questions[currentQuestionIndex].correctIndex === idx;
                            const isWrong = isSelected && !isCorrect;

                            let bgColor = 'white';
                            let borderColor = 'var(--border-color)';
                            let textColor = 'var(--text-primary)';

                            if (selectedOptionIndex !== null) {
                                if (isCorrect) {
                                    bgColor = '#f0fdf4';
                                    borderColor = '#22c55e';
                                    textColor = '#15803d';
                                } else if (isWrong) {
                                    bgColor = '#fef2f2';
                                    borderColor = '#ef4444';
                                    textColor = '#b91c1c';
                                } else {
                                    bgColor = '#f8fafc';
                                    borderColor = '#e2e8f0';
                                    textColor = '#94a3b8';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    disabled={selectedOptionIndex !== null}
                                    style={{
                                        padding: '16px 20px',
                                        borderRadius: '12px',
                                        border: `1px solid ${borderColor}`,
                                        backgroundColor: bgColor,
                                        color: textColor,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        textAlign: 'left',
                                        cursor: selectedOptionIndex === null ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{opt}</span>
                                        {selectedOptionIndex !== null && isCorrect && <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>}
                                        {selectedOptionIndex !== null && isWrong && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback / Explanation */}
                    {selectedOptionIndex !== null && (
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: '12px',
                            backgroundColor: '#f8fafc',
                            border: '1px dashed var(--border-color)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5'
                        }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                                {selectedOptionIndex === questions[currentQuestionIndex].correctIndex ? '🎉 Goedgekeurd!' : '💡 Helaas!'}
                            </span>
                            {questions[currentQuestionIndex].explanation}
                        </div>
                    )}

                    {/* Next Button */}
                    {selectedOptionIndex !== null && (
                        <button
                            onClick={() => handleNextQuestion()}
                            style={{
                                alignSelf: 'flex-end',
                                padding: '10px 24px',
                                borderRadius: '20px',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {currentQuestionIndex < questions.length - 1 ? 'Volgende Vraag' : 'Bekijk Resultaten'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Trivia;
