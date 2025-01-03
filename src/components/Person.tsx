import React from "react";
import { IPerson } from "../interfaces/IPersons";
import { Position } from "../interfaces/IPositions";

function Person({ person, position, width, height }: { person: IPerson, position: Position, width: number, height: number }) {

  const formatDate = (date: string) => {
    let formattedDate = date;

    if (date.includes('ABT')) {
      formattedDate = formattedDate.replace('ABT', '~');
    }
    if (date.includes('BEF')) {
      formattedDate = formattedDate.replace('BEF', '<');
    }
    if (date.includes('AFT')) {
      formattedDate = formattedDate.replace('AFT', '>');
    }
    if (date.includes('BET')) {
      formattedDate = formattedDate.replace('BET', '><');
    }

    return formattedDate;
  };


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
      <text x="10" y="40" fill="black">
        {`${person.lastName || ''}`}
      </text>
      {person.birth.date && (
        <>
          <image xlinkHref="birth.svg" x="5" y="57" width="20" height="20" />
          <text x="28" y="75" fill="black">
            {formatDate(person.birth.date)}
          </text>
        </>
      )}
      {person.death.date && (
        <>
          <image xlinkHref="death.svg" x="7" y="79" width="15" height="20" />
          <text x="28" y="95" fill="black">
            {formatDate(person.death.date)}
          </text>
        </>
      )}
    </g>
  );
};

export default Person;