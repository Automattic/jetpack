'use client';

import { addDays } from 'date-fns/addDays';
import { addHours } from 'date-fns/addHours';
import { addMinutes } from 'date-fns/addMinutes';
import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { addMilliseconds } from 'date-fns/addMilliseconds';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { differenceInDays } from 'date-fns/differenceInDays';
import { differenceInHours } from 'date-fns/differenceInHours';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { differenceInMonths } from 'date-fns/differenceInMonths';
import { differenceInWeeks } from 'date-fns/differenceInWeeks';
import { differenceInYears } from 'date-fns/differenceInYears';
import { endOfDay } from 'date-fns/endOfDay';
import { endOfHour } from 'date-fns/endOfHour';
import { endOfMinute } from 'date-fns/endOfMinute';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfSecond } from 'date-fns/endOfSecond';
import { endOfWeek } from 'date-fns/endOfWeek';
import { endOfYear } from 'date-fns/endOfYear';
import { format as dateFnsFormat } from 'date-fns/format';
import { getDate } from 'date-fns/getDate';
import { getDay } from 'date-fns/getDay';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { getHours } from 'date-fns/getHours';
import { getMilliseconds } from 'date-fns/getMilliseconds';
import { getMinutes } from 'date-fns/getMinutes';
import { getMonth } from 'date-fns/getMonth';
import { getSeconds } from 'date-fns/getSeconds';
import { getWeek } from 'date-fns/getWeek';
import { getYear } from 'date-fns/getYear';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { isEqual } from 'date-fns/isEqual';
import { isSameDay } from 'date-fns/isSameDay';
import { isSameHour } from 'date-fns/isSameHour';
import { isSameYear } from 'date-fns/isSameYear';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isValid } from 'date-fns/isValid';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { enUS } from 'date-fns/locale/en-US';
import { parse } from 'date-fns/parse';
import { setDate } from 'date-fns/setDate';
import { setHours } from 'date-fns/setHours';
import { setMilliseconds } from 'date-fns/setMilliseconds';
import { setMinutes } from 'date-fns/setMinutes';
import { setMonth } from 'date-fns/setMonth';
import { setSeconds } from 'date-fns/setSeconds';
import { setYear } from 'date-fns/setYear';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfHour } from 'date-fns/startOfHour';
import { startOfMinute } from 'date-fns/startOfMinute';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfSecond } from 'date-fns/startOfSecond';
import { startOfYear } from 'date-fns/startOfYear';
import { startOfWeek } from 'date-fns/startOfWeek';
import { TZDate } from '@date-fns/tz';
const FORMATS = {
  // Digit formats with leading zeroes
  yearPadded: 'yyyy',
  monthPadded: 'MM',
  dayOfMonthPadded: 'dd',
  hours24hPadded: 'HH',
  hours12hPadded: 'hh',
  minutesPadded: 'mm',
  secondsPadded: 'ss',
  // Digit formats without leading zeroes
  dayOfMonth: 'd',
  hours24h: 'H',
  hours12h: 'h',
  // Letter formats
  month3Letters: 'MMM',
  monthFullLetter: 'MMMM',
  weekday: 'EEEE',
  weekday3Letters: 'EEE',
  weekday1Letter: 'EEEEE',
  meridiem: 'a',
  // Full formats
  localizedDateWithFullMonthAndWeekDay: 'PPPP',
  localizedNumericDate: 'P' // Note: Day and month are padded on enUS unlike Luxon
};
export class TemporalAdapterDateFns {
  isTimezoneCompatible = true;
  lib = 'date-fns';
  formats = FORMATS;
  escapedCharacters = {
    start: "'",
    end: "'"
  };
  constructor({
    locale
  } = {}) {
    this.locale = locale ?? enUS;
  }
  now = timezone => {
    if (timezone === 'system' || timezone === 'default') {
      return new Date();
    }
    return TZDate.tz(timezone);
  };
  date = (value, timezone) => {
    if (value === null) {
      return null;
    }
    const date = new Date(value);

    // Date-only strings (e.g. "2026-04-06") are parsed as UTC midnight by the JS spec,
    // so we must use UTC getters to extract the intended face-value components.
    // Datetime strings (e.g. "2026-04-06T14:30") are parsed as local time,
    // so local getters correctly return the face-value components.
    const isDateOnly = typeof value === 'string' && !value.includes('T');
    if (timezone === 'system' || timezone === 'default') {
      if (isDateOnly) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      }
      return date;
    }

