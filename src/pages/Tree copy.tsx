import '../App.css';
import Person from '../components/Person';
import { IPerson } from '../interfaces/IPersons';
import { Positions } from '../interfaces/IPositions';
import React from 'react';

function Tree({ persons, rootPerson, generations, families }) {

    const squareSize = {
        width: 200,
        height: 100
    };
    const spacingY = 200; // Vertical spacing between generations

    return (
        <div className="App">
            {generations && <h1>Generaties: {generations}</h1>}
            <svg width="100000" height={generations * (squareSize.height + spacingY)}>
                {renderFamilyTree()}
            </svg>
        </div>
    );

    function calculatePositions(rootPerson, startY = 50) {
        const positions = {}; // To store the calculated positions of each person
        const nodeSpacing = 20; // Horizontal spacing between siblings
    
        /**
         * Recursive function to calculate positions for each node.
         * Returns the total width required for the subtree.
         */
        function calculateNodePosition(person, currentX, currentY) {
            if (!person.children || person.children.length === 0) {
                // Leaf node: Assign position and return its width
                positions[person.pointer] = { x: currentX, y: currentY };
                return squareSize.width;
            }
    
            let totalWidth = 0;
            const childPositions = [];
    
            // Calculate positions for children and sum up their widths
            person.children.forEach(child => {
                const childWidth = calculateNodePosition(
                    child,
                    currentX + totalWidth,
                    currentY + spacingY
                );
                totalWidth += childWidth + nodeSpacing; // Add spacing between siblings
                childPositions.push(childWidth);
            });
    
            // Remove extra spacing after the last child
            totalWidth -= nodeSpacing;
    
            // Center the current node above its children
            const personX = currentX + (totalWidth - squareSize.width) / 2;
            positions[person.pointer] = { x: personX, y: currentY };
    
            return totalWidth;
        }
    
        // Start the recursion
        calculateNodePosition(rootPerson, 0, 50);
        // set the root node to the center
    
        return { positions };
    }

    function renderFamilyTree() {
        if (!persons || !rootPerson) return null;
        console.log(rootPerson);

        // Calculate positions starting from the root
        const { positions } = calculatePositions(rootPerson);

        return (
            <>
                {/* Render nodes */}
                {persons.persons.map(person => {
                    const position = positions[person.pointer];
                    if (!position) return null;

                    return (
                        <Person person={person} position={position} width={squareSize.width} height={squareSize.height} />
                    );
                })}

                {/* Render connections */}
                {persons.persons
                    .filter(person => person.sex === 'M')
                    .map(person => {
                        const position = positions[person.pointer];
                        if (!position || person.children.length === 0) return null;

                        return person.children.map(child => {
                            const childPosition = positions[child.pointer];
                            if (!childPosition) return null;

                            return (
                                <path
                                    key={`${person.pointer}-${child.pointer}`}
                                    d={`M ${position.x + squareSize.width / 2} ${position.y + squareSize.height}
                                        V ${position.y + squareSize.height + spacingY / 4}
                                        H ${childPosition.x + squareSize.width / 2}
                                        V ${childPosition.y}`}
                                    stroke="black"
                                    fill="none"
                                />
                            );
                        });
                    })}
            </>
        );
    }



}

export default Tree;


