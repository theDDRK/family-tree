import React from "react";
import { IPerson, IPersons } from "../interfaces/IPersons";
import Person from "./Person";

interface FamilyProps {
  persons: IPersons;
  parent: IPerson;
  index: number;
  width: number;
  height: number;
}

const Family: React.FC<FamilyProps> = ({ persons, parent, index, width, height }) => {

    const calculateAmountOfDescendants = (person: IPerson): number => {
        let descendants = 0;
        for (const child of person.children) {
            descendants += 1 + calculateAmountOfDescendants(child);
        }
        return descendants;
    };

    const calculateIndex = (person: IPerson): number => {
        return calculateAmountOfDescendants(person) / 2;
    }

    const amountOfDescendantsPerChild = (person: IPerson): Map<number, number> => {
        let descendants = new Map<number, number>();
        for (let i = 0; i < person.children.length; i++) {
            descendants.set(i, calculateAmountOfDescendants(person.children[i]));
        }
        return descendants;
    }

    const calculateChildIndex = (childIndex: number): number => {
        let index = 0;
        for (let i = 0; i < childIndex; i++) {
            index += amountOfDescendantsPerChild(parent).get(i)!;
        }
        index += calculateIndex(parent.children[childIndex]);
        return index;
    }

    if (parent.generation === 0) {
        console.log(`Amount of descendants for ${parent.firstName} ${parent.lastName}: ${calculateAmountOfDescendants(parent)}`);
    }
  return (
    <g transform={`translate(${index * width}, ${parent.generation * height})`}>
      <Person person={parent} index={calculateIndex(parent)} width={width} height={height} />
      {parent.children.map((child, i) => (
        <Family
          key={child.pointer}
          persons={persons}
          parent={child}
          index={calculateChildIndex(i)}
          width={width}
          height={height}
        />
      ))}
    </g>
  );
};

export default Family;