    // `new TZDate(value, timezone)` returns a date with the same timestamp `new Date(value)` would return,
    // whereas we want to create a date that represents the string in the given timezone.
    return new TZDate(isDateOnly ? date.getUTCFullYear() : date.getFullYear(), isDateOnly ? date.getUTCMonth() : date.getMonth(), isDateOnly ? date.getUTCDate() : date.getDate(), isDateOnly ? date.getUTCHours() : date.getHours(), isDateOnly ? date.getUTCMinutes() : date.getMinutes(), isDateOnly ? date.getUTCSeconds() : date.getSeconds(), isDateOnly ? date.getUTCMilliseconds() : date.getMilliseconds(), timezone);
  };
  parse = (value, format, timezone) => {
    const date = parse(value, format, new Date(), {
      locale: this.locale
    });
    if (timezone === 'system' || timezone === 'default') {
      return date;
    }

    // `new TZDate(value, timezone)` returns a date with the same timestamp `new Date(value)` would return,
    // whereas we want to create that represents the string in the given timezone.
    return new TZDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(), timezone);
  };
  getTimezone = value => {
    if (value instanceof TZDate) {
      return value.timeZone ?? 'system';
    }
    return 'system';
  };
  setTimezone = (value, timezone) => {
    const isSystemTimezone = timezone === 'system' || timezone === 'default';
    const canChangeTz = typeof value?.withTimeZone === 'function';
    if (isSystemTimezone) {
      return this.toJsDate(value);
    }
    if (canChangeTz) {
      return value.withTimeZone(timezone);
    }
    return new TZDate(value, timezone);
  };
  toJsDate = value => {
    if (value instanceof TZDate) {
      return new Date(value.getTime());
    }
    return value;
  };
  getCurrentLocaleCode = () => {
    return this.locale.code;
  };
  isValid = value => {
    if (value == null) {
      return false;
    }
    return isValid(value);
  };
  format = (value, formatKey) => {
    return this.formatByString(value, this.formats[formatKey]);
  };
  formatByString = (value, format) => {
    return dateFnsFormat(value, format, {
      locale: this.locale
    });
  };
  isEqual = (value, comparing) => {
    if (value === null && comparing === null) {
      return true;
    }
    if (value === null || comparing === null) {
      return false;
    }
    return isEqual(value, comparing);
  };
  isSameYear = (value, comparing) => {
    return isSameYear(value, comparing);
  };
  isSameMonth = (value, comparing) => {
    return isSameMonth(value, comparing);
  };
  isSameDay = (value, comparing) => {
    return isSameDay(value, comparing);
  };
  isSameHour = (value, comparing) => {
    return isSameHour(value, comparing);
  };
  isAfter = (value, comparing) => {
    return isAfter(value, comparing);
  };
  isBefore = (value, comparing) => {
    return isBefore(value, comparing);
  };
  isWithinRange = (value, [start, end]) => {
    return isWithinInterval(value, {
      start,
      end
    });
  };
  startOfYear = value => {
    return startOfYear(value);
  };
  startOfMonth = value => {
    return startOfMonth(value);
  };
  startOfWeek = value => {
    return startOfWeek(value, {
      locale: this.locale
    });
  };
  startOfDay = value => {
    return startOfDay(value);
  };
  startOfHour = value => {
    return startOfHour(value);
  };
  startOfMinute = value => {
    return startOfMinute(value);
  };
  startOfSecond = value => {
    return startOfSecond(value);
  };
  endOfYear = value => {
    return endOfYear(value);
  };
  endOfMonth = value => {
    return endOfMonth(value);
  };
  endOfWeek = value => {
    return endOfWeek(value, {
      locale: this.locale
    });
  };
  endOfDay = value => {
    return endOfDay(value);
  };
  endOfHour = value => {
    return endOfHour(value);
  };
  endOfMinute = value => {
    return endOfMinute(value);
  };
  endOfSecond = value => {
    return endOfSecond(value);
  };
  addYears = (value, amount) => {
    return addYears(value, amount);
  };
  addMonths = (value, amount) => {
    return addMonths(value, amount);
  };
  addWeeks = (value, amount) => {
    return addWeeks(value, amount);
  };
  addDays = (value, amount) => {
    return addDays(value, amount);
  };
  addHours = (value, amount) => {
    return addHours(value, amount);
  };
  addMinutes = (value, amount) => {
    return addMinutes(value, amount);
  };
  addSeconds = (value, amount) => {
    return addSeconds(value, amount);
  };
  addMilliseconds = (value, amount) => {
    return addMilliseconds(value, amount);
  };
  getYear = value => {
    return getYear(value);
  };
  getMonth = value => {
    return getMonth(value);
  };
  getDate = value => {
    return getDate(value);
  };
  getHours = value => {
    return getHours(value);
  };
  getMinutes = value => {
    return getMinutes(value);
  };
  getSeconds = value => {
    return getSeconds(value);
  };
  getMilliseconds = value => {
    return getMilliseconds(value);
  };
  getTime = value => {
    return value.getTime();
  };
  setYear = (value, year) => {
    return setYear(value, year);
  };
  setMonth = (value, month) => {
    return setMonth(value, month);
  };
  setDate = (value, date) => {
    return setDate(value, date);
  };
  setHours = (value, hours) => {
    return setHours(value, hours);
  };
  setMinutes = (value, minutes) => {
    return setMinutes(value, minutes);
  };
  setSeconds = (value, seconds) => {
    return setSeconds(value, seconds);
  };
  setMilliseconds = (value, milliseconds) => {
    return setMilliseconds(value, milliseconds);
  };
  differenceInYears = (value, comparing) => {
    return differenceInYears(value, comparing);
  };
  differenceInMonths = (value, comparing) => {
    return differenceInMonths(value, comparing);
  };
  differenceInWeeks = (value, comparing) => {
    return differenceInWeeks(value, comparing);
  };
  differenceInDays = (value, comparing) => {
    return differenceInDays(value, comparing);
  };
  differenceInHours = (value, comparing) => {
    return differenceInHours(value, comparing);
  };
  differenceInMinutes = (value, comparing) => {
    return differenceInMinutes(value, comparing);
  };
  getDaysInMonth = value => {
    return getDaysInMonth(value);
  };
  getWeekNumber = value => {
    return getWeek(value, {
      locale: this.locale
    });
  };
  getDayOfWeek = value => {
    const weekStartsOn = this.locale.options?.weekStartsOn ?? 0;
    return (getDay(value) + 7 - weekStartsOn) % 7 + 1;
  };
}