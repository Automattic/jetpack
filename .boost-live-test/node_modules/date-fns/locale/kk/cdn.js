(() => {
var _window$dateFns;function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);}function _slicedToArray(r, e) {return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(r, a) {if (r) {if ("string" == typeof r) return _arrayLikeToArray(r, a);var t = {}.toString.call(r).slice(8, -1);return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;}}function _arrayLikeToArray(r, a) {(null == a || a > r.length) && (a = r.length);for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];return n;}function _iterableToArrayLimit(r, l) {var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (null != t) {var e,n,i,u,a = [],f = !0,o = !1;try {if (i = (t = t.call(r)).next, 0 === l) {if (Object(t) !== t) return;f = !1;} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);} catch (r) {o = !0, n = r;} finally {try {if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;} finally {if (o) throw n;}}return a;}}function _arrayWithHoles(r) {if (Array.isArray(r)) return r;}function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);} //#region dist/date-fns/locale/kk/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    regular: {
      one: "1 секундтан аз",
      singularNominative: "{{count}} секундтан аз",
      singularGenitive: "{{count}} секундтан аз",
      pluralGenitive: "{{count}} секундтан аз"
    },
    future: {
      one: "бір секундтан кейін",
      singularNominative: "{{count}} секундтан кейін",
      singularGenitive: "{{count}} секундтан кейін",
      pluralGenitive: "{{count}} секундтан кейін"
    }
  },
  xSeconds: {
    regular: {
      singularNominative: "{{count}} секунд",
      singularGenitive: "{{count}} секунд",
      pluralGenitive: "{{count}} секунд"
    },
    past: {
      singularNominative: "{{count}} секунд бұрын",
      singularGenitive: "{{count}} секунд бұрын",
      pluralGenitive: "{{count}} секунд бұрын"
    },
    future: {
      singularNominative: "{{count}} секундтан кейін",
      singularGenitive: "{{count}} секундтан кейін",
      pluralGenitive: "{{count}} секундтан кейін"
    }
  },
  halfAMinute: function halfAMinute(options) {
    if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "жарты минут ішінде";else
    return "жарты минут бұрын";
    return "жарты минут";
  },
  lessThanXMinutes: {
    regular: {
      one: "1 минуттан аз",
      singularNominative: "{{count}} минуттан аз",
      singularGenitive: "{{count}} минуттан аз",
      pluralGenitive: "{{count}} минуттан аз"
    },
    future: {
      one: "минуттан кем ",
      singularNominative: "{{count}} минуттан кем",
      singularGenitive: "{{count}} минуттан кем",
      pluralGenitive: "{{count}} минуттан кем"
    }
  },
  xMinutes: {
    regular: {
      singularNominative: "{{count}} минут",
      singularGenitive: "{{count}} минут",
      pluralGenitive: "{{count}} минут"
    },
    past: {
      singularNominative: "{{count}} минут бұрын",
      singularGenitive: "{{count}} минут бұрын",
      pluralGenitive: "{{count}} минут бұрын"
    },
    future: {
      singularNominative: "{{count}} минуттан кейін",
      singularGenitive: "{{count}} минуттан кейін",
      pluralGenitive: "{{count}} минуттан кейін"
    }
  },
  aboutXHours: {
    regular: {
      singularNominative: "шамамен {{count}} сағат",
      singularGenitive: "шамамен {{count}} сағат",
      pluralGenitive: "шамамен {{count}} сағат"
    },
    future: {
      singularNominative: "шамамен {{count}} сағаттан кейін",
      singularGenitive: "шамамен {{count}} сағаттан кейін",
      pluralGenitive: "шамамен {{count}} сағаттан кейін"
    }
  },
  xHours: { regular: {
      singularNominative: "{{count}} сағат",
      singularGenitive: "{{count}} сағат",
      pluralGenitive: "{{count}} сағат"
    } },
  xDays: {
    regular: {
      singularNominative: "{{count}} күн",
      singularGenitive: "{{count}} күн",
      pluralGenitive: "{{count}} күн"
    },
    future: {
      singularNominative: "{{count}} күннен кейін",
      singularGenitive: "{{count}} күннен кейін",
      pluralGenitive: "{{count}} күннен кейін"
    }
  },
  aboutXWeeks: {
    type: "weeks",
    one: "шамамен 1 апта",
    other: "шамамен {{count}} апта"
  },
  xWeeks: {
    type: "weeks",
    one: "1 апта",
    other: "{{count}} апта"
  },
  aboutXMonths: {
    regular: {
      singularNominative: "шамамен {{count}} ай",
      singularGenitive: "шамамен {{count}} ай",
      pluralGenitive: "шамамен {{count}} ай"
    },
    future: {
      singularNominative: "шамамен {{count}} айдан кейін",
      singularGenitive: "шамамен {{count}} айдан кейін",
      pluralGenitive: "шамамен {{count}} айдан кейін"
    }
  },
  xMonths: { regular: {
      singularNominative: "{{count}} ай",
      singularGenitive: "{{count}} ай",
      pluralGenitive: "{{count}} ай"
    } },
  aboutXYears: {
    regular: {
      singularNominative: "шамамен {{count}} жыл",
      singularGenitive: "шамамен {{count}} жыл",
      pluralGenitive: "шамамен {{count}} жыл"
    },
    future: {
      singularNominative: "шамамен {{count}} жылдан кейін",
      singularGenitive: "шамамен {{count}} жылдан кейін",
      pluralGenitive: "шамамен {{count}} жылдан кейін"
    }
  },
  xYears: {
    regular: {
      singularNominative: "{{count}} жыл",
      singularGenitive: "{{count}} жыл",
      pluralGenitive: "{{count}} жыл"
    },
    future: {
      singularNominative: "{{count}} жылдан кейін",
      singularGenitive: "{{count}} жылдан кейін",
      pluralGenitive: "{{count}} жылдан кейін"
    }
  },
  overXYears: {
    regular: {
      singularNominative: "{{count}} жылдан астам",
      singularGenitive: "{{count}} жылдан астам",
      pluralGenitive: "{{count}} жылдан астам"
    },
    future: {
      singularNominative: "{{count}} жылдан астам",
      singularGenitive: "{{count}} жылдан астам",
      pluralGenitive: "{{count}} жылдан астам"
    }
  },
  almostXYears: {
    regular: {
      singularNominative: "{{count}} жылға жақын",
      singularGenitive: "{{count}} жылға жақын",
      pluralGenitive: "{{count}} жылға жақын"
    },
    future: {
      singularNominative: "{{count}} жылдан кейін",
      singularGenitive: "{{count}} жылдан кейін",
      pluralGenitive: "{{count}} жылдан кейін"
    }
  }
};
function declension(scheme, count) {
  if (scheme.one && count === 1) return scheme.one;
  var rem10 = count % 10;
  var rem100 = count % 100;
  if (rem10 === 1 && rem100 !== 11) return scheme.singularNominative.replace("{{count}}", String(count));else
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) return scheme.singularGenitive.replace("{{count}}", String(count));else
  return scheme.pluralGenitive.replace("{{count}}", String(count));
}
var formatDistance = function formatDistance(token, count, options) {
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "function") return tokenValue(options);
  if (tokenValue.type === "weeks") return count === 1 ? tokenValue.one : tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) {if (options.comparison && options.comparison > 0) {if (tokenValue.future) return declension(tokenValue.future, count);else
      return declension(tokenValue.regular, count) + " кейін";} else
    if (tokenValue.past) return declension(tokenValue.past, count);else
    return declension(tokenValue.regular, count) + " бұрын";} else
  return declension(tokenValue.regular, count);
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
      full: "EEEE, do MMMM y 'ж.'",
      long: "do MMMM y 'ж.'",
      medium: "d MMM y 'ж.'",
      short: "dd.MM.yyyy"
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
//#region dist/date-fns/locale/kk/_lib/formatRelative.js
var accusativeWeekdays = [
"жексенбіде",
"дүйсенбіде",
"сейсенбіде",
"сәрсенбіде",
"бейсенбіде",
"жұмада",
"сенбіде"];

