import { IPerson } from '../interfaces/IPersons';

export const exportToGedcom = (persons: IPerson[]): string => {
    let ged = '';
    
    // Header
    ged += '0 HEAD\n';
    ged += '1 CHAR UTF-8\n';
    ged += '1 SOUR FAMILIEBOOM\n';
    ged += '2 VERS 1.0\n';
    ged += '2 NAME FamilieBoom Exporter\n';
    ged += '1 GEDC\n';
    ged += '2 VERS 5.5.5\n';
    ged += '2 FORM LINEAGE-LINKED\n';

    // Individuals
    persons.forEach(p => {
        if (!p.pointer) return;
        ged += `0 ${p.pointer} INDI\n`;
        
        // Name
        if (p.firstName || p.lastName) {
            ged += `1 NAME ${p.firstName || ''} /${p.lastName || ''}/\n`;
            if (p.firstName) ged += `2 GIVN ${p.firstName}\n`;
            if (p.lastName) ged += `2 SURN ${p.lastName}\n`;
        }
        
        // Sex
        if (p.sex) {
            ged += `1 SEX ${p.sex}\n`;
        }
        
        // Birth
        if (p.birth?.date || p.birth?.place) {
            ged += `1 BIRT\n`;
            if (p.birth.date) ged += `2 DATE ${p.birth.date}\n`;
            if (p.birth.place) ged += `2 PLAC ${p.birth.place}\n`;
        } else if (p.christening?.date || p.christening?.place) {
            ged += `1 CHR\n`;
            if (p.christening.date) ged += `2 DATE ${p.christening.date}\n`;
            if (p.christening.place) ged += `2 PLAC ${p.christening.place}\n`;
        }

        // Death
        if (p.death?.date || p.death?.place) {
            ged += `1 DEAT\n`;
            if (p.death.date) ged += `2 DATE ${p.death.date}\n`;
            if (p.death.place) ged += `2 PLAC ${p.death.place}\n`;
        } else if (p.burial?.date || p.burial?.place) {
            ged += `1 BURI\n`;
            if (p.burial.date) ged += `2 DATE ${p.burial.date}\n`;
            if (p.burial.place) ged += `2 PLAC ${p.burial.place}\n`;
        }

        // Occupation
        if (p.occupation) {
            ged += `1 OCCU ${p.occupation}\n`;
        }

        // Note
        if (p.note) {
            // GEDCOM CONC is used for line continuation
            ged += `1 NOTE ${p.note.replace(/\n/g, '\n2 CONC ')}\n`;
        }
    });

    // Trailer
    ged += '0 TRLR\n';

    return ged;
};

export const downloadGedcomFile = (filename: string, gedcomContent: string) => {
    const blob = new Blob([gedcomContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
