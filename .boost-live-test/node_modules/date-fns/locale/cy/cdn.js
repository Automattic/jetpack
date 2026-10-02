(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/cy/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "llai na eiliad",
    other: "llai na {{count}} eiliad"
  },
  xSeconds: {
    one: "1 eiliad",
    other: "{{count}} eiliad"
  },
  halfAMinute: "hanner munud",
  lessThanXMinutes: {
    one: "llai na munud",
    two: "llai na 2 funud",
    other: "llai na {{count}} munud"
  },
  xMinutes: {
    one: "1 munud",
    two: "2 funud",
    other: "{{count}} munud"
  },
  aboutXHours: {
    one: "tua 1 awr",
    other: "tua {{count}} awr"
  },
  xHours: {
    one: "1 awr",
    other: "{{count}} awr"
  },
  xDays: {
    one: "1 diwrnod",
    two: "2 ddiwrnod",
    other: "{{count}} diwrnod"
  },
  aboutXWeeks: {
    one: "tua 1 wythnos",
    two: "tua pythefnos",
    other: "tua {{count}} wythnos"
  },
  xWeeks: {
    one: "1 wythnos",
    two: "pythefnos",
    other: "{{count}} wythnos"
  },
  aboutXMonths: {
    one: "tua 1 mis",
    two: "tua 2 fis",
    other: "tua {{count}} mis"
  },
  xMonths: {
    one: "1 mis",
    two: "2 fis",
    other: "{{count}} mis"
  },
  aboutXYears: {
    one: "tua 1 flwyddyn",
    two: "tua 2 flynedd",
    other: "tua {{count}} mlynedd"
  },
  xYears: {
    one: "1 flwyddyn",
    two: "2 flynedd",
    other: "{{count}} mlynedd"
  },
  overXYears: {
    one: "dros 1 flwyddyn",
    two: "dros 2 flynedd",
    other: "dros {{count}} mlynedd"
  },
  almostXYears: {
    one: "bron 1 flwyddyn",
    two: "bron 2 flynedd",
    other: "bron {{count}} mlynedd"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  if (count === 2 && !!tokenValue.two) result = tokenValue.two;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "mewn " + result;else
  return result + " yn ôl";
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
      full: "EEEE, d MMMM yyyy",
      long: "d MMMM yyyy",
      medium: "d MMM yyyy",
      short: "dd/MM/yyyy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "h:mm:ss a zzzz",
      long: "h:mm:ss a z",
      medium: "h:mm:ss a",
      short: "h:mm a"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'am' {{time}}",
      long: "{{date}} 'am' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/cy/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'diwethaf am' p",
  yesterday: "'ddoe am' p",
  today: "'heddiw am' p",
  tomorrow: "'yfory am' p",
  nextWeek: "eeee 'am' p",
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
//#region dist/date-fns/locale/cy/_lib/localize.js
var eraValues = {
  narrow: ["C", "O"],
  abbreviated: ["CC", "OC"],
  wide: ["Cyn Crist", "Ar ôl Crist"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Ch1",
  "Ch2",
  "Ch3",
  "Ch4"],

  wide: [
  "Chwarter 1af",
  "2ail chwarter",
  "3ydd chwarter",
  "4ydd chwarter"]

};
var monthValues = {
  narrow: [
  "I",
  "Ch",
  "Ma",
  "E",
  "Mi",
  "Me",
  "G",
  "A",
  "Md",
  "H",
  "T",
  "Rh"],

  abbreviated: [
  "Ion",
  "Chwe",
  "Maw",
  "Ebr",
  "Mai",
  "Meh",
  "Gor",
  "Aws",
  "Med",
  "Hyd",
  "Tach",
  "Rhag"],

  wide: [
  "Ionawr",
  "Chwefror",
  "Mawrth",
  "Ebrill",
  "Mai",
  "Mehefin",
  "Gorffennaf",
  "Awst",
  "Medi",
  "Hydref",
  "Tachwedd",
  "Rhagfyr"]

};
var dayValues = {
  narrow: [
  "S",
  "Ll",
  "M",
  "M",
  "I",
  "G",
  "S"],

  short: [
  "Su",
  "Ll",
  "Ma",
  "Me",
  "Ia",
  "Gw",
  "Sa"],

  abbreviated: [
  "Sul",
  "Llun",
  "Maw",
  "Mer",
  "Iau",
  "Gwe",
  "Sad"],

  wide: [
  "dydd Sul",
  "dydd Llun",
  "dydd Mawrth",
  "dydd Mercher",
  "dydd Iau",
  "dydd Gwener",
  "dydd Sadwrn"]

};
var dayPeriodValues = {
  narrow: {
    am: "b",
    pm: "h",
    midnight: "hn",
    noon: "hd",
    morning: "bore",
    afternoon: "prynhawn",
    evening: "gyda'r nos",
    night: "nos"
  },
  abbreviated: {
    am: "yb",
    pm: "yh",
    midnight: "hanner nos",
    noon: "hanner dydd",
    morning: "bore",
    afternoon: "prynhawn",
    evening: "gyda'r nos",
    night: "nos"
  },
  wide: {
    am: "y.b.",
    pm: "y.h.",
    midnight: "hanner nos",
    noon: "hanner dydd",
    morning: "bore",
    afternoon: "prynhawn",
    evening: "gyda'r nos",
    night: "nos"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "b",
    pm: "h",
    midnight: "hn",
    noon: "hd",
    morning: "yn y bore",
    afternoon: "yn y prynhawn",
    evening: "gyda'r nos",
    night: "yn y nos"
  },
  abbreviated: {
    am: "yb",
    pm: "yh",
    midnight: "hanner nos",
    noon: "hanner dydd",
    morning: "yn y bore",
    afternoon: "yn y prynhawn",
    evening: "gyda'r nos",
    night: "yn y nos"
  },
  wide: {
    am: "y.b.",
    pm: "y.h.",
    midnight: "hanner nos",
    noon: "hanner dydd",
    morning: "yn y bore",
    afternoon: "yn y prynhawn",
    evening: "gyda'r nos",
    night: "yn y nos"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  if (number < 20) switch (number) {
    case 0:return number + "fed";
    case 1:return number + "af";
    case 2:return number + "ail";
    case 3:
    case 4:return number + "ydd";
    case 5:
    case 6:return number + "ed";
    case 7:
    case 8:
    case 9:
    case 10:
    case 12:
    case 15:
    case 18:return number + "fed";
    case 11:
    case 13:
    case 14:
    case 16:
    case 17:
    case 19:return number + "eg";
  } else
  if (number >= 50 && number <= 60 || number === 80 || number >= 100) return number + "fed";
  return number + "ain";
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
//#region dist/date-fns/locale/cy.js
/**
* @category Locales
* @summary Welsh locale.
* @language Welsh
* @iso-639-2 cym
* @author Elwyn Malethan [@elmomalmo](https://github.com/elmomalmo)
*/
var cy = {
  code: "cy",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(af|ail|ydd|ed|fed|eg|ain)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(c|o)/i,
        abbreviated: /^(c\.?\s?c\.?|o\.?\s?c\.?)/i,
        wide: /^(cyn christ|ar ôl crist|ar ol crist)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        wide: [/^c/i, /^(ar ôl crist|ar ol crist)/i],
        any: [/^c/i, /^o/i]
      },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^ch[1234]/i,
        wide: /^(chwarter 1af)|([234](ail|ydd)? chwarter)/i
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
        narrow: /^(i|ch|m|e|g|a|h|t|rh)/i,
        abbreviated: /^(ion|chwe|maw|ebr|mai|meh|gor|aws|med|hyd|tach|rhag)/i,
        wide: /^(ionawr|chwefror|mawrth|ebrill|mai|mehefin|gorffennaf|awst|medi|hydref|tachwedd|rhagfyr)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^i/i,
        /^ch/i,
        /^m/i,
        /^e/i,
        /^m/i,
        /^m/i,
        /^g/i,
        /^a/i,
        /^m/i,
        /^h/i,
        /^t/i,
        /^rh/i],

        any: [
        /^io/i,
        /^ch/i,
        /^maw/i,
        /^e/i,
        /^mai/i,
        /^meh/i,
        /^g/i,
        /^a/i,
        /^med/i,
        /^h/i,
        /^t/i,
        /^rh/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(s|ll|m|i|g)/i,
        short: /^(su|ll|ma|me|ia|gw|sa)/i,
        abbreviated: /^(sul|llun|maw|mer|iau|gwe|sad)/i,
        wide: /^dydd (sul|llun|mawrth|mercher|iau|gwener|sadwrn)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^ll/i,
        /^m/i,
        /^m/i,
        /^i/i,
        /^g/i,
        /^s/i],

        wide: [
        /^dydd su/i,
        /^dydd ll/i,
        /^dydd ma/i,
        /^dydd me/i,
        /^dydd i/i,
        /^dydd g/i,
        /^dydd sa/i],

        any: [
        /^su/i,
        /^ll/i,
        /^ma/i,
        /^me/i,
        /^i/i,
        /^g/i,
        /^sa/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(b|h|hn|hd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i,
        any: /^(y\.?\s?[bh]\.?|hanner nos|hanner dydd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^b|(y\.?\s?b\.?)/i,
          pm: /^h|(y\.?\s?h\.?)|(yr hwyr)/i,
          midnight: /^hn|hanner nos/i,
          noon: /^hd|hanner dydd/i,
          morning: /bore/i,
          afternoon: /prynhawn/i,
          evening: /^gyda'r nos$/i,
          night: /blah/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/cy/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    cy: cy }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();