"use strict";
// Intentionally ignore TS issues in this file to avoid docs being built with `| DateTime`
// TODO: Remove if temporal adapters are supported
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TemporalAdapterLuxon = void 0;
var _luxon = require("luxon");
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
  weekday: 'cccc',
  weekday3Letters: 'ccc',
  weekday1Letter: 'ccccc',
  meridiem: 'a',
  // Full formats
  localizedDateWithFullMonthAndWeekDay: 'DDDD',
  localizedNumericDate: 'D',
  fullMonthAndYear: 'MMMM yyyy'
};

// Temporarily disabled to avoid docs being built with `| DateTime`
// declare module '@base-ui/react/internals/temporal' {
//   interface TemporalSupportedObjectLookup {
//     luxon: DateTime;
//   }
// }

class TemporalAdapterLuxon {
  isTimezoneCompatible = true;
  lib = 'luxon';
  formats = FORMATS;
  escapedCharacters = {
    start: "'",
    end: "'"
  };
  constructor({
    locale
  } = {}) {
    this.locale = locale ?? 'en-US';
  }
  setLocaleToValue = value => {
    const expectedLocale = this.getCurrentLocaleCode();
    if (expectedLocale === value.locale) {
      return value;
    }
    return value.setLocale(expectedLocale);
  };
  now = timezone => {
    // @ts-expect-error locale is not identified as a field
    return _luxon.DateTime.fromJSDate(new Date(), {
      locale: this.locale,
      zone: timezone
    });
  };
  date = (value, timezone) => {
    if (value === null) {
      return null;
    }
    return _luxon.DateTime.fromISO(value, {
      locale: this.locale,
      zone: timezone
    });
  };
  parse = (value, format, timezone) => {
    return _luxon.DateTime.fromFormat(value, format, {
      locale: this.locale,
      zone: timezone
    });
  };
  getTimezone = value => {
    // When using the system zone, we want to return "system", not something like "Europe/Paris"
    if (value.zone.type === 'system') {
      return 'system';
    }
    return value.zoneName;
  };
  setTimezone = (value, timezone) => {
    if (!value.zone.equals(_luxon.Info.normalizeZone(timezone))) {
      return value.setZone(timezone);
    }
    return value;
  };
  toJsDate = value => {
    return value.toJSDate();
  };
  getCurrentLocaleCode = () => {
    return this.locale;
  };
  isValid = value => {
    if (value == null) {
      return false;
    }
    return value.isValid;
  };
  format = (value, formatKey) => {
    return this.formatByString(value, this.formats[formatKey]);
  };
  formatByString = (value, format) => {
    return value.setLocale(this.locale).toFormat(format);
  };
  isEqual = (value, comparing) => {
    if (value === null && comparing === null) {
      return true;
    }
    if (value === null || comparing === null) {
      return false;
    }
    return +value === +comparing;
  };
  isSameYear = (value, comparing) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'year');
  };
  isSameMonth = (value, comparing) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'month');
  };
  isSameDay = (value, comparing) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'day');
  };
  isSameHour = (value, comparing) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'hour');
  };
  isAfter = (value, comparing) => {
    return value > comparing;
  };
  isBefore = (value, comparing) => {
    return value < comparing;
  };
  isWithinRange = (value, [start, end]) => {
    if (this.isAfter(value, start) && this.isBefore(value, end)) {
      return true;
    }
    return this.isEqual(value, start) || this.isEqual(value, end);
  };
  startOfYear = value => {
    return value.startOf('year');
  };
  startOfMonth = value => {
    return value.startOf('month');
  };
  startOfWeek = value => {
    return this.setLocaleToValue(value).startOf('week', {
      useLocaleWeeks: true
    });
  };
  startOfDay = value => {
    return value.startOf('day');
  };
  startOfHour = value => {
    return value.startOf('hour');
  };
  startOfMinute = value => {
    return value.startOf('minute');
  };
  startOfSecond = value => {
    return value.startOf('second');
  };
  endOfYear = value => {
    return value.endOf('year');
  };
  endOfMonth = value => {
    return value.endOf('month');
  };
  endOfWeek = value => {
    return this.setLocaleToValue(value).endOf('week', {
      useLocaleWeeks: true
    });
  };
  endOfDay = value => {
    return value.endOf('day');
  };
  endOfHour = value => {
    return value.endOf('hour');
  };
  endOfMinute = value => {
    return value.endOf('minute');
  };
  endOfSecond = value => {
    return value.endOf('second');
  };
  addYears = (value, amount) => {
    return value.plus({
      years: amount
    });
  };
  addMonths = (value, amount) => {
    return value.plus({
      months: amount
    });
  };
  addWeeks = (value, amount) => {
    return value.plus({
      weeks: amount
    });
  };
  addDays = (value, amount) => {
    return value.plus({
      days: amount
    });
  };
  addHours = (value, amount) => {
    return value.plus({
      hours: amount
    });
  };
  addMinutes = (value, amount) => {
    return value.plus({
      minutes: amount
    });
  };
  addSeconds = (value, amount) => {
    return value.plus({
      seconds: amount
    });
  };
  addMilliseconds = (value, amount) => {
    return value.plus({
      milliseconds: amount
    });
  };
  getYear = value => {
    return value.get('year');
  };
  getMonth = value => {
    // See https://github.com/moment/luxon/blob/master/docs/moment.md#major-functional-differences
    return value.get('month') - 1;
  };
  getDate = value => {
    return value.get('day');
  };
  getHours = value => {
    return value.get('hour');
  };
  getMinutes = value => {
    return value.get('minute');
  };
  getSeconds = value => {
    return value.get('second');
  };
  getMilliseconds = value => {
    return value.get('millisecond');
  };
  getTime = value => {
    return value.toMillis();
  };
  setYear = (value, year) => {
    return value.set({
      year
    });
  };
  setMonth = (value, month) => {
    // See https://github.com/moment/luxon/blob/master/docs/moment.md#major-functional-differences
    return value.set({
      month: month + 1
    });
  };
  setDate = (value, date) => {
    return value.set({
      day: date
    });
  };
  setHours = (value, hours) => {
    return value.set({
      hour: hours
    });
  };
  setMinutes = (value, minutes) => {
    return value.set({
      minute: minutes
    });
  };
  setSeconds = (value, seconds) => {
    return value.set({
      second: seconds
    });
  };
  setMilliseconds = (value, milliseconds) => {
    return value.set({
      millisecond: milliseconds
    });
  };
  differenceInYears = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'years').as('years'));
  };
  differenceInMonths = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'months').as('months'));
  };
  differenceInWeeks = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'weeks').as('weeks'));
  };
  differenceInDays = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'days').as('days'));
  };
  differenceInHours = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'hours').as('hours'));
  };
  differenceInMinutes = (value, comparing) => {
    return Math.floor(value.diff(comparing, 'minutes').as('minutes'));
  };
  getDaysInMonth = value => {
    return value.daysInMonth;
  };
  getWeekNumber = value => {
    /* istanbul ignore next */
    return value.localWeekNumber ?? value.weekNumber;
  };
  getDayOfWeek = value => {
    /* istanbul ignore next */
    return value.localWeekday ?? value.weekday;
  };
}
exports.TemporalAdapterLuxon = TemporalAdapterLuxon;