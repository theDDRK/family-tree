import React from "react";
import { IPerson } from "../interfaces/IPersons";
import { Position } from "../interfaces/IPositions";

function Person({person, position, width, height}: {person: IPerson, position: Position, width: number, height: number}) {


    return (
        <g key={person.pointer} transform={`translate(${position.x}, ${position.y})`}>
              <rect
                x="0"
                y="0"
                width={width}
                height={height}
                fill={person.sex === 'M' ? '#87CEEB' : '#FFB6C1'}
                stroke="#000"
              />
              <text x="10" y="20" fill="black">
                {`${person.firstName || ''}`}
              </text>
              <text x="10" y="35" fill="black">
                {`${person.lastName || ''}`}
              </text>
              {person.birth.date && (
                <text x="10" y="75" fill="black">
                  Born: {person.birth.date}
                </text>
              )}
              {person.death.date && (
                <text x="10" y="90" fill="black">
                  Died: {person.death.date}
                </text>
              )}
        </g>
    );
};

export default Person;