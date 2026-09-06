import { ShiftType } from '../types/schedule';

// @hebcal/core (v6) ships ESM-only ("type": "module", no CJS export condition), but this
// backend is CommonJS end to end. A plain `import()` here gets downleveled to require()
// by tsc under module: commonjs and breaks with ERR_PACKAGE_PATH_NOT_EXPORTED — the
// `new Function` indirection is the standard workaround: it hides the import() from
// TypeScript's transform so it survives as a genuine dynamic import at runtime.
type HebcalModule = typeof import('@hebcal/core');
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<HebcalModule>;

let hebcalPromise: Promise<HebcalModule> | null = null;
function loadHebcal(): Promise<HebcalModule> {
    if (!hebcalPromise) {
        hebcalPromise = dynamicImport('@hebcal/core');
    }
    return hebcalPromise;
}

export interface HolidayInfo {
    key: string;
    label: string;
    emoji: string;
}

// Only the six Yom Tov clusters that actually carry a melacha prohibition — hebcal's
// CHAG flag is precisely that set (verified empirically: Rosh Hashana I+II, Yom Kippur,
// Sukkot I, Shmini Atzeret [Simchat Torah in Israel], Pesach I+VII, Shavuot). Chol
// HaMoed, Chanukah, Purim, the minor fasts, and Israel's civil/modern holidays are
// deliberately NOT CHAG in hebcal and are never blocked here — matches the explicit
// "רק יום טוב, לא חול המועד, לא חנוכה, לא פורים" requirement.
const HOLIDAY_INFO: Record<string, HolidayInfo> = {
    'Rosh Hashana': { key: 'rosh_hashana', label: 'ראש השנה', emoji: '🍎' },
    'Yom Kippur': { key: 'yom_kippur', label: 'יום כיפור', emoji: '🕊️' },
    Sukkot: { key: 'sukkot', label: 'סוכות', emoji: '🌿' },
    // In Israel this single CHAG day is popularly known as Simchat Torah (the dual name
    // "שמיני עצרת / שמחת תורה" is technically accurate but far too long once combined
    // with a "שבת ו..." prefix — it wraps and breaks the calendar grid's row height).
    'Shmini Atzeret': { key: 'shmini_atzeret', label: 'שמחת תורה', emoji: '📜' },
    Pesach: { key: 'pesach', label: 'פסח', emoji: '🫓' },
    Shavuot: { key: 'shavuot', label: 'שבועות', emoji: '🌾' },
};

type DayBlock = { morning: boolean; evening: boolean; info: HolidayInfo };

// One cache entry per Gregorian year — holidays never change once computed, and every
// CHAG date in our set falls comfortably inside a single Gregorian year (none straddle
// Dec 31/Jan 1), so a per-Gregorian-year cache keyed by the shift's own date is exact
// and never needs cross-year stitching.
const yearCache = new Map<number, Promise<Map<string, DayBlock>>>();

function toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function addUtcDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
}

