(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/oc/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "mens d’una segonda",
    other: "mens de {{count}} segondas"
  },
  xSeconds: {
    one: "1 segonda",
    other: "{{count}} segondas"
  },
  halfAMinute: "30 segondas",
  lessThanXMinutes: {
    one: "mens d’una minuta",
    other: "mens de {{count}} minutas"
  },
  xMinutes: {
    one: "1 minuta",
    other: "{{count}} minutas"
  },
  aboutXHours: {
    one: "environ 1 ora",
    other: "environ {{count}} oras"
  },
  xHours: {
    one: "1 ora",
    other: "{{count}} oras"
  },
  xDays: {
    one: "1 jorn",
    other: "{{count}} jorns"
  },
  aboutXWeeks: {
    one: "environ 1 setmana",
    other: "environ {{count}} setmanas"
  },
  xWeeks: {
    one: "1 setmana",
    other: "{{count}} setmanas"
  },
  aboutXMonths: {
    one: "environ 1 mes",
    other: "environ {{count}} meses"
  },
  xMonths: {
    one: "1 mes",
    other: "{{count}} meses"
  },
  aboutXYears: {
    one: "environ 1 an",
    other: "environ {{count}} ans"
  },
  xYears: {
    one: "1 an",
    other: "{{count}} ans"
  },
  overXYears: {
    one: "mai d’un an",
    other: "mai de {{count}} ans"
  },
  almostXYears: {
    one: "gaireben un an",
    other: "gaireben {{count}} ans"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "d’aquí " + result;else
  return "fa " + result;
  return result;
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
      full: "EEEE d 'de' MMMM y",
      long: "d 'de' MMMM y",
      medium: "d MMM y",
      short: "dd/MM/y"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH:mm:ss zzzz",
      long: "HH:mm:ss z",
      medium: "HH:mm:ss",
      short: "HH:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'a' {{time}}",
      long: "{{date}} 'a' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/oc/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'passat a' p",
  yesterday: "'ièr a' p",
  today: "'uèi a' p",
  tomorrow: "'deman a' p",
  nextWeek: "eeee 'a' p",
  other: "P"
};
var formatRelative = function formatRelative(token, _date, _baseDate, _options) {return formatRelativeLocale[token];};
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
//#region dist/date-fns/locale/oc/_lib/localize.js
var eraValues = {
  narrow: ["ab. J.C.", "apr. J.C."],
  abbreviated: ["ab. J.C.", "apr. J.C."],
  wide: ["abans Jèsus-Crist", "après Jèsus-Crist"]
};
var quarterValues = {
  narrow: [
  "T1",
  "T2",
  "T3",
  "T4"],

  abbreviated: [
  "1èr trim.",
  "2nd trim.",
  "3en trim.",
  "4en trim."],

  wide: [
  "1èr trimèstre",
  "2nd trimèstre",
  "3en trimèstre",
  "4en trimèstre"]

};
var monthValues = {
  narrow: [
  "GN",
  "FB",
  "MÇ",
  "AB",
  "MA",
  "JN",
  "JL",
  "AG",
  "ST",
  "OC",
  "NV",
  "DC"],

  abbreviated: [
  "gen.",
  "febr.",
  "març",
  "abr.",
  "mai",
  "junh",
  "jul.",
  "ag.",
  "set.",
  "oct.",
  "nov.",
  "dec."],

  wide: [
  "genièr",
  "febrièr",
  "març",
  "abril",
  "mai",
  "junh",
  "julhet",
  "agost",
  "setembre",
  "octòbre",
  "novembre",
  "decembre"]

};
var dayValues = {
  narrow: [
  "dg.",
  "dl.",
  "dm.",
  "dc.",
  "dj.",
  "dv.",
  "ds."],

  short: [
  "dg.",
  "dl.",
  "dm.",
  "dc.",
  "dj.",
  "dv.",
  "ds."],

  abbreviated: [
  "dg.",
  "dl.",
  "dm.",
  "dc.",
  "dj.",
  "dv.",
  "ds."],

  wide: [
  "dimenge",
  "diluns",
  "dimars",
  "dimècres",
  "dijòus",
  "divendres",
  "dissabte"]

};
var dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch"
  },
  abbreviated: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch"
  },
  wide: {
    am: "ante meridiem",
    pm: "post meridiem",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  var unit = options === null || options === void 0 ? void 0 : options.unit;
  var ordinal;
  switch (number) {
    case 1:
      ordinal = "èr";
      break;
    case 2:
      ordinal = "nd";
      break;
    default:ordinal = "en";
  }
  if (unit === "year" || unit === "week" || unit === "hour" || unit === "minute" || unit === "second") ordinal += "a";
  return number + ordinal;
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
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
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
//#region dist/date-fns/locale/oc.js
/**
* @category Locales
* @summary Occitan locale.
* @language Occitan
* @iso-639-2 oci
* @author Quentin PAGÈS
*/
var oc = {
  code: "oc",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(èr|nd|en)?[a]?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(ab\.J\.C|apr\.J\.C|apr\.J\.-C)/i,
        abbreviated: /^(ab\.J\.-C|ab\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
        wide: /^(abans Jèsus-Crist|après Jèsus-Crist)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^ab/i, /^ap/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^T[1234]/i,
        abbreviated: /^[1234](èr|nd|en)? trim\.?/i,
        wide: /^[1234](èr|nd|en)? trimèstre/i
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
        narrow: /^(GN|FB|MÇ|AB|MA|JN|JL|AG|ST|OC|NV|DC)/i,
        abbreviated: /^(gen|febr|març|abr|mai|junh|jul|ag|set|oct|nov|dec)\.?/i,
        wide: /^(genièr|febrièr|març|abril|mai|junh|julhet|agost|setembre|octòbre|novembre|decembre)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^g/i,
        /^f/i,
        /^ma[r?]|MÇ/i,
        /^ab/i,
        /^ma[i?]/i,
        /^ju[n?]|JN/i,
        /^ju[l?]|JL/i,
        /^ag/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i]
      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^d[glmcjvs]\.?/i,
        short: /^d[glmcjvs]\.?/i,
        abbreviated: /^d[glmcjvs]\.?/i,
        wide: /^(dimenge|diluns|dimars|dimècres|dijòus|divendres|dissabte)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^dg/i,
        /^dl/i,
        /^dm/i,
        /^dc/i,
        /^dj/i,
        /^dv/i,
        /^ds/i],

        short: [
        /^dg/i,
        /^dl/i,
        /^dm/i,
        /^dc/i,
        /^dj/i,
        /^dv/i,
        /^ds/i],

        abbreviated: [
        /^dg/i,
        /^dl/i,
        /^dm/i,
        /^dc/i,
        /^dj/i,
        /^dv/i,
        /^ds/i],

        any: [
        /^dg|dime/i,
        /^dl|dil/i,
        /^dm|dima/i,
        /^dc|dimè/i,
        /^dj|dij/i,
        /^dv|div/i,
        /^ds|dis/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /(^(a\.?m|p\.?m))|(ante meridiem|post meridiem)|((del |de la |de l’)(matin|aprèp-miègjorn|vèspre|ser|nuèch))/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /(^a)|ante meridiem/i,
          pm: /(^p)|post meridiem/i,
          midnight: /^mièj/i,
          noon: /^mièg/i,
          morning: /matin/i,
          afternoon: /aprèp-miègjorn/i,
          evening: /vèspre|ser/i,
          night: /nuèch/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/oc/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    oc: oc }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();