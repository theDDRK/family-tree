import React from "react";
import { IPerson, IPersons } from "../interfaces/IPersons";
import Person from "./Person";

function Parents({persons, parents, children, width, height}: {persons: IPersons, parents: IPerson[], children: number, width: number, height: number}) {


    return (
        <>
            {parents.length > 0 && (
            <g transform={`translate(${children * width / 2 - width}, ${parents[0].generation * height})`}>
                {parents.map((parent, index) => (
                    <Person key={index} person={parent} index={index} width={width} height={height} />
                ))}
            </g>
            )}
        </>
    );
};

export default Parents;