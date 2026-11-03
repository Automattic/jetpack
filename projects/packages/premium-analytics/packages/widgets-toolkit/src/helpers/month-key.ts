export const MONTHS_IN_YEAR = 12;

/** A calendar month; `month` is zero-based, as `Date` counts it. */
export type MonthKey = { year: number; month: number };

/** The month's position in a single sequence, so months compare across years. */
export const monthOrder = ( { year, month }: MonthKey ) => year * MONTHS_IN_YEAR + month;
