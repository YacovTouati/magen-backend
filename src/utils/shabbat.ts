import { ShiftType } from '../types/schedule';

// Organizational policy: no volunteer shift during Shabbat. Friday's EVENING shift
// (candle-lighting/כניסת שבת) and Saturday's MORNING shift are blocked outright;
// Saturday EVENING (after הבדלה) stays a normal, assignable shift. Pure function of
// the shift's own date/type — no schema flag needed, and it applies retroactively
// to every already-generated schedule without a backfill.
//
// Shift.date is stored as UTC midnight (see ScheduleRepository.createWithShifts), so
// getUTCDay() is the correct accessor here — a local-timezone getDay() could drift
// the weekday depending on the server's TZ.
export function isShabbatBlockedShift(date: Date, type: ShiftType): boolean {
    const weekday = date.getUTCDay(); // 0=Sunday ... 5=Friday, 6=Saturday
    return (weekday === 5 && type === 'EVENING') || (weekday === 6 && type === 'MORNING');
}
