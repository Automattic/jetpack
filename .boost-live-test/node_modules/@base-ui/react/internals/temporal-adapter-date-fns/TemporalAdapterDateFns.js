"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TemporalAdapterDateFns = void 0;
var _addDays = require("date-fns/addDays");
var _addHours = require("date-fns/addHours");
var _addMinutes = require("date-fns/addMinutes");
var _addMonths = require("date-fns/addMonths");
var _addSeconds = require("date-fns/addSeconds");
var _addMilliseconds = require("date-fns/addMilliseconds");
var _addWeeks = require("date-fns/addWeeks");
var _addYears = require("date-fns/addYears");
var _differenceInDays = require("date-fns/differenceInDays");
var _differenceInHours = require("date-fns/differenceInHours");
var _differenceInMinutes = require("date-fns/differenceInMinutes");
var _differenceInMonths = require("date-fns/differenceInMonths");
var _differenceInWeeks = require("date-fns/differenceInWeeks");
var _differenceInYears = require("date-fns/differenceInYears");
var _endOfDay = require("date-fns/endOfDay");
var _endOfHour = require("date-fns/endOfHour");
var _endOfMinute = require("date-fns/endOfMinute");
var _endOfMonth = require("date-fns/endOfMonth");
var _endOfSecond = require("date-fns/endOfSecond");
var _endOfWeek = require("date-fns/endOfWeek");
var _endOfYear = require("date-fns/endOfYear");
var _format = require("date-fns/format");
var _getDate = require("date-fns/getDate");
var _getDay = require("date-fns/getDay");
var _getDaysInMonth = require("date-fns/getDaysInMonth");
var _getHours = require("date-fns/getHours");
var _getMilliseconds = require("date-fns/getMilliseconds");
var _getMinutes = require("date-fns/getMinutes");
var _getMonth = require("date-fns/getMonth");
var _getSeconds = require("date-fns/getSeconds");
var _getWeek = require("date-fns/getWeek");
var _getYear = require("date-fns/getYear");
var _isAfter = require("date-fns/isAfter");
var _isBefore = require("date-fns/isBefore");
var _isEqual = require("date-fns/isEqual");
var _isSameDay = require("date-fns/isSameDay");
var _isSameHour = require("date-fns/isSameHour");
var _isSameYear = require("date-fns/isSameYear");
var _isSameMonth = require("date-fns/isSameMonth");
var _isValid = require("date-fns/isValid");
var _isWithinInterval = require("date-fns/isWithinInterval");
var _enUS = require("date-fns/locale/en-US");
var _parse = require("date-fns/parse");
var _setDate = require("date-fns/setDate");
var _setHours = require("date-fns/setHours");
var _setMilliseconds = require("date-fns/setMilliseconds");
var _setMinutes = require("date-fns/setMinutes");
var _setMonth = require("date-fns/setMonth");
var _setSeconds = require("date-fns/setSeconds");
var _setYear = require("date-fns/setYear");
var _startOfDay = require("date-fns/startOfDay");
var _startOfHour = require("date-fns/startOfHour");
var _startOfMinute = require("date-fns/startOfMinute");
var _startOfMonth = require("date-fns/startOfMonth");
var _startOfSecond = require("date-fns/startOfSecond");
var _startOfYear = require("date-fns/startOfYear");
var _startOfWeek = require("date-fns/startOfWeek");
var _tz = require("@date-fns/tz");
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
class TemporalAdapterDateFns {
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
    this.locale = locale ?? _enUS.enUS;
  }
  now = timezone => {
    if (timezone === 'system' || timezone === 'default') {
      return new Date();
    }
    return _tz.TZDate.tz(timezone);
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
    return new _tz.TZDate(isDateOnly ? date.getUTCFullYear() : date.getFullYear(), isDateOnly ? date.getUTCMonth() : date.getMonth(), isDateOnly ? date.getUTCDate() : date.getDate(), isDateOnly ? date.getUTCHours() : date.getHours(), isDateOnly ? date.getUTCMinutes() : date.getMinutes(), isDateOnly ? date.getUTCSeconds() : date.getSeconds(), isDateOnly ? date.getUTCMilliseconds() : date.getMilliseconds(), timezone);
  };
  parse = (value, format, timezone) => {
    const date = (0, _parse.parse)(value, format, new Date(), {
      locale: this.locale
    });
    if (timezone === 'system' || timezone === 'default') {
      return date;
    }

    // `new TZDate(value, timezone)` returns a date with the same timestamp `new Date(value)` would return,
    // whereas we want to create that represents the string in the given timezone.
    return new _tz.TZDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(), timezone);
  };
  getTimezone = value => {
    if (value instanceof _tz.TZDate) {
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
    return new _tz.TZDate(value, timezone);
  };
  toJsDate = value => {
    if (value instanceof _tz.TZDate) {
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
    return (0, _isValid.isValid)(value);
  };
  format = (value, formatKey) => {
    return this.formatByString(value, this.formats[formatKey]);
  };
  formatByString = (value, format) => {
    return (0, _format.format)(value, format, {
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
    return (0, _isEqual.isEqual)(value, comparing);
  };
  isSameYear = (value, comparing) => {
    return (0, _isSameYear.isSameYear)(value, comparing);
  };
  isSameMonth = (value, comparing) => {
    return (0, _isSameMonth.isSameMonth)(value, comparing);
  };
  isSameDay = (value, comparing) => {
    return (0, _isSameDay.isSameDay)(value, comparing);
  };
  isSameHour = (value, comparing) => {
    return (0, _isSameHour.isSameHour)(value, comparing);
  };
  isAfter = (value, comparing) => {
    return (0, _isAfter.isAfter)(value, comparing);
  };
  isBefore = (value, comparing) => {
    return (0, _isBefore.isBefore)(value, comparing);
  };
  isWithinRange = (value, [start, end]) => {
    return (0, _isWithinInterval.isWithinInterval)(value, {
      start,
      end
    });
  };
  startOfYear = value => {
    return (0, _startOfYear.startOfYear)(value);
  };
  startOfMonth = value => {
    return (0, _startOfMonth.startOfMonth)(value);
  };
  startOfWeek = value => {
    return (0, _startOfWeek.startOfWeek)(value, {
      locale: this.locale
    });
  };
  startOfDay = value => {
    return (0, _startOfDay.startOfDay)(value);
  };
  startOfHour = value => {
    return (0, _startOfHour.startOfHour)(value);
  };
  startOfMinute = value => {
    return (0, _startOfMinute.startOfMinute)(value);
  };
  startOfSecond = value => {
    return (0, _startOfSecond.startOfSecond)(value);
  };
  endOfYear = value => {
    return (0, _endOfYear.endOfYear)(value);
  };
  endOfMonth = value => {
    return (0, _endOfMonth.endOfMonth)(value);
  };
  endOfWeek = value => {
    return (0, _endOfWeek.endOfWeek)(value, {
      locale: this.locale
    });
  };
  endOfDay = value => {
    return (0, _endOfDay.endOfDay)(value);
  };
  endOfHour = value => {
    return (0, _endOfHour.endOfHour)(value);
  };
  endOfMinute = value => {
    return (0, _endOfMinute.endOfMinute)(value);
  };
  endOfSecond = value => {
    return (0, _endOfSecond.endOfSecond)(value);
  };
  addYears = (value, amount) => {
    return (0, _addYears.addYears)(value, amount);
  };
  addMonths = (value, amount) => {
    return (0, _addMonths.addMonths)(value, amount);
  };
  addWeeks = (value, amount) => {
    return (0, _addWeeks.addWeeks)(value, amount);
  };
  addDays = (value, amount) => {
    return (0, _addDays.addDays)(value, amount);
  };
  addHours = (value, amount) => {
    return (0, _addHours.addHours)(value, amount);
  };
  addMinutes = (value, amount) => {
    return (0, _addMinutes.addMinutes)(value, amount);
  };
  addSeconds = (value, amount) => {
    return (0, _addSeconds.addSeconds)(value, amount);
  };
  addMilliseconds = (value, amount) => {
    return (0, _addMilliseconds.addMilliseconds)(value, amount);
  };
  getYear = value => {
    return (0, _getYear.getYear)(value);
  };
  getMonth = value => {
    return (0, _getMonth.getMonth)(value);
  };
  getDate = value => {
    return (0, _getDate.getDate)(value);
  };
  getHours = value => {
    return (0, _getHours.getHours)(value);
  };
  getMinutes = value => {
    return (0, _getMinutes.getMinutes)(value);
  };
  getSeconds = value => {
    return (0, _getSeconds.getSeconds)(value);
  };
  getMilliseconds = value => {
    return (0, _getMilliseconds.getMilliseconds)(value);
  };
  getTime = value => {
    return value.getTime();
  };
  setYear = (value, year) => {
    return (0, _setYear.setYear)(value, year);
  };
  setMonth = (value, month) => {
    return (0, _setMonth.setMonth)(value, month);
  };
  setDate = (value, date) => {
    return (0, _setDate.setDate)(value, date);
  };
  setHours = (value, hours) => {
    return (0, _setHours.setHours)(value, hours);
  };
  setMinutes = (value, minutes) => {
    return (0, _setMinutes.setMinutes)(value, minutes);
  };
  setSeconds = (value, seconds) => {
    return (0, _setSeconds.setSeconds)(value, seconds);
  };
  setMilliseconds = (value, milliseconds) => {
    return (0, _setMilliseconds.setMilliseconds)(value, milliseconds);
  };
  differenceInYears = (value, comparing) => {
    return (0, _differenceInYears.differenceInYears)(value, comparing);
  };
  differenceInMonths = (value, comparing) => {
    return (0, _differenceInMonths.differenceInMonths)(value, comparing);
  };
  differenceInWeeks = (value, comparing) => {
    return (0, _differenceInWeeks.differenceInWeeks)(value, comparing);
  };
  differenceInDays = (value, comparing) => {
    return (0, _differenceInDays.differenceInDays)(value, comparing);
  };
  differenceInHours = (value, comparing) => {
    return (0, _differenceInHours.differenceInHours)(value, comparing);
  };
  differenceInMinutes = (value, comparing) => {
    return (0, _differenceInMinutes.differenceInMinutes)(value, comparing);
  };
  getDaysInMonth = value => {
    return (0, _getDaysInMonth.getDaysInMonth)(value);
  };
  getWeekNumber = value => {
    return (0, _getWeek.getWeek)(value, {
      locale: this.locale
    });
  };
  getDayOfWeek = value => {
    const weekStartsOn = this.locale.options?.weekStartsOn ?? 0;
    return ((0, _getDay.getDay)(value) + 7 - weekStartsOn) % 7 + 1;
  };
}
exports.TemporalAdapterDateFns = TemporalAdapterDateFns;