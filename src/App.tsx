import React, { useEffect } from 'react';
import './App.css';
import { readGedcom } from 'read-gedcom';
import Person from './components/Person';
import { IDatePlace, IPerson, IPersons } from './interfaces/IPersons';
import { IFamilies } from './interfaces/IFamilies';
import Family from './components/Family';
import { Positions } from './interfaces/IPositions';
import Tree from './pages/Tree';
import Navbar from './components/Navbar';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import { arrayBuffer } from 'stream/consumers';
import Connections from './pages/Connections';
import Hints from './pages/Hints';
import PersonDetail from './pages/PersonDetail';
import Persons from './pages/Persons';

function App() {
  const [persons, setPersons] = React.useState<IPersons>();
  const [rootPerson, setRootPerson] = React.useState<IPerson>();
  const [generations, setGenerations] = React.useState<number>();
  const [families, setFamilies] = React.useState<IFamilies>();
  const [filename, setFilename] = React.useState<string>(localStorage.getItem('filename'));
  const [arrayBuffer, setArrayBuffer] = React.useState<ArrayBuffer>(
    new TextEncoder().encode(localStorage.getItem('arrayBuffer') || '').buffer
  );

  const handleUpload = (filename: string, arrayBuffer: ArrayBuffer) => {
    localStorage.setItem('filename', filename);
    localStorage.setItem('arrayBuffer', new TextDecoder().decode(arrayBuffer));

    const promise = new Promise((resolve, reject) => {
      const gedcom = readGedcom(arrayBuffer);
      resolve(gedcom);
    });

    promise.then(gedcom => {
      const individualRecords = Array.from(gedcom.getIndividualRecord());
      const persons = parsePersons(individualRecords);
      console.log(persons);

      const familyRecords = Array.from(gedcom.getFamilyRecord());
      const families = parseFamilies(familyRecords);
      console.log(families);
      setFamilies(families);

      addRelationshipsToPersons(persons, families);
      console.log(persons);

      const leafs = persons.persons.filter(person => person.children.length === 0);
      const leafGenerations = leafs.map(leaf => calculateGenerations(leaf));
      const maxGenerations = Math.max(...leafGenerations.map(([person, generation]) => generation));
      const personWithMaxGenerations = leafGenerations.find(([person, generation]) => generation === maxGenerations);
      console.log(personWithMaxGenerations);
      setGenerations(maxGenerations + 1);

      setRootPerson(personWithMaxGenerations[0][0]);

      for (const rootPerson of personWithMaxGenerations[0]) {
        addGenerationToPerson(rootPerson, 0);
      }
      const personsWithGenerations = persons.persons.filter(person => person.generation !== null);
      console.log('persons with generations', personsWithGenerations);

      setPersons({ persons: persons.persons });
      setFilename(filename);
      setArrayBuffer(arrayBuffer);
    });

  };

  useEffect(() => {
    if (filename && arrayBuffer.byteLength > 0) {
      handleUpload(filename, arrayBuffer);
    }
  }, [arrayBuffer, filename]);

  return (
    <div className='App'>
      <Navbar />
      <BrowserRouter basename='/family-tree'>
        <Routes>
          <Route path='/' element={<Home filename={filename} persons={persons} handleFileChange={handleUpload} />} />
          {persons && <Route path='/stamboom' element={<Tree persons={persons} rootPerson={rootPerson} generations={generations} families={families} />} />}
          {persons && <Route path='/statistieken' element={<Statistics persons={persons} />} />}
          {persons && <Route path='/connecties' element={<Connections persons={persons} />} />}
          {persons && <Route path='/personen' element={<Persons persons={persons} />} />}
          {persons && <Route path='/personen/:id' element={<PersonDetail persons={persons} />} />}
          {persons && <Route path='/hints' element={<Hints persons={persons} />} />}
          {/* <Route path='/*' element={<Navigate to='/' />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );

  function parsePersons(individualRecords: any[]): IPersons {
    return {
      persons: individualRecords.map((individualRecord: any): IPerson => {
        let person: IPerson = {
          tag: individualRecord.tag,
          pointer: individualRecord.pointer,
          value: individualRecord.value,
          indexSource: individualRecord.indexSource,
          indexRelative: individualRecord.indexRelative,
          generation: null,
          firstName: null,
          lastName: null,
          sex: null,
          birth: {
            date: null,
            place: null
          },
          death: {
            date: null,
            place: null
          },
          residence: [],
          familyChild: null,
          familyParent: [],
          father: null,
          mother: null,
          siblings: [],
          partners: [],
          children: []
        };
        for (const child of individualRecord.children) {
          switch (child.tag) {
            case 'NAME':
              const names = child.value.split('/');
              person.firstName = names[0].trim();
              person.lastName = names[1];
              break;
            case 'SEX':
              person.sex = child.value;
              break;
            case 'BIRT':
              child.children.forEach((birthChild: any) => {
                switch (birthChild.tag) {
                  case 'DATE':
                    person.birth.date = birthChild.value || null;
                    break;
                  case 'PLAC':
                    person.birth.place = birthChild.value || null;
                    break;
                  default:
                    break;
                }
              });
              break;
            case 'DEAT':
              child.children.forEach((deathChild: any) => {
                switch (deathChild.tag) {
                  case 'DATE':
                    person.death.date = deathChild.value || null;
                    break;
                  case 'PLAC':
                    person.death.place = deathChild.value || null;
                    break;
                  default:
                    break;
                }
              });
              break;
            case 'FAMC':
              person.familyChild = child.value;
              break;
            case 'FAMS':
              person.familyParent.push(child.value);
              break;
            case 'RESI':
              child.children.forEach((residenceChild: any) => {
                let personResidence: IDatePlace = {
                  date: null,
                  place: null
                };
                switch (residenceChild.tag) {
                  case 'DATE':
                    personResidence.date = residenceChild.value || null;
                    break;
                  case 'PLAC':
                    personResidence.place = residenceChild.value || null;
                    person.residence.push(personResidence);
                    break;
                  default:
                    break;
                }
              });
              break;
            default:
              break;
          }
        }
        return person;
      })
    };
  }

  function parseFamilies(familyRecords: any[]) {
    return {
      families: familyRecords.map((familyRecord: any) => {
        let family = {
          tag: familyRecord.tag,
          pointer: familyRecord.pointer,
          value: familyRecord.value,
          indexSource: familyRecord.indexSource,
          indexRelative: familyRecord.indexRelative,
          husband: null,
          wife: null,
          children: []
        };

        for (const child of familyRecord.children) {
          switch (child.tag) {
            case 'HUSB':
              family.husband = child.value;
              break;
            case 'WIFE':
              family.wife = child.value;
              break;
            case 'CHIL':
              family.children.push(child.value);
              break;
            default:
              break;
          }
        }
        return family;
      })
    };
  }

  function addRelationshipsToPersons(persons: IPersons, families: IFamilies) {
    persons.persons.forEach(person => {
      if (person.familyChild) {
        const family = families.families.find(family => family.pointer === person.familyChild);
        if (family) {
          person.father = persons.persons.find(person => person.pointer === family.husband) || null;
          person.mother = persons.persons.find(person => person.pointer === family.wife) || null;
          person.siblings = family.children
            .filter(child => child !== person.familyChild)
            .map(child => persons.persons.find(person => person.pointer === child) || null);
        }
      }
      if (person.familyParent.length > 0) {
        for (const familyPointer of person.familyParent) {
          const family = families.families.find(family => family.pointer === familyPointer);
          if (family) {
            const partners = [family.husband, family.wife]
              .filter(pointer => pointer !== person.pointer)
              .map(pointer => persons.persons.find(person => person.pointer === pointer) || null);
            if (partners.length > 0) {
              person.partners.push(...partners);
            }
            const children = family.children
              .map(child => persons.persons.find(person => person.pointer === child) || null);
            if (children.length > 0) {
              children.forEach(child => {
                if (!person.children.some(existingChild => existingChild.pointer === child.pointer)) {
                  person.children.push(child);
                }
              });
            }
          }
        }
      }
    });
  }

  function calculateGenerations(person: IPerson, generation: number = 0): [IPerson[], number] {
    if (!person.father && !person.mother) {
      return [[person], generation];
    }

    const [fatherAncestors, fatherGeneration] = person.father
      ? calculateGenerations(person.father, generation + 1)
      : [[], 0];
    const [motherAncestors, motherGeneration] = person.mother
      ? calculateGenerations(person.mother, generation + 1)
      : [[], 0];

    if (fatherGeneration > motherGeneration) {
      return [fatherAncestors, fatherGeneration];
    } else if (motherGeneration > fatherGeneration) {
      return [motherAncestors, motherGeneration];
    } else {
      return [[...fatherAncestors, ...motherAncestors], fatherGeneration];
    }
  }

  function addGenerationToPerson(person: IPerson, generation: number, visited: Set<string> = new Set()) {
    if (!person || visited.has(person.pointer)) return; // Avoid reprocessing
    visited.add(person.pointer); // Mark person as visited

    person.generation = generation;

    // Recurse through children
    person.children.forEach(child => addGenerationToPerson(child, generation + 1, visited));

    // Recurse through partners
    // person.partners.forEach(partner => addGenerationToPerson(partner, generation, visited));

    // Recurse through siblings
    // person.siblings.forEach(sibling => addGenerationToPerson(sibling, generation, visited));

    // Recurse through parents
    // if (person.father) addGenerationToPerson(person.father, generation - 1, visited);
    // if (person.mother) addGenerationToPerson(person.mother, generation - 1, visited);
  }
}

export default App;