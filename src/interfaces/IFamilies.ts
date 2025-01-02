export interface IFamilies {
    families: IFamily[];
}

export interface IFamily {
    tag: string;
    pointer: string | null;
    value: string | null;
    indexSource: number;
    indexRelative: number;
    husband: string | null;
    wife: string | null;
    children: string[] | null;
}