// HDate.greg() constructs its Date via the LOCAL-time constructor (`new Date(y, m, d)`),
// i.e. local midnight in whatever timezone the process happens to run in — it is NOT
// UTC midnight. Reading it back with the UTC getters (or .toISOString()) shifts the
// calendar date by a day in any timezone east of Greenwich (e.g. Asia/Jerusalem, UTC+2/
// +3): local midnight Sept 12 there is Sept 11 21:00/22:00 UTC. The fix is to read the
// LOCAL calendar fields (they hold the correct Y/M/D regardless of TZ) and rebuild a
// proper UTC-midnight Date from them, matching how Shift.date is stored everywhere else.
function gregToUtcMidnight(d: Date): Date {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

async function buildYearBlockMap(year: number): Promise<Map<string, DayBlock>> {
    const { HebrewCalendar, flags } = await loadHebcal();

    const events = HebrewCalendar.calendar({
        year,
        isHebrewYear: false,
        il: true,
        noRoshChodesh: true,
        noSpecialShabbat: true,
        noModern: true,
        noMinorFast: true,
    });

    const chagDates = events
        .filter((ev) => (ev.getFlags() & flags.CHAG) === flags.CHAG)
        .map((ev) => ({ date: gregToUtcMidnight(ev.getDate().greg()), basename: ev.basename() }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const map = new Map<string, DayBlock>();
    const setBlock = (date: Date, part: 'morning' | 'evening', info: HolidayInfo) => {
        const key = toIsoDate(date);
        const existing = map.get(key);
        if (existing) {
            existing[part] = true;
            return;
        }
        map.set(key, { morning: part === 'morning', evening: part === 'evening', info });
    };

    let i = 0;
    while (i < chagDates.length) {
        const spanStart = chagDates[i].date;
        const info = HOLIDAY_INFO[chagDates[i].basename];
        let spanEnd = spanStart;

        // Merge consecutive CHAG days (Rosh Hashana I -> II) into one span, so the
        // night between them stays blocked instead of being treated as "motzei".
        while (
            i + 1 < chagDates.length &&
            toIsoDate(addUtcDays(spanEnd, 1)) === toIsoDate(chagDates[i + 1].date)
        ) {
            i++;
            spanEnd = chagDates[i].date;
        }

        if (info) {
            // Erev — candle-lighting the evening before the span begins.
            setBlock(addUtcDays(spanStart, -1), 'evening', info);

            for (let d = spanStart; d.getTime() <= spanEnd.getTime(); d = addUtcDays(d, 1)) {
                setBlock(d, 'morning', info);
                // Every day except the span's last day also blocks that evening —
                // the last day's evening is motzei (after nightfall the chag has
                // ended) and stays open, mirroring the Shabbat Saturday-evening rule.
                if (toIsoDate(d) !== toIsoDate(spanEnd)) {
                    setBlock(d, 'evening', info);
                }
            }
        }

        i++;
    }

    return map;
}

function getYearBlockMap(year: number): Promise<Map<string, DayBlock>> {
    let cached = yearCache.get(year);
    if (!cached) {
        cached = buildYearBlockMap(year);
        yearCache.set(year, cached);
    }
    return cached;
}

// Returns the holiday info if this exact shift (date + MORNING/EVENING) falls inside a
// blocked Yom Tov window, or null if it's open (including every Chol HaMoed, Chanukah,
// and Purim day, which are never blocked).
export async function getHolidayBlock(date: Date, type: ShiftType): Promise<HolidayInfo | null> {
    const map = await getYearBlockMap(date.getUTCFullYear());
    const block = map.get(toIsoDate(date));
    if (!block) {
        return null;
    }
    const blocked = type === 'MORNING' ? block.morning : block.evening;
    return blocked ? block.info : null;
}

export async function isHolidayBlockedShift(date: Date, type: ShiftType): Promise<boolean> {
    return (await getHolidayBlock(date, type)) !== null;
}

export interface ObservanceInfo {
    label: string;
    emoji: string;
}

// Chol HaMoed's basename() collapses back to the parent Yom Tov's own name ("Pesach"/
// "Sukkot") — indistinguishable from the CHAG days themselves without checking the
// CHOL_HAMOED flag separately, which is why this can't reuse HOLIDAY_INFO above.
const CHOL_HAMOED_INFO: Record<string, ObservanceInfo> = {
    Pesach: { label: 'חול המועד פסח', emoji: '🫓' },
    Sukkot: { label: 'חול המועד סוכות', emoji: '🌿' },
};

// Purely informational, never blocking — explicit user requirement: Chol HaMoed,
// Chanukah, and Purim must never restrict shift assignment, but are worth a visual
// marker on the calendar so volunteers/admins have the context.
const observanceYearCache = new Map<number, Promise<Map<string, ObservanceInfo>>>();

async function buildYearObservanceMap(year: number): Promise<Map<string, ObservanceInfo>> {
    const { HebrewCalendar, flags } = await loadHebcal();

    const events = HebrewCalendar.calendar({
        year,
        isHebrewYear: false,
        il: true,
        noRoshChodesh: true,
        noSpecialShabbat: true,
        noModern: true,
        noMinorFast: true,
    });

    const map = new Map<string, ObservanceInfo>();
    for (const ev of events) {
        const key = toIsoDate(gregToUtcMidnight(ev.getDate().greg()));

        if ((ev.getFlags() & flags.CHOL_HAMOED) === flags.CHOL_HAMOED) {
            const info = CHOL_HAMOED_INFO[ev.basename()];
            if (info) {
                map.set(key, info);
            }
            continue;
        }
        if (ev.basename() === 'Chanukah') {
            map.set(key, { label: 'חנוכה', emoji: '🕎' });
            continue;
        }
        // basename() collapses "Erev Purim" and "Purim" to the same "Purim" key —
        // excluding Erev keeps the badge on the actual day of Purim itself.
        if (ev.basename() === 'Purim' && !ev.getDesc().startsWith('Erev')) {
            map.set(key, { label: 'פורים', emoji: '🎭' });
        }
    }

    return map;
}

function getYearObservanceMap(year: number): Promise<Map<string, ObservanceInfo>> {
    let cached = observanceYearCache.get(year);
    if (!cached) {
        cached = buildYearObservanceMap(year);
        observanceYearCache.set(year, cached);
    }
    return cached;
}

// Whole-day, not shift-type-specific — unlike getHolidayBlock, this never blocks
// anything, so there's no morning/evening distinction to make.
export async function getObservance(date: Date): Promise<ObservanceInfo | null> {
    const map = await getYearObservanceMap(date.getUTCFullYear());
    return map.get(toIsoDate(date)) ?? null;
}
