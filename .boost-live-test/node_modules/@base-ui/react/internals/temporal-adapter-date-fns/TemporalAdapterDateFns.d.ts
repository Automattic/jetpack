import { Locale as DateFnsLocale } from 'date-fns/locale';
import { TemporalAdapterFormats, DateBuilderReturnType, TemporalTimezone, TemporalAdapter } from "../temporal/index.js";
declare module '@base-ui/react/internals/temporal' {
  interface TemporalSupportedObjectLookup {
    'date-fns': Date;
  }
}
export declare class TemporalAdapterDateFns implements TemporalAdapter {
  isTimezoneCompatible: boolean;
  lib: string;
  private locale;
  formats: TemporalAdapterFormats;
  escapedCharacters: {
    start: string;
    end: string;
  };
  constructor({
    locale
  }?: TemporalAdapterDateFns.ConstructorParameters);
  now: (timezone: TemporalTimezone) => Date;
  date: <T extends string | null>(value: T, timezone: TemporalTimezone) => DateBuilderReturnType<T>;
  parse: (value: string, format: string, timezone: TemporalTimezone) => Date;
  getTimezone: (value: Date) => string;
  setTimezone: (value: Date, timezone: TemporalTimezone) => Date;
  toJsDate: (value: Date) => Date;
  getCurrentLocaleCode: () => string;
  isValid: (value: Date | null) => value is Date;
  format: (value: Date, formatKey: keyof TemporalAdapterFormats) => string;
  formatByString: (value: Date, format: string) => string;
  isEqual: (value: Date | null, comparing: Date | null) => boolean;
  isSameYear: (value: Date, comparing: Date) => boolean;
  isSameMonth: (value: Date, comparing: Date) => boolean;
  isSameDay: (value: Date, comparing: Date) => boolean;
  isSameHour: (value: Date, comparing: Date) => boolean;
  isAfter: (value: Date, comparing: Date) => boolean;
  isBefore: (value: Date, comparing: Date) => boolean;
  isWithinRange: (value: Date, [start, end]: [Date, Date]) => boolean;
  startOfYear: (value: Date) => Date;
  startOfMonth: (value: Date) => Date;
  startOfWeek: (value: Date) => Date;
  startOfDay: (value: Date) => Date;
  startOfHour: (value: Date) => Date;
  startOfMinute: (value: Date) => Date;
  startOfSecond: (value: Date) => Date;
  endOfYear: (value: Date) => Date;
  endOfMonth: (value: Date) => Date;
  endOfWeek: (value: Date) => Date;
  endOfDay: (value: Date) => Date;
  endOfHour: (value: Date) => Date;
  endOfMinute: (value: Date) => Date;
  endOfSecond: (value: Date) => Date;
  addYears: (value: Date, amount: number) => Date;
  addMonths: (value: Date, amount: number) => Date;
  addWeeks: (value: Date, amount: number) => Date;
  addDays: (value: Date, amount: number) => Date;
  addHours: (value: Date, amount: number) => Date;
  addMinutes: (value: Date, amount: number) => Date;
  addSeconds: (value: Date, amount: number) => Date;
  addMilliseconds: (value: Date, amount: number) => Date;
  getYear: (value: Date) => number;
  getMonth: (value: Date) => number;
  getDate: (value: Date) => number;
  getHours: (value: Date) => number;
  getMinutes: (value: Date) => number;
  getSeconds: (value: Date) => number;
  getMilliseconds: (value: Date) => number;
  getTime: (value: Date) => number;
  setYear: (value: Date, year: number) => Date;
  setMonth: (value: Date, month: number) => Date;
  setDate: (value: Date, date: number) => Date;
  setHours: (value: Date, hours: number) => Date;
  setMinutes: (value: Date, minutes: number) => Date;
  setSeconds: (value: Date, seconds: number) => Date;
  setMilliseconds: (value: Date, milliseconds: number) => Date;
  differenceInYears: (value: Date, comparing: Date) => number;
  differenceInMonths: (value: Date, comparing: Date) => number;
  differenceInWeeks: (value: Date, comparing: Date) => number;
  differenceInDays: (value: Date, comparing: Date) => number;
  differenceInHours: (value: Date, comparing: Date) => number;
  differenceInMinutes: (value: Date, comparing: Date) => number;
  getDaysInMonth: (value: Date) => number;
  getWeekNumber: (value: Date) => number;
  getDayOfWeek: (value: Date) => number;
}
export declare namespace TemporalAdapterDateFns {
  interface ConstructorParameters {
    /**
     * The locale to use for formatting and parsing dates.
     * @default enUS
     */
    locale?: DateFnsLocale | undefined;
  }
}