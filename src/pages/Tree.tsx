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
    const spacingX = squareSize.width / 2; // Horizontal spacing between siblings
    const spacingY = 250; // Vertical spacing between generations

    return (
        <div className="App">
            {generations && <h1>Generaties: {generations}</h1>}
            <svg width="100000" height={generations * (squareSize.height + spacingY)}>
                {renderFamilyTree()}
            </svg>
        </div>
    );

    function calculatePositions(
        person: IPerson,
        x: number,
        y: number,
        visited: Set<string> = new Set()
    ): { positions: Positions; width: number } {
        if (!person || visited.has(person.pointer)) return { positions: {}, width: squareSize.width };

        visited.add(person.pointer);

        const positions: Positions = {};
        let totalBranchWidth = 0;
        const childrenWidths: number[] = [];
        const partnerWidths: number[] = [];

        // Calculate positions for children
        for (const child of person.children) {
            const { positions: childPositions, width: childWidth } = calculatePositions(
                child,
                0, // Placeholder for X
                y + spacingY,
                visited
            );
            Object.assign(positions, childPositions);
            childrenWidths.push(childWidth);
            totalBranchWidth += childWidth;
        }

        // Include space for partners
        for (const partner of person.partners) {
            const { positions: partnerPositions, width: partnerWidth } = calculatePositions(
                partner,
                0, // Placeholder for X
                y,
                visited
            );
            Object.assign(positions, partnerPositions);
            partnerWidths.push(partnerWidth);
        }

        if (childrenWidths.length === 0) totalBranchWidth = squareSize.width + squareSize.width / 2;

        // Calculate X for children
        let currentX = x - totalBranchWidth / 2;
        for (let i = 0; i < person.children.length; i++) {
            const child = person.children[i];
            const childWidth = childrenWidths[i];
            const childX = currentX + childWidth / 2;
            const { positions: childPositions } = calculatePositions(
                child,
                childX,
                y + spacingY,
                visited
            );
            Object.assign(positions, childPositions);
            currentX += childWidth;
        }

        // Set position for the person
        positions[person.pointer] = { x, y };

        // Calculate positions for partners, placing them horizontally beside the person
        let partnerX = x + squareSize.width + spacingX;
        for (let i = 0; i < person.partners.length; i++) {
            const partner = person.partners[i];
            if (!partner) continue;
            const partnerWidth = partnerWidths[i];
            positions[partner.pointer] = { x: partnerX, y };
            partnerX += partnerWidth + spacingX;
        }

        return { positions, width: totalBranchWidth + partnerWidths.reduce((a, b) => a + b, 0) };
    }

    function renderFamilyTree() {
        if (!persons || !rootPerson) return null;

        // Calculate positions starting from the root
        const { positions } = calculatePositions(rootPerson, 1000, 50);

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
                                <line
                                    key={`${person.pointer}-${child.pointer}`}
                                    x1={position.x + squareSize.width / 2}
                                    y1={position.y + squareSize.height}
                                    x2={childPosition.x + squareSize.width / 2}
                                    y2={childPosition.y}
                                    stroke="black"
                                />
                            );
                        });
                    })}
            </>
        );
    }



}

export default Tree;