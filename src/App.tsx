import React, { useEffect, useCallback } from 'react';
import './App.css';
import { readGedcom } from 'read-gedcom';
import { IDatePlace, IPerson, IPersons } from './interfaces/IPersons';
import { IFamilies } from './interfaces/IFamilies';
import Navbar from './components/Navbar';
import SearchPalette from './components/SearchPalette';
import EmptyState from './components/EmptyState';
import { ToastContainer } from './components/Toast';
import SkeletonLoader from './components/SkeletonLoader';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getItem, setItem } from './utils/indexedDB';

const Home = React.lazy(() => import('./pages/Home'));
const Tree = React.lazy(() => import('./pages/Tree'));
const MapPage = React.lazy(() => import('./pages/Map'));
const Timeline = React.lazy(() => import('./pages/Timeline'));
const Statistics = React.lazy(() => import('./pages/Statistics'));
const Connections = React.lazy(() => import('./pages/Connections'));
const TreeHealth = React.lazy(() => import('./pages/TreeHealth'));
const Trivia = React.lazy(() => import('./pages/Trivia'));
const Persons = React.lazy(() => import('./pages/Persons'));
const PersonDetail = React.lazy(() => import('./pages/PersonDetail'));
const Hints = React.lazy(() => import('./pages/Hints'));

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div className="spinner" style={{ border: '4px solid var(--border-color)', width: '40px', height: '40px', borderRadius: '50%', borderLeftColor: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);


function App() {
  const [persons, setPersons] = React.useState<IPersons>();
  const [rootPerson, setRootPerson] = React.useState<IPerson>();
  const [generations, setGenerations] = React.useState<number>();
  const [families, setFamilies] = React.useState<IFamilies>();
  const [filename, setFilename] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadingStage, setLoadingStage] = React.useState<string>('');

  const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

  const parseAndSetData = useCallback(async (fname: string, buffer: ArrayBuffer) => {
    setLoadingStage('Bestandsgegevens inlezen...');
    await yieldToMain();
    const gedcom = readGedcom(buffer);

    setLoadingStage('Personen analyseren...');
    await yieldToMain();
    const individualRecords = Array.from(gedcom.getIndividualRecord());
    const parsedPersons = parsePersons(individualRecords);
    console.log(parsedPersons);

    setLoadingStage('Gezinnen analyseren...');
    await yieldToMain();
    const familyRecords = Array.from(gedcom.getFamilyRecord());
    const parsedFamilies = parseFamilies(familyRecords);
    console.log(parsedFamilies);
    setFamilies(parsedFamilies);

    setLoadingStage('Relaties koppelen...');
    await yieldToMain();
    addRelationshipsToPersons(parsedPersons, parsedFamilies);
    console.log(parsedPersons);

    setLoadingStage('Generaties berekenen...');
    await yieldToMain();
    const leafs = parsedPersons.persons.filter(person => person.children.length === 0);
    const generationCache = new Map<string, [IPerson[], number]>();
    const leafGenerations = leafs.map(leaf => calculateGenerations(leaf, generationCache));
    const maxGenerations = Math.max(...leafGenerations.map(([person, generation]) => generation));
    const personWithMaxGenerations = leafGenerations.find(([person, generation]) => generation === maxGenerations);
    console.log(personWithMaxGenerations);
    setGenerations(maxGenerations + 1);

    setLoadingStage('Stamboom opbouwen...');
    await yieldToMain();
    if (personWithMaxGenerations && personWithMaxGenerations[0] && personWithMaxGenerations[0].length > 0) {
      setRootPerson(personWithMaxGenerations[0][0]);
      for (const rPerson of personWithMaxGenerations[0]) {
        addGenerationToPerson(rPerson, 0);
      }
    }

    setPersons({ persons: parsedPersons.persons });
    setFilename(fname);
  }, []);

  const handleUpload = async (uploadedFilename: string, uploadedBuffer: ArrayBuffer) => {
    try {
      setIsLoading(true);
      setLoadingStage('Bestand opslaan in database...');
      await Promise.all([
        setItem('filename', uploadedFilename),
        setItem('arrayBuffer', uploadedBuffer)
      ]);
      await parseAndSetData(uploadedFilename, uploadedBuffer);
    } catch (err) {
      console.error('Failed to store or parse uploaded file', err);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setLoadingStage('Bestand ophalen uit database...');
        const storedFilename = await getItem('filename');
        const storedBuffer = await getItem('arrayBuffer');
        if (storedFilename && storedBuffer && storedBuffer.byteLength > 0) {
          await parseAndSetData(storedFilename, storedBuffer);
        }
      } catch (err) {
        console.error('Failed to load data from IndexedDB', err);
      } finally {
        setIsLoading(false);
        setLoadingStage('');
      }
    };
    loadFromDB();
  }, [parseAndSetData]);

  const getProgressPercentage = (stage: string) => {
    switch (stage) {
      case 'Bestand ophalen uit database...':
      case 'Bestand opslaan in database...':
        return 10;
      case 'Bestandsgegevens inlezen...':
        return 25;
      case 'Personen analyseren...':
        return 40;
      case 'Gezinnen analyseren...':
        return 55;
      case 'Relaties koppelen...':
        return 70;
      case 'Generaties berekenen...':
        return 85;
      case 'Stamboom opbouwen...':
        return 95;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className='App'>
      <BrowserRouter basename='/family-tree'>
        <Navbar />
        <SearchPalette persons={persons} />
        <ToastContainer />
        <React.Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path='/' element={<Home filename={filename} persons={persons} handleFileChange={handleUpload} />} />
            <Route path='/stamboom' element={persons ? <Tree persons={persons} rootPerson={rootPerson} generations={generations} families={families} /> : <EmptyState />} />
            <Route path='/kaart' element={persons ? <MapPage persons={persons} /> : <EmptyState />} />
            <Route path='/tijdreis' element={persons ? <Timeline persons={persons} /> : <EmptyState />} />
            <Route path='/statistieken' element={persons ? <Statistics persons={persons} /> : <EmptyState />} />
            <Route path='/connecties' element={persons ? <Connections persons={persons} /> : <EmptyState />} />
            <Route path='/kwaliteit' element={persons ? <TreeHealth persons={persons} /> : <EmptyState />} />
            <Route path='/trivia' element={persons ? <Trivia persons={persons} /> : <EmptyState />} />
            <Route path='/personen' element={persons ? <Persons persons={persons} /> : <EmptyState />} />
            <Route path='/personen/:id' element={persons ? <PersonDetail persons={persons} /> : <EmptyState />} />
            <Route path='/hints' element={persons ? <Hints persons={persons} /> : <EmptyState />} />
            {/* <Route path='/*' element={<Navigate to='/' />} /> */}
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </div>
  );
}

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
            place: null,
            sources: []
          },
          death: {
            date: null,
            place: null,
            sources: []
          },
          residence: [],
          familyChild: null,
          familyParent: [],
          father: null,
          mother: null,
          siblings: [],
          partners: [],
          children: [],
          marriages: [],
          occupation: null,
          note: null,
          burial: {
            date: null,
            place: null,
            sources: []
          },
          christening: {
            date: null,
            place: null,
            sources: []
          }
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
            case 'OCCU':
              person.occupation = child.value || null;
              break;
            case 'NOTE':
              person.note = child.value || null;
              break;
            case 'BURI':
              child.children.forEach((burialChild: any) => {
                switch (burialChild.tag) {
                  case 'DATE':
                    person.burial.date = burialChild.value || null;
                    break;
                  case 'PLAC':
                    person.burial.place = burialChild.value || null;
                    break;
                  case 'SOUR':
                    if (!person.burial.sources) person.burial.sources = [];
                    person.burial.sources.push(burialChild.value || '');
                    break;
                  default:
                    break;
                }
              });
              break;
            case 'CHR':
            case 'BAPM':
              child.children.forEach((chrChild: any) => {
                switch (chrChild.tag) {
                  case 'DATE':
                    person.christening.date = chrChild.value || null;
                    break;
                  case 'PLAC':
                    person.christening.place = chrChild.value || null;
                    break;
                  case 'SOUR':
                    if (!person.christening.sources) person.christening.sources = [];
                    person.christening.sources.push(chrChild.value || '');
                    break;
                  default:
                    break;
                }
              });
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
                  case 'SOUR':
                    if (!person.birth.sources) person.birth.sources = [];
                    person.birth.sources.push(birthChild.value || '');
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
                  case 'SOUR':
                    if (!person.death.sources) person.death.sources = [];
                    person.death.sources.push(deathChild.value || '');
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
              let personResidence: IDatePlace = {
                date: null,
                place: null,
                sources: []
              };
              child.children.forEach((residenceChild: any) => {
                switch (residenceChild.tag) {
                  case 'DATE':
                    personResidence.date = residenceChild.value || null;
                    break;
                  case 'PLAC':
                    personResidence.place = residenceChild.value || null;
                    break;
                  case 'SOUR':
                    if (!personResidence.sources) personResidence.sources = [];
                    personResidence.sources.push(residenceChild.value || '');
                    break;
                  default:
                    break;
                }
              });
              if (personResidence.date || personResidence.place) {
                person.residence!.push(personResidence);
              }
              break;
            default:
              break;
          }
        }
        return person;
      })
    };
  }

  function parseFamilies(familyRecords: any[]): IFamilies {
    return {
      families: familyRecords.map((familyRecord: any): IFamily => {
        let family: IFamily = {
          tag: familyRecord.tag,
          pointer: familyRecord.pointer,
          value: familyRecord.value,
          indexSource: familyRecord.indexSource,
          indexRelative: familyRecord.indexRelative,
          husband: null,
          wife: null,
          children: [],
          marriage: null,
          divorce: null
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
              if (!family.children) family.children = [];
              family.children.push(child.value);
              break;
            case 'MARR':
              family.marriage = { date: null, place: null, sources: [] };
              child.children.forEach((marrChild: any) => {
                switch (marrChild.tag) {
                  case 'DATE':
                    family.marriage!.date = marrChild.value || null;
                    break;
                  case 'PLAC':
                    family.marriage!.place = marrChild.value || null;
                    break;
                  case 'SOUR':
                    if (!family.marriage!.sources) family.marriage!.sources = [];
                    family.marriage!.sources.push(marrChild.value || '');
                    break;
                }
              });
              break;
            case 'DIV':
              family.divorce = { date: null, place: null, sources: [] };
              child.children.forEach((divChild: any) => {
                switch (divChild.tag) {
                  case 'DATE':
                    family.divorce!.date = divChild.value || null;
                    break;
                  case 'PLAC':
                    family.divorce!.place = divChild.value || null;
                    break;
                  case 'SOUR':
                    if (!family.divorce!.sources) family.divorce!.sources = [];
                    family.divorce!.sources.push(divChild.value || '');
                    break;
                }
              });
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
    const personMap = new Map<string, IPerson>();
    persons.persons.forEach(person => {
      if (person.pointer) {
        personMap.set(person.pointer, person);
      }
    });
 
    const familyMap = new Map<string, IFamily>();
    families.families.forEach(family => {
      if (family.pointer) {
        familyMap.set(family.pointer, family);
      }
    });
 
    persons.persons.forEach(person => {
      if (person.familyChild) {
        const family = familyMap.get(person.familyChild);
        if (family) {
          person.father = family.husband ? personMap.get(family.husband) || null : null;
          person.mother = family.wife ? personMap.get(family.wife) || null : null;
          person.siblings = (family.children || [])
            .filter((child: string) => child !== person.pointer)
            .map((child: string) => personMap.get(child) || null)
            .filter((sibling: IPerson | null) => sibling !== null) as IPerson[];
        }
      }
      if (person.familyParent && person.familyParent.length > 0) {
        for (const familyPointer of person.familyParent) {
          const family = familyMap.get(familyPointer);
          if (family) {
            const partners = [family.husband, family.wife]
              .filter(pointer => pointer && pointer !== person.pointer)
              .map(pointer => pointer ? personMap.get(pointer) || null : null)
              .filter((partner: IPerson | null) => partner !== null) as IPerson[];
            if (partners.length > 0) {
              person.partners!.push(...partners);
              partners.forEach(partner => {
                person.marriages.push({
                  partnerPointer: partner.pointer || '',
                  marriage: family.marriage || null,
                  divorce: family.divorce || null
                });
              });
            }
            const children = (family.children || [])
              .map((child: string) => personMap.get(child) || null)
              .filter((child: IPerson | null) => child !== null) as IPerson[];
            if (children.length > 0) {
              children.forEach(child => {
                if (!person.children!.some(existingChild => existingChild.pointer === child.pointer)) {
                  person.children!.push(child);
                }
              });
            }
          }
        }
      }
    });
  }


  function calculateGenerations(
    person: IPerson,
    cache: Map<string, [IPerson[], number]> = new Map()
  ): [IPerson[], number] {
    if (cache.has(person.pointer)) {
      return cache.get(person.pointer)!;
    }

    if (!person.father && !person.mother) {
      const result: [IPerson[], number] = [[person], 0];
      cache.set(person.pointer, result);
      return result;
    }

    const [fatherAncestors, fatherHeight] = person.father
      ? calculateGenerations(person.father, cache)
      : [[], -1];
    const [motherAncestors, motherHeight] = person.mother
      ? calculateGenerations(person.mother, cache)
      : [[], -1];

    let result: [IPerson[], number];
    if (fatherHeight > motherHeight) {
      result = [fatherAncestors, fatherHeight + 1];
    } else if (motherHeight > fatherHeight) {
      result = [motherAncestors, motherHeight + 1];
    } else {
      result = [[...fatherAncestors, ...motherAncestors], fatherHeight + 1];
    }

    cache.set(person.pointer, result);
    return result;
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

export default App;