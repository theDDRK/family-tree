export interface IPersons {
    persons: IPerson[];
}

export interface IMarriage {
    partnerPointer: string;
    marriage: IDatePlace | null;
    divorce: IDatePlace | null;
}

export interface IPerson {
    tag: string;
    pointer: string | null;
    value: string | null;
    indexSource: number;
    indexRelative: number;
    generation: number | null;
    firstName: string | null;
    lastName: string | null;
    sex: string | null;
    birth: IDatePlace;
    death: IDatePlace;
    residence: IDatePlace[] | null;
    familyChild: string | null;
    familyParent: string[] | null;
    father: IPerson | null;
    mother: IPerson | null;
    siblings: IPerson[] | null;
    partners: IPerson[] | null;
    children: IPerson[] | null;
    marriages: IMarriage[];
    
    // Professionalism additions
    occupation: string | null;
    note: string | null;
    burial: IDatePlace;
    christening: IDatePlace;
}

export interface IDatePlace {
    date: string | null;
    place: string | null;
    sources?: string[];
}