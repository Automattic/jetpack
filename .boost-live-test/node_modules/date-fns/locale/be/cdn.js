(() => {
var _window$dateFns;function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);}function _slicedToArray(r, e) {return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(r, a) {if (r) {if ("string" == typeof r) return _arrayLikeToArray(r, a);var t = {}.toString.call(r).slice(8, -1);return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;}}function _arrayLikeToArray(r, a) {(null == a || a > r.length) && (a = r.length);for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];return n;}function _iterableToArrayLimit(r, l) {var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (null != t) {var e,n,i,u,a = [],f = !0,o = !1;try {if (i = (t = t.call(r)).next, 0 === l) {if (Object(t) !== t) return;f = !1;} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);} catch (r) {o = !0, n = r;} finally {try {if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;} finally {if (o) throw n;}}return a;}}function _arrayWithHoles(r) {if (Array.isArray(r)) return r;}function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);} //#region dist/date-fns/locale/be/_lib/formatDistance.js
function declension(scheme, count) {
  if (scheme.one !== void 0 && count === 1) return scheme.one;
  var rem10 = count % 10;
  var rem100 = count % 100;
  if (rem10 === 1 && rem100 !== 11) return scheme.singularNominative.replace("{{count}}", String(count));else
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) return scheme.singularGenitive.replace("{{count}}", String(count));else
  return scheme.pluralGenitive.replace("{{count}}", String(count));
}
function buildLocalizeTokenFn(scheme) {
  return function (count, options) {
    if (options && options.addSuffix) {if (options.comparison && options.comparison > 0) {if (scheme.future) return declension(scheme.future, count);else
        return "праз " + declension(scheme.regular, count);} else
      if (scheme.past) return declension(scheme.past, count);else
      return declension(scheme.regular, count) + " таму";} else
    return declension(scheme.regular, count);
  };
}
var halfAMinute = function halfAMinute(_, options) {
  if (options && options.addSuffix) if (options.comparison && options.comparison > 0) return "праз паўхвіліны";else
  return "паўхвіліны таму";
  return "паўхвіліны";
};
var formatDistanceLocale = {
  lessThanXSeconds: buildLocalizeTokenFn({
    regular: {
      one: "менш за секунду",
      singularNominative: "менш за {{count}} секунду",
      singularGenitive: "менш за {{count}} секунды",
      pluralGenitive: "менш за {{count}} секунд"
    },
    future: {
      one: "менш, чым праз секунду",
      singularNominative: "менш, чым праз {{count}} секунду",
      singularGenitive: "менш, чым праз {{count}} секунды",
      pluralGenitive: "менш, чым праз {{count}} секунд"
    }
  }),
  xSeconds: buildLocalizeTokenFn({
    regular: {
      singularNominative: "{{count}} секунда",
      singularGenitive: "{{count}} секунды",
      pluralGenitive: "{{count}} секунд"
    },
    past: {
      singularNominative: "{{count}} секунду таму",
      singularGenitive: "{{count}} секунды таму",
      pluralGenitive: "{{count}} секунд таму"
    },
    future: {
      singularNominative: "праз {{count}} секунду",
      singularGenitive: "праз {{count}} секунды",
      pluralGenitive: "праз {{count}} секунд"
    }
  }),
  halfAMinute: halfAMinute,
  lessThanXMinutes: buildLocalizeTokenFn({
    regular: {
      one: "менш за хвіліну",
      singularNominative: "менш за {{count}} хвіліну",
      singularGenitive: "менш за {{count}} хвіліны",
      pluralGenitive: "менш за {{count}} хвілін"
    },
    future: {
      one: "менш, чым праз хвіліну",
      singularNominative: "менш, чым праз {{count}} хвіліну",
      singularGenitive: "менш, чым праз {{count}} хвіліны",
      pluralGenitive: "менш, чым праз {{count}} хвілін"
    }
  }),
  xMinutes: buildLocalizeTokenFn({
    regular: {
      singularNominative: "{{count}} хвіліна",
      singularGenitive: "{{count}} хвіліны",
      pluralGenitive: "{{count}} хвілін"
    },
    past: {
      singularNominative: "{{count}} хвіліну таму",
      singularGenitive: "{{count}} хвіліны таму",
      pluralGenitive: "{{count}} хвілін таму"
    },
    future: {
      singularNominative: "праз {{count}} хвіліну",
      singularGenitive: "праз {{count}} хвіліны",
      pluralGenitive: "праз {{count}} хвілін"
    }
  }),
  aboutXHours: buildLocalizeTokenFn({
    regular: {
      singularNominative: "каля {{count}} гадзіны",
      singularGenitive: "каля {{count}} гадзін",
      pluralGenitive: "каля {{count}} гадзін"
    },
    future: {
      singularNominative: "прыблізна праз {{count}} гадзіну",
      singularGenitive: "прыблізна праз {{count}} гадзіны",
      pluralGenitive: "прыблізна праз {{count}} гадзін"
    }
  }),
  xHours: buildLocalizeTokenFn({
    regular: {
      singularNominative: "{{count}} гадзіна",
      singularGenitive: "{{count}} гадзіны",
      pluralGenitive: "{{count}} гадзін"
    },
    past: {
      singularNominative: "{{count}} гадзіну таму",
      singularGenitive: "{{count}} гадзіны таму",
      pluralGenitive: "{{count}} гадзін таму"
    },
    future: {
      singularNominative: "праз {{count}} гадзіну",
      singularGenitive: "праз {{count}} гадзіны",
      pluralGenitive: "праз {{count}} гадзін"
    }
  }),
  xDays: buildLocalizeTokenFn({ regular: {
      singularNominative: "{{count}} дзень",
      singularGenitive: "{{count}} дні",
      pluralGenitive: "{{count}} дзён"
    } }),
  aboutXWeeks: buildLocalizeTokenFn({
    regular: {
      singularNominative: "каля {{count}} тыдні",
      singularGenitive: "каля {{count}} тыдняў",
      pluralGenitive: "каля {{count}} тыдняў"
    },
    future: {
      singularNominative: "прыблізна праз {{count}} тыдзень",
      singularGenitive: "прыблізна праз {{count}} тыдні",
      pluralGenitive: "прыблізна праз {{count}} тыдняў"
    }
  }),
  xWeeks: buildLocalizeTokenFn({ regular: {
      singularNominative: "{{count}} тыдзень",
      singularGenitive: "{{count}} тыдні",
      pluralGenitive: "{{count}} тыдняў"
    } }),
  aboutXMonths: buildLocalizeTokenFn({
    regular: {
      singularNominative: "каля {{count}} месяца",
      singularGenitive: "каля {{count}} месяцаў",
      pluralGenitive: "каля {{count}} месяцаў"
    },
    future: {
      singularNominative: "прыблізна праз {{count}} месяц",
      singularGenitive: "прыблізна праз {{count}} месяцы",
      pluralGenitive: "прыблізна праз {{count}} месяцаў"
    }
  }),
  xMonths: buildLocalizeTokenFn({ regular: {
      singularNominative: "{{count}} месяц",
      singularGenitive: "{{count}} месяцы",
      pluralGenitive: "{{count}} месяцаў"
    } }),
  aboutXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: "каля {{count}} года",
      singularGenitive: "каля {{count}} гадоў",
      pluralGenitive: "каля {{count}} гадоў"
    },
    future: {
      singularNominative: "прыблізна праз {{count}} год",
      singularGenitive: "прыблізна праз {{count}} гады",
      pluralGenitive: "прыблізна праз {{count}} гадоў"
    }
  }),
  xYears: buildLocalizeTokenFn({ regular: {
      singularNominative: "{{count}} год",
      singularGenitive: "{{count}} гады",
      pluralGenitive: "{{count}} гадоў"
    } }),
  overXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: "больш за {{count}} год",
      singularGenitive: "больш за {{count}} гады",
      pluralGenitive: "больш за {{count}} гадоў"
    },
    future: {
      singularNominative: "больш, чым праз {{count}} год",
      singularGenitive: "больш, чым праз {{count}} гады",
      pluralGenitive: "больш, чым праз {{count}} гадоў"
    }
  }),
  almostXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: "амаль {{count}} год",
      singularGenitive: "амаль {{count}} гады",
      pluralGenitive: "амаль {{count}} гадоў"
    },
    future: {
      singularNominative: "амаль праз {{count}} год",
      singularGenitive: "амаль праз {{count}} гады",
      pluralGenitive: "амаль праз {{count}} гадоў"
    }
  })
};
var formatDistance = function formatDistance(token, count, options) {
  options = options || {};
  return formatDistanceLocale[token](count, options);
};
//#endregion
//#region dist/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return function () {var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var width = options.width ? String(options.width) : args.defaultWidth;
    return args.formats[width] || args.formats[args.defaultWidth];
  };
}
var formatLong = {
  date: buildFormatLongFn({
    formats: {
      full: "EEEE, d MMMM y 'г.'",
      long: "d MMMM y 'г.'",
      medium: "d MMM y 'г.'",
      short: "dd.MM.y"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "H:mm:ss zzzz",
      long: "H:mm:ss z",
      medium: "H:mm:ss",
      short: "H:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: { any: "{{date}}, {{time}}" },
    defaultWidth: "any"
  })
};
-(Math.pow(10, 8) * 24 * 60 * 60 * 1e3);
/**
* @constant
* @name constructFromSymbol
* @summary Symbol enabling Date extensions to inherit properties from the reference date.
*
* The symbol is used to enable the `constructFrom` function to construct a date
* using a reference date and a value. It allows to transfer extra properties
* from the reference date to the new date. It's useful for extensions like
* [`TZDate`](https://github.com/date-fns/tz) that accept a time zone as
* a constructor argument.
*/
var constructFromSymbol = Symbol.for("constructDateFrom");
//#endregion
//#region dist/date-fns/constructFrom.js
/**
* @name constructFrom
* @category Generic Helpers
* @summary Constructs a date using the reference date and the value
*
* @description
* The function constructs a new date using the constructor from the reference
* date and the given value. It helps to build generic functions that accept
* date extensions.
*
* It defaults to `Date` if the passed reference date is a number or a string.
*
* Starting from v3.7.0, it allows to construct a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
*
* @param date - The reference date to take constructor from
* @param value - The value to create the date
*
* @returns Date initialized using the given date and value
*
* @example
* import { constructFrom } from "./constructFrom/date-fns";
*
* // A function that clones a date preserving the original type
* function cloneDate<DateType extends Date>(date: DateType): DateType {
*   return constructFrom(
*     date, // Use constructor from the given date
*     date.getTime() // Use the date value to create a new date
*   );
* }
*/
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && _typeof(date) === "object" && constructFromSymbol in date) return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}
//#endregion
//#region dist/date-fns/_lib/normalizeDates.js
function normalizeDates(context) {for (var _len = arguments.length, dates = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {dates[_key - 1] = arguments[_key];}
  var normalize = constructFrom.bind(null, context || dates.find(function (date) {return _typeof(date) === "object";}));
  return dates.map(normalize);
}
//#endregion
//#region dist/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}
//#endregion
//#region dist/date-fns/toDate.js
/**
* @name toDate
* @category Common Helpers
* @summary Convert the given argument to an instance of Date.
*
* @description
* Convert the given argument to an instance of Date.
*
* If the argument is an instance of Date, the function returns its clone.
*
* If the argument is a number, it is treated as a timestamp.
*
* If the argument is none of the above, the function returns Invalid Date.
*
* Starting from v3.7.0, it clones a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param argument - The value to convert
*
* @returns The parsed date in the local time zone
*
* @example
* // Clone the date:
* const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
* //=> Tue Feb 11 2014 11:30:30
*
* @example
* // Convert the timestamp to date:
* const result = toDate(1392098430000)
* //=> Tue Feb 11 2014 11:30:30
*/
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}
//#endregion
//#region dist/date-fns/startOfWeek.js
/**
* The {@link startOfWeek} function options.
*/
/**
* @name startOfWeek
* @category Week Helpers
* @summary Return the start of a week for the given date.
*
* @description
* Return the start of a week for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a week
*
* @example
* // The start of a week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sun Aug 31 2014 00:00:00
*
* @example
* // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
* //=> Mon Sep 01 2014 00:00:00
*/
function startOfWeek(date, options) {var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _defaultOptions$local;
  var defaultOptions = getDefaultOptions();
  var weekStartsOn = (_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 || (_options$locale = options.locale) === null || _options$locale === void 0 || (_options$locale = _options$locale.options) === null || _options$locale === void 0 ? void 0 : _options$locale.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 || (_defaultOptions$local = _defaultOptions$local.options) === null || _defaultOptions$local === void 0 ? void 0 : _defaultOptions$local.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0;
  var _date = toDate(date, options === null || options === void 0 ? void 0 : options.in);
  var day = _date.getDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/isSameWeek.js
/**
* The {@link isSameWeek} function options.
*/
/**
* @name isSameWeek
* @category Week Helpers
* @summary Are the given dates in the same week (and month and year)?
*
* @description
* Are the given dates in the same week (and month and year)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same week (and month and year)
*
* @example
* // Are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4))
* //=> true
*
* @example
* // If week starts with Monday,
* // are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4), {
*   weekStartsOn: 1
* })
* //=> false
*
* @example
* // Are 1 January 2014 and 1 January 2015 in the same week?
* const result = isSameWeek(new Date(2014, 0, 1), new Date(2015, 0, 1))
* //=> false
*/
function isSameWeek(laterDate, earlierDate, options) {
  var _normalizeDates = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates2 = _slicedToArray(_normalizeDates, 2),laterDate_ = _normalizeDates2[0],earlierDate_ = _normalizeDates2[1];
  return +startOfWeek(laterDate_, options) === +startOfWeek(earlierDate_, options);
}
//#endregion
//#region dist/date-fns/locale/be/_lib/formatRelative.js
var accusativeWeekdays = [
"нядзелю",
"панядзелак",
"аўторак",
"сераду",
"чацвер",
"пятніцу",
"суботу"];

function lastWeek(day) {
  var weekday = accusativeWeekdays[day];
  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:return "'у мінулую " + weekday + " а' p";
    case 1:
    case 2:
    case 4:return "'у мінулы " + weekday + " а' p";
  }
}
function thisWeek(day) {
  return "'у " + accusativeWeekdays[day] + " а' p";
}
function nextWeek(day) {
  var weekday = accusativeWeekdays[day];
  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:return "'у наступную " + weekday + " а' p";
    case 1:
    case 2:
    case 4:return "'у наступны " + weekday + " а' p";
  }
}
var lastWeekFormat = function lastWeekFormat(dirtyDate, baseDate, options) {
  var date = toDate(dirtyDate);
  var day = date.getDay();
  if (isSameWeek(date, baseDate, options)) return thisWeek(day);else
  return lastWeek(day);
};
var nextWeekFormat = function nextWeekFormat(dirtyDate, baseDate, options) {
  var date = toDate(dirtyDate);
  var day = date.getDay();
  if (isSameWeek(date, baseDate, options)) return thisWeek(day);else
  return nextWeek(day);
};
var formatRelativeLocale = {
  lastWeek: lastWeekFormat,
  yesterday: "'учора а' p",
  today: "'сёння а' p",
  tomorrow: "'заўтра а' p",
  nextWeek: nextWeekFormat,
  other: "P"
};
var formatRelative = function formatRelative(token, date, baseDate, options) {
  var format = formatRelativeLocale[token];
  if (typeof format === "function") return format(date, baseDate, options);
  return format;
};
//#endregion
//#region dist/date-fns/locale/_lib/buildLocalizeFn.js
/**
* The localize function argument callback which allows to convert raw value to
* the actual type.
*
* @param value - The value to convert
*
* @returns The converted value
*/
/**
* The map of localized values for each width.
*/
/**
* The index type of the locale unit value. It types conversion of units of
* values that don't start at 0 (i.e. quarters).
*/
/**
* Converts the unit value to the tuple of values.
*/
/**
* The tuple of localized era values. The first element represents BC,
* the second element represents AD.
*/
/**
* The tuple of localized quarter values. The first element represents Q1.
*/
/**
* The tuple of localized day values. The first element represents Sunday.
*/
/**
* The tuple of localized month values. The first element represents January.
*/
function buildLocalizeFn(args) {
  return function (value, options) {
    var context = options !== null && options !== void 0 && options.context ? String(options.context) : "standalone";
    var valuesArray;
    if (context === "formatting" && args.formattingValues) {
      var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      var width = options !== null && options !== void 0 && options.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      var _defaultWidth = args.defaultWidth;
      var _width = options !== null && options !== void 0 && options.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[_width] || args.values[_defaultWidth];
    }
    var index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
//#endregion
//#region dist/date-fns/locale/be/_lib/localize.js
var eraValues = {
  narrow: ["да н.э.", "н.э."],
  abbreviated: ["да н. э.", "н. э."],
  wide: ["да нашай эры", "нашай эры"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1-ы кв.",
  "2-і кв.",
  "3-і кв.",
  "4-ы кв."],

  wide: [
  "1-ы квартал",
  "2-і квартал",
  "3-і квартал",
  "4-ы квартал"]

};
var monthValues = {
  narrow: [
  "С",
  "Л",
  "С",
  "К",
  "М",
  "Ч",
  "Л",
  "Ж",
  "В",
  "К",
  "Л",
  "С"],

  abbreviated: [
  "студз.",
  "лют.",
  "сак.",
  "крас.",
  "май",
  "чэрв.",
  "ліп.",
  "жн.",
  "вер.",
  "кастр.",
  "ліст.",
  "снеж."],

  wide: [
  "студзень",
  "люты",
  "сакавік",
  "красавік",
  "май",
  "чэрвень",
  "ліпень",
  "жнівень",
  "верасень",
  "кастрычнік",
  "лістапад",
  "снежань"]

};
var formattingMonthValues = {
  narrow: [
  "С",
  "Л",
  "С",
  "К",
  "М",
  "Ч",
  "Л",
  "Ж",
  "В",
  "К",
  "Л",
  "С"],

  abbreviated: [
  "студз.",
  "лют.",
  "сак.",
  "крас.",
  "мая",
  "чэрв.",
  "ліп.",
  "жн.",
  "вер.",
  "кастр.",
  "ліст.",
  "снеж."],

  wide: [
  "студзеня",
  "лютага",
  "сакавіка",
  "красавіка",
  "мая",
  "чэрвеня",
  "ліпеня",
  "жніўня",
  "верасня",
  "кастрычніка",
  "лістапада",
  "снежня"]

};
var dayValues = {
  narrow: [
  "Н",
  "П",
  "А",
  "С",
  "Ч",
  "П",
  "С"],

  short: [
  "нд",
  "пн",
  "аў",
  "ср",
  "чц",
  "пт",
  "сб"],

  abbreviated: [
  "нядз",
  "пан",
  "аўт",
  "сер",
  "чац",
  "пят",
  "суб"],

  wide: [
  "нядзеля",
  "панядзелак",
  "аўторак",
  "серада",
  "чацвер",
  "пятніца",
  "субота"]

};
var dayPeriodValues = {
  narrow: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дзень",
    evening: "веч.",
    night: "ноч"
  },
  abbreviated: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дзень",
    evening: "веч.",
    night: "ноч"
  },
  wide: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўнач",
    noon: "поўдзень",
    morning: "раніца",
    afternoon: "дзень",
    evening: "вечар",
    night: "ноч"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дня",
    evening: "веч.",
    night: "ночы"
  },
  abbreviated: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дня",
    evening: "веч.",
    night: "ночы"
  },
  wide: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўнач",
    noon: "поўдзень",
    morning: "раніцы",
    afternoon: "дня",
    evening: "вечара",
    night: "ночы"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var unit = String(options === null || options === void 0 ? void 0 : options.unit);
  var number = Number(dirtyNumber);
  var suffix;
  /** Though it's an incorrect ordinal form of a date we use it here for consistency with other similar locales (ru, uk)
  *  For date-month combinations should be used `d` formatter.
  *  Correct:   `d MMMM` (4 верасня)
  *  Incorrect: `do MMMM` (4-га верасня)
  *
  *  But following the consistency leads to mistakes for literal uses of `do` formatter (ordinal day of month).
  *  So for phrase "5th day of month" (`do дзень месяца`)
  *  library will produce:            `5-га дзень месяца`
  *  but correct spelling should be:  `5-ы дзень месяца`
  *
  *  So I guess there should be a stand-alone and a formatting version of "day of month" formatters
  */
  if (unit === "date") suffix = "-га";else
  if (unit === "hour" || unit === "minute" || unit === "second") suffix = "-я";else
  suffix = (number % 10 === 2 || number % 10 === 3) && number % 100 !== 12 && number % 100 !== 13 ? "-і" : "-ы";
  return number + suffix;
};
var localize = {
  ordinalNumber: ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: function argumentCallback(quarter) {return quarter - 1;}
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide",
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "any",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return function (string) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var width = options.width;
    var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    var matchResult = string.match(matchPattern);
    if (!matchResult) return null;
    var matchedString = matchResult[0];
    var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    var key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, function (pattern) {return pattern.test(matchedString);}) : findKey(parsePatterns, function (pattern) {return pattern.test(matchedString);});
    var value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? options.valueCallback(value) : value;
    var rest = string.slice(matchedString.length);
    return {
      value: value,
      rest: rest
    };
  };
}
function findKey(object, predicate) {
  for (var key in object) if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) return key;
}
function findIndex(array, predicate) {
  for (var key = 0; key < array.length; key++) if (predicate(array[key])) return key;
}
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return function (string) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    var matchedString = matchResult[0];
    var parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    var rest = string.slice(matchedString.length);
    return {
      value: value,
      rest: rest
    };
  };
}
//#endregion
//#region dist/date-fns/locale/be.js
/**
* @category Locales
* @summary Belarusian locale.
* @language Belarusian
* @iso-639-2 bel
* @author Kiryl Anokhin [@alyrik](https://github.com/alyrik)
* @author Martin Wind [@arvigeus](https://github.com/mawi12345)
*/
var be = {
  code: "be",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(-?(е|я|га|і|ы|ае|ая|яя|шы|гі|ці|ты|мы))?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^((да )?н\.?\s?э\.?)/i,
        abbreviated: /^((да )?н\.?\s?э\.?)/i,
        wide: /^(да нашай эры|нашай эры|наша эра)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^д/i, /^н/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234](-?[ыі]?)? кв.?/i,
        wide: /^[1234](-?[ыі]?)? квартал/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /1/i,
        /2/i,
        /3/i,
        /4/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^[слкмчжв]/i,
        abbreviated: /^(студз|лют|сак|крас|ма[йя]|чэрв|ліп|жн|вер|кастр|ліст|снеж)\.?/i,
        wide: /^(студзен[ья]|лют(ы|ага)|сакавіка?|красавіка?|ма[йя]|чэрвен[ья]|ліпен[ья]|жні(вень|ўня)|верас(ень|ня)|кастрычніка?|лістапада?|снеж(ань|ня))/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^с/i,
        /^л/i,
        /^с/i,
        /^к/i,
        /^м/i,
        /^ч/i,
        /^л/i,
        /^ж/i,
        /^в/i,
        /^к/i,
        /^л/i,
        /^с/i],

        any: [
        /^ст/i,
        /^лю/i,
        /^са/i,
        /^кр/i,
        /^ма/i,
        /^ч/i,
        /^ліп/i,
        /^ж/i,
        /^в/i,
        /^ка/i,
        /^ліс/i,
        /^сн/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[нпасч]/i,
        short: /^(нд|ня|пн|па|аў|ат|ср|се|чц|ча|пт|пя|сб|су)\.?/i,
        abbreviated: /^(нядз?|ндз|пнд|пан|аўт|срд|сер|чцв|чац|птн|пят|суб).?/i,
        wide: /^(нядзел[яі]|панядзел(ак|ка)|аўтор(ак|ка)|серад[аы]|чацв(ер|ярга)|пятніц[аы]|субот[аы])/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^н/i,
        /^п/i,
        /^а/i,
        /^с/i,
        /^ч/i,
        /^п/i,
        /^с/i],

        any: [
        /^н/i,
        /^п[ан]/i,
        /^а/i,
        /^с[ер]/i,
        /^ч/i,
        /^п[ят]/i,
        /^с[уб]/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
        abbreviated: /^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
        wide: /^([дп]п|поўнач|поўдзень|раніц[аы]|дзень|дня|вечара?|ночы?)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: {
          am: /^дп/i,
          pm: /^пп/i,
          midnight: /^поўн/i,
          noon: /^поўд/i,
          morning: /^р/i,
          afternoon: /^д[зн]/i,
          evening: /^в/i,
          night: /^н/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/be/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    be: be }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();