function _lastWeek(day) {
  return "'өткен " + accusativeWeekdays[day] + " сағат' p'-де'";
}
function thisWeek(day) {
  return "'" + accusativeWeekdays[day] + " сағат' p'-де'";
}
function _nextWeek(day) {
  return "'келесі " + accusativeWeekdays[day] + " сағат' p'-де'";
}
var formatRelativeLocale = {
  lastWeek: function lastWeek(date, baseDate, options) {
    var day = date.getDay();
    if (isSameWeek(date, baseDate, options)) return thisWeek(day);else
    return _lastWeek(day);
  },
  yesterday: "'кеше сағат' p'-де'",
  today: "'бүгін сағат' p'-де'",
  tomorrow: "'ертең сағат' p'-де'",
  nextWeek: function nextWeek(date, baseDate, options) {
    var day = date.getDay();
    if (isSameWeek(date, baseDate, options)) return thisWeek(day);else
    return _nextWeek(day);
  },
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
//#region dist/date-fns/locale/kk/_lib/localize.js
var eraValues = {
  narrow: ["б.з.д.", "б.з."],
  abbreviated: ["б.з.д.", "б.з."],
  wide: ["біздің заманымызға дейін", "біздің заманымыз"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1-ші тоқ.",
  "2-ші тоқ.",
  "3-ші тоқ.",
  "4-ші тоқ."],

  wide: [
  "1-ші тоқсан",
  "2-ші тоқсан",
  "3-ші тоқсан",
  "4-ші тоқсан"]

};
var monthValues = {
  narrow: [
  "Қ",
  "А",
  "Н",
  "С",
  "М",
  "М",
  "Ш",
  "Т",
  "Қ",
  "Қ",
  "Қ",
  "Ж"],

  abbreviated: [
  "қаң",
  "ақп",
  "нау",
  "сәу",
  "мам",
  "мау",
  "шіл",
  "там",
  "қыр",
  "қаз",
  "қар",
  "жел"],

  wide: [
  "қаңтар",
  "ақпан",
  "наурыз",
  "сәуір",
  "мамыр",
  "маусым",
  "шілде",
  "тамыз",
  "қыркүйек",
  "қазан",
  "қараша",
  "желтоқсан"]

};
var formattingMonthValues = {
  narrow: [
  "Қ",
  "А",
  "Н",
  "С",
  "М",
  "М",
  "Ш",
  "Т",
  "Қ",
  "Қ",
  "Қ",
  "Ж"],

  abbreviated: [
  "қаң",
  "ақп",
  "нау",
  "сәу",
  "мам",
  "мау",
  "шіл",
  "там",
  "қыр",
  "қаз",
  "қар",
  "жел"],

  wide: [
  "қаңтар",
  "ақпан",
  "наурыз",
  "сәуір",
  "мамыр",
  "маусым",
  "шілде",
  "тамыз",
  "қыркүйек",
  "қазан",
  "қараша",
  "желтоқсан"]

};
var dayValues = {
  narrow: [
  "Ж",
  "Д",
  "С",
  "С",
  "Б",
  "Ж",
  "С"],

  short: [
  "жс",
  "дс",
  "сс",
  "ср",
  "бс",
  "жм",
  "сб"],

  abbreviated: [
  "жс",
  "дс",
  "сс",
  "ср",
  "бс",
  "жм",
  "сб"],

  wide: [
  "жексенбі",
  "дүйсенбі",
  "сейсенбі",
  "сәрсенбі",
  "бейсенбі",
  "жұма",
  "сенбі"]

};
var dayPeriodValues = {
  narrow: {
    am: "ТД",
    pm: "ТК",
    midnight: "түн ортасы",
    noon: "түс",
    morning: "таң",
    afternoon: "күндіз",
    evening: "кеш",
    night: "түн"
  },
  wide: {
    am: "ТД",
    pm: "ТК",
    midnight: "түн ортасы",
    noon: "түс",
    morning: "таң",
    afternoon: "күндіз",
    evening: "кеш",
    night: "түн"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ТД",
    pm: "ТК",
    midnight: "түн ортасында",
    noon: "түс",
    morning: "таң",
    afternoon: "күн",
    evening: "кеш",
    night: "түн"
  },
  wide: {
    am: "ТД",
    pm: "ТК",
    midnight: "түн ортасында",
    noon: "түсте",
    morning: "таңертең",
    afternoon: "күндіз",
    evening: "кеште",
    night: "түнде"
  }
};
var suffixes = {
  0: "-ші",
  1: "-ші",
  2: "-ші",
  3: "-ші",
  4: "-ші",
  5: "-ші",
  6: "-шы",
  7: "-ші",
  8: "-ші",
  9: "-шы",
  10: "-шы",
  20: "-шы",
  30: "-шы",
  40: "-шы",
  50: "-ші",
  60: "-шы",
  70: "-ші",
  80: "-ші",
  90: "-шы",
  100: "-ші"
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  var mod10 = number % 10;
  var b = number >= 100 ? 100 : null;
  return number + (suffixes[number] || suffixes[mod10] || b && suffixes[b] || "");
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
//#region dist/date-fns/locale/kk.js
/**
* @category Locales
* @summary Kazakh locale.
* @language Kazakh
* @iso-639-2 kaz
* @author Nikita Bayev [@drugoi](https://github.com/drugoi)
*/
var kk = {
  code: "kk",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(-?(ші|шы))?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^((б )?з\.?\s?д\.?)/i,
        abbreviated: /^((б )?з\.?\s?д\.?)/i,
        wide: /^(біздің заманымызға дейін|біздің заманымыз|біздің заманымыздан)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^б/i, /^з/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234](-?ші)? тоқ.?/i,
        wide: /^[1234](-?ші)? тоқсан/i
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
        narrow: /^(қ|а|н|с|м|мау|ш|т|қыр|қаз|қар|ж)/i,
        abbreviated: /^(қаң|ақп|нау|сәу|мам|мау|шіл|там|қыр|қаз|қар|жел)/i,
        wide: /^(қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^қ/i,
        /^а/i,
        /^н/i,
        /^с/i,
        /^м/i,
        /^м/i,
        /^ш/i,
        /^т/i,
        /^қ/i,
        /^қ/i,
        /^қ/i,
        /^ж/i],

        abbreviated: [
        /^қаң/i,
        /^ақп/i,
        /^нау/i,
        /^сәу/i,
        /^мам/i,
        /^мау/i,
        /^шіл/i,
        /^там/i,
        /^қыр/i,
        /^қаз/i,
        /^қар/i,
        /^жел/i],

        any: [
        /^қ/i,
        /^а/i,
        /^н/i,
        /^с/i,
        /^м/i,
        /^м/i,
        /^ш/i,
        /^т/i,
        /^қ/i,
        /^қ/i,
        /^қ/i,
        /^ж/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ж|д|с|с|б|ж|с)/i,
        short: /^(жс|дс|сс|ср|бс|жм|сб)/i,
        wide: /^(жексенбі|дүйсенбі|сейсенбі|сәрсенбі|бейсенбі|жұма|сенбі)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ж/i,
        /^д/i,
        /^с/i,
        /^с/i,
        /^б/i,
        /^ж/i,
        /^с/i],

        short: [
        /^жс/i,
        /^дс/i,
        /^сс/i,
        /^ср/i,
        /^бс/i,
        /^жм/i,
        /^сб/i],

        any: [
        /^ж[ек]/i,
        /^д[үй]/i,
        /^сe[й]/i,
        /^сә[р]/i,
        /^б[ей]/i,
        /^ж[ұм]/i,
        /^се[н]/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
        wide: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
        any: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: {
          am: /^ТД/i,
          pm: /^ТК/i,
          midnight: /^түн орта/i,
          noon: /^күндіз/i,
          morning: /таң/i,
          afternoon: /түс/i,
          evening: /кеш/i,
          night: /түн/i
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
//#region dist/date-fns/_entries/locale/kk/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    kk: kk }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();