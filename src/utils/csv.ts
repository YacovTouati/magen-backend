// Wraps a value in quotes only when necessary, doubling any internal quotes —
// standard CSV escaping (RFC 4180). Excel/Sheets both expect this exact form.
const toCsvField = (value: string): string => {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

// Prefixes a UTF-8 BOM so Excel (which otherwise guesses the system codepage)
// opens Hebrew text correctly instead of mangling it into question marks/mojibake.
const UTF8_BOM = String.fromCharCode(0xfeff);

export const buildCsv = (headers: string[], rows: string[][]): string => {
    const lines = [headers, ...rows].map((row) => row.map(toCsvField).join(','));
    return UTF8_BOM + lines.join('\r\n');
};
