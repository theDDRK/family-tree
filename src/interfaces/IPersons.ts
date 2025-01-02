export interface IPersons {
    persons: IPerson[];
}

export interface IPerson {
    tag: string;
    pointer: string | null;
    value: string | null;
    indexSource: number;
    indexRelative: number;
    generation: number;
    firstName: string | null;
    lastName: string | null;
    sex: string | null;
    birth: IDatePlace | null;
    death: IDatePlace | null;
    residence: IDatePlace[] | null;
    familyChild: string | null;
    familyParent: string[] | null;
    father: IPerson | null;
    mother: IPerson | null;
    siblings: IPerson[] | null;
    partners: IPerson[] | null;
    children: IPerson[] | null;
}

export interface IDatePlace {
    date: string | null;
    place: string | null;
}