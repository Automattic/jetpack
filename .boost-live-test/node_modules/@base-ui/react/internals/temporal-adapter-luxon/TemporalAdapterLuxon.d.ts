import { DateTime } from 'luxon';
import { TemporalAdapterFormats, DateBuilderReturnType, TemporalTimezone, TemporalAdapter } from "../temporal/index.js";
export declare class TemporalAdapterLuxon implements TemporalAdapter {
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
  }?: TemporalAdapterLuxon.ConstructorParameters);
  private setLocaleToValue;
  now: (timezone: TemporalTimezone) => DateTime<boolean>;
  date: <T extends string | null>(value: T, timezone: TemporalTimezone) => DateBuilderReturnType<T>;
  parse: (value: string, format: string, timezone: TemporalTimezone) => DateTime;
  getTimezone: (value: DateTime) => string;
  setTimezone: (value: DateTime, timezone: TemporalTimezone) => DateTime;
  toJsDate: (value: DateTime) => Date;
  getCurrentLocaleCode: () => string;
  isValid: (value: DateTime | null) => value is DateTime;
  format: (value: DateTime, formatKey: keyof TemporalAdapterFormats) => string;
  formatByString: (value: DateTime, format: string) => string;
  isEqual: (value: DateTime | null, comparing: DateTime | null) => boolean;
  isSameYear: (value: DateTime, comparing: DateTime) => boolean;
  isSameMonth: (value: DateTime, comparing: DateTime) => boolean;
  isSameDay: (value: DateTime, comparing: DateTime) => boolean;
  isSameHour: (value: DateTime, comparing: DateTime) => boolean;
  isAfter: (value: DateTime, comparing: DateTime) => boolean;
  isBefore: (value: DateTime, comparing: DateTime) => boolean;
  isWithinRange: (value: DateTime, [start, end]: [DateTime, DateTime]) => boolean;
  startOfYear: (value: DateTime) => DateTime<boolean>;
  startOfMonth: (value: DateTime) => DateTime<boolean>;
  startOfWeek: (value: DateTime) => DateTime<boolean>;
  startOfDay: (value: DateTime) => DateTime<boolean>;
  startOfHour: (value: DateTime) => DateTime<boolean>;
  startOfMinute: (value: DateTime) => DateTime<boolean>;
  startOfSecond: (value: DateTime) => DateTime<boolean>;
  endOfYear: (value: DateTime) => DateTime<boolean>;
  endOfMonth: (value: DateTime) => DateTime<boolean>;
  endOfWeek: (value: DateTime) => DateTime<boolean>;
  endOfDay: (value: DateTime) => DateTime<boolean>;
  endOfHour: (value: DateTime) => DateTime<boolean>;
  endOfMinute: (value: DateTime) => DateTime<boolean>;
  endOfSecond: (value: DateTime) => DateTime<boolean>;
  addYears: (value: DateTime, amount: number) => DateTime<boolean>;
  addMonths: (value: DateTime, amount: number) => DateTime<boolean>;
  addWeeks: (value: DateTime, amount: number) => DateTime<boolean>;
  addDays: (value: DateTime, amount: number) => DateTime<boolean>;
  addHours: (value: DateTime, amount: number) => DateTime<boolean>;
  addMinutes: (value: DateTime, amount: number) => DateTime<boolean>;
  addSeconds: (value: DateTime, amount: number) => DateTime<boolean>;
  addMilliseconds: (value: DateTime, amount: number) => DateTime<boolean>;
  getYear: (value: DateTime) => number;
  getMonth: (value: DateTime) => number;
  getDate: (value: DateTime) => number;
  getHours: (value: DateTime) => number;
  getMinutes: (value: DateTime) => number;
  getSeconds: (value: DateTime) => number;
  getMilliseconds: (value: DateTime) => number;
  getTime: (value: DateTime) => number;
  setYear: (value: DateTime, year: number) => DateTime<boolean>;
  setMonth: (value: DateTime, month: number) => DateTime<boolean>;
  setDate: (value: DateTime, date: number) => DateTime<boolean>;
  setHours: (value: DateTime, hours: number) => DateTime<boolean>;
  setMinutes: (value: DateTime, minutes: number) => DateTime<boolean>;
  setSeconds: (value: DateTime, seconds: number) => DateTime<boolean>;
  setMilliseconds: (value: DateTime, milliseconds: number) => DateTime<boolean>;
  differenceInYears: (value: DateTime, comparing: DateTime) => number;
  differenceInMonths: (value: DateTime, comparing: DateTime) => number;
  differenceInWeeks: (value: DateTime, comparing: DateTime) => number;
  differenceInDays: (value: DateTime, comparing: DateTime) => number;
  differenceInHours: (value: DateTime, comparing: DateTime) => number;
  differenceInMinutes: (value: DateTime, comparing: DateTime) => number;
  getDaysInMonth: (value: DateTime) => import("luxon").PossibleDaysInMonth;
  getWeekNumber: (value: DateTime) => number;
  getDayOfWeek: (value: DateTime) => number;
}
export declare namespace TemporalAdapterLuxon {
  interface ConstructorParameters {
    /**
     * The locale to use for formatting and parsing dates.
     * @default 'en-US'
     */
    locale?: string | undefined;
  }
}