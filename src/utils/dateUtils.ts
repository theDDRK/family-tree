/**
 * Safe year extractor that handles:
 * - BC / B.C. / BCE / B.C.E. suffixes (returning a negative year)
 * - Negative years prefix (e.g. -1700 or - 1700)
 * - Standard positive years
 */
export const getYearSafe = (dateStr: string | null | undefined): number => {
    if (!dateStr) return NaN;
    
    const trimmed = dateStr.trim();
    
    // Check for BC/BCE suffixes
    const bcMatch = trimmed.match(/(\d+)\s*(?:BC|B\.C\.|BCE|B\.C\.E\.)/i);
    if (bcMatch) {
        return -parseInt(bcMatch[1], 10);
    }
    
    // Check for negative numbers like -1700 or - 1700
    const negMatch = trimmed.match(/^-\s*(\d+)/);
    if (negMatch) {
        return -parseInt(negMatch[1], 10);
    }
    
    // Standard year matching (3-4 digits or more)
    // E.g. "12 JAN 1850" -> we want to match "1850", not "12"
    const year34 = trimmed.match(/\b\d{3,4}\b/);
    if (year34) {
        return parseInt(year34[0], 10);
    }
    
    // Fallback to any digits
    const anyDigits = trimmed.match(/\d+/);
    return anyDigits ? parseInt(anyDigits[0], 10) : NaN;
};

const months: Record<string, number> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
};

/**
 * Converts a date string into a comparable numeric value:
 * e.g., 1850 JAN 12 -> 18500112
 * e.g., -1700 JAN 12 -> -17000000 - (12 - 1)*100 - (31 - 12) = -17001119
 */
export const parseDateToNumber = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    
    const year = getYearSafe(dateStr);
    if (isNaN(year)) return null;
    
    const monthMatch = dateStr.match(/([A-Z]{3})/i);
    const dayMatch = dateStr.match(/(?:^|\s)(\d{1,2})(?:\s|[A-Z]|$)/i);
    
    let monthVal = 0;
    if (monthMatch) {
        const mStr = monthMatch[1].toUpperCase();
        monthVal = months[mStr] || 0;
    }
    
    let dayVal = 0;
    if (dayMatch) {
        dayVal = parseInt(dayMatch[1], 10);
    }
    
    return year >= 0 
        ? (year * 10000 + monthVal * 100 + dayVal) 
        : (year * 10000 - (12 - monthVal) * 100 - (31 - dayVal));
};

/**
 * Converts a date string into an approximate number of days from year 0.
 * Useful for computing differences between two dates (e.g. less than 9 months apart).
 */
export const dateToDays = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    
    const year = getYearSafe(dateStr);
    if (isNaN(year)) return null;
    
    const monthMatch = dateStr.match(/([A-Z]{3})/i);
    const dayMatch = dateStr.match(/(?:^|\s)(\d{1,2})(?:\s|[A-Z]|$)/i);
    
    let monthVal = 1;
    if (monthMatch) {
        const mStr = monthMatch[1].toUpperCase();
        monthVal = months[mStr] || 1;
    }
    
    let dayVal = 1;
    if (dayMatch) {
        dayVal = parseInt(dayMatch[1], 10);
    }
    
    return Math.round(year * 365.25 + (monthVal - 1) * 30.42 + dayVal);
};

/**
 * Formats a raw GEDCOM date string into human-readable Dutch,
 * translating English month names and date modifiers (ABT, EST, CAL, BEF, AFT, BET ... AND ...).
 */
export const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    const trimmed = dateStr.trim();
    
    const monthMap: Record<string, string> = {
        JAN: 'januari', FEB: 'februari', MAR: 'maart', APR: 'april',
        MAY: 'mei', JUN: 'juni', JUL: 'juli', AUG: 'augustus',
        SEP: 'september', OCT: 'oktober', NOV: 'november', DEC: 'december'
    };
    
    const formatSingle = (raw: string): string => {
        let clean = raw.trim();
        // Replace English months with Dutch
        Object.keys(monthMap).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            clean = clean.replace(regex, monthMap[key]);
        });
        // Replace BC / BCE with v.Chr.
        clean = clean.replace(/\b(?:BC|B\.C\.|BCE|B\.C\.E\.)\b/gi, 'v.Chr.');
        return clean;
    };
    
    // 1. Between range: BET date1 AND date2
    const betMatch = trimmed.match(/^BET\s+(.+?)\s+AND\s+(.+)$/i);
    if (betMatch) {
        return `tussen ${formatSingle(betMatch[1])} en ${formatSingle(betMatch[2])}`;
    }
    
    // 2. About/Approximate: ABT date
    if (trimmed.toUpperCase().startsWith('ABT ')) {
        return `ongeveer ${formatSingle(trimmed.substring(4))}`;
    }
    
    // 3. Estimated: EST date
    if (trimmed.toUpperCase().startsWith('EST ')) {
        return `geschat ${formatSingle(trimmed.substring(4))}`;
    }
    
    // 4. Calculated: CAL date
    if (trimmed.toUpperCase().startsWith('CAL ')) {
        return `berekend ${formatSingle(trimmed.substring(4))}`;
    }
    
    // 5. Before: BEF date
    if (trimmed.toUpperCase().startsWith('BEF ')) {
        return `voor ${formatSingle(trimmed.substring(4))}`;
    }
    
    // 6. After: AFT date
    if (trimmed.toUpperCase().startsWith('AFT ')) {
        return `na ${formatSingle(trimmed.substring(4))}`;
    }
    
    return formatSingle(trimmed);
};


