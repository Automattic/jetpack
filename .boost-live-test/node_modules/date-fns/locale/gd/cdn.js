(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/gd/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "nas lugha na diog",
    other: "nas lugha na {{count}} diogan"
  },
  xSeconds: {
    one: "1 diog",
    two: "2 dhiog",
    twenty: "20 diog",
    other: "{{count}} diogan"
  },
  halfAMinute: "leth mhionaid",
  lessThanXMinutes: {
    one: "nas lugha na mionaid",
    other: "nas lugha na {{count}} mionaidean"
  },
  xMinutes: {
    one: "1 mionaid",
    two: "2 mhionaid",
    twenty: "20 mionaid",
    other: "{{count}} mionaidean"
  },
  aboutXHours: {
    one: "mu uair de thìde",
    other: "mu {{count}} uairean de thìde"
  },
  xHours: {
    one: "1 uair de thìde",
    two: "2 uair de thìde",
    twenty: "20 uair de thìde",
    other: "{{count}} uairean de thìde"
  },
  xDays: {
    one: "1 là",
    other: "{{count}} là"
  },
  aboutXWeeks: {
    one: "mu 1 seachdain",
    other: "mu {{count}} seachdainean"
  },
  xWeeks: {
    one: "1 seachdain",
    other: "{{count}} seachdainean"
  },
  aboutXMonths: {
    one: "mu mhìos",
    other: "mu {{count}} mìosan"
  },
  xMonths: {
    one: "1 mìos",
    other: "{{count}} mìosan"
  },
  aboutXYears: {
    one: "mu bhliadhna",
    other: "mu {{count}} bliadhnaichean"
  },
  xYears: {
    one: "1 bhliadhna",
    other: "{{count}} bliadhna"
  },
  overXYears: {
    one: "còrr is bliadhna",
    other: "còrr is {{count}} bliadhnaichean"
  },
  almostXYears: {
    one: "cha mhòr bliadhna",
    other: "cha mhòr {{count}} bliadhnaichean"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  if (count === 2 && !!tokenValue.two) result = tokenValue.two;else
  if (count === 20 && !!tokenValue.twenty) result = tokenValue.twenty;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "ann an " + result;else
  return "o chionn " + result;
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
      full: "EEEE, MMMM do, y",
      long: "MMMM do, y",
      medium: "MMM d, y",
      short: "MM/dd/yyyy"
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
      full: "{{date}} 'aig' {{time}}",
      long: "{{date}} 'aig' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/gd/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'mu dheireadh' eeee 'aig' p",
  yesterday: "'an-dè aig' p",
  today: "'an-diugh aig' p",
  tomorrow: "'a-màireach aig' p",
  nextWeek: "eeee 'aig' p",
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
//#region dist/date-fns/locale/gd/_lib/localize.js
var eraValues = {
  narrow: ["R", "A"],
  abbreviated: ["RC", "AD"],
  wide: ["ro Chrìosta", "anno domini"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "C1",
  "C2",
  "C3",
  "C4"],

  wide: [
  "a' chiad chairteal",
  "an dàrna cairteal",
  "an treas cairteal",
  "an ceathramh cairteal"]

};
var monthValues = {
  narrow: [
  "F",
  "G",
  "M",
  "G",
  "C",
  "Ò",
  "I",
  "L",
  "S",
  "D",
  "S",
  "D"],

  abbreviated: [
  "Faoi",
  "Gear",
  "Màrt",
  "Gibl",
  "Cèit",
  "Ògmh",
  "Iuch",
  "Lùn",
  "Sult",
  "Dàmh",
  "Samh",
  "Dùbh"],

  wide: [
  "Am Faoilleach",
  "An Gearran",
  "Am Màrt",
  "An Giblean",
  "An Cèitean",
  "An t-Ògmhios",
  "An t-Iuchar",
  "An Lùnastal",
  "An t-Sultain",
  "An Dàmhair",
  "An t-Samhain",
  "An Dùbhlachd"]

};
var dayValues = {
  narrow: [
  "D",
  "L",
  "M",
  "C",
  "A",
  "H",
  "S"],

  short: [
  "Dò",
  "Lu",
  "Mà",
  "Ci",
  "Ar",
  "Ha",
  "Sa"],

  abbreviated: [
  "Did",
  "Dil",
  "Dim",
  "Dic",
  "Dia",
  "Dih",
  "Dis"],

  wide: [
  "Didòmhnaich",
  "Diluain",
  "Dimàirt",
  "Diciadain",
  "Diardaoin",
  "Dihaoine",
  "Disathairne"]

};
var dayPeriodValues = {
  narrow: {
    am: "m",
    pm: "f",
    midnight: "m.o.",
    noon: "m.l.",
    morning: "madainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "oidhche"
  },
  abbreviated: {
    am: "M.",
    pm: "F.",
    midnight: "meadhan oidhche",
    noon: "meadhan là",
    morning: "madainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "oidhche"
  },
  wide: {
    am: "m.",
    pm: "f.",
    midnight: "meadhan oidhche",
    noon: "meadhan là",
    morning: "madainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "oidhche"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "m",
    pm: "f",
    midnight: "m.o.",
    noon: "m.l.",
    morning: "sa mhadainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "air an oidhche"
  },
  abbreviated: {
    am: "M.",
    pm: "F.",
    midnight: "meadhan oidhche",
    noon: "meadhan là",
    morning: "sa mhadainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "air an oidhche"
  },
  wide: {
    am: "m.",
    pm: "f.",
    midnight: "meadhan oidhche",
    noon: "meadhan là",
    morning: "sa mhadainn",
    afternoon: "feasgar",
    evening: "feasgar",
    night: "air an oidhche"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) switch (rem100 % 10) {
    case 1:return number + "d";
    case 2:return number + "na";
  }
  if (rem100 === 12) return number + "na";
  return number + "mh";
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
//#region dist/date-fns/locale/gd.js
/**
* @category Locales
* @summary Scottish Gaelic.
* @language Scottish Gaelic
* @iso-639-2 gla
* @author Lee Driscoll [@leedriscoll](https://github.com/leedriscoll)
*/
var gd = {
  code: "gd",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(d|na|tr|mh)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(r|a)/i,
        abbreviated: /^(r\.?\s?c\.?|r\.?\s?a\.?\s?c\.?|a\.?\s?d\.?|a\.?\s?c\.?)/i,
        wide: /^(ro Chrìosta|ron aois choitchinn|anno domini|aois choitcheann)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^c[1234]/i,
        wide: /^[1234](cd|na|tr|mh)? cairteal/i
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
        narrow: /^[fgmcòilsd]/i,
        abbreviated: /^(faoi|gear|màrt|gibl|cèit|ògmh|iuch|lùn|sult|dàmh|samh|dùbh)/i,
        wide: /^(am faoilleach|an gearran|am màrt|an giblean|an cèitean|an t-Ògmhios|an t-Iuchar|an lùnastal|an t-Sultain|an dàmhair|an t-Samhain|an dùbhlachd)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^f/i,
        /^g/i,
        /^m/i,
        /^g/i,
        /^c/i,
        /^ò/i,
        /^i/i,
        /^l/i,
        /^s/i,
        /^d/i,
        /^s/i,
        /^d/i],

        any: [
        /^fa/i,
        /^ge/i,
        /^mà/i,
        /^gi/i,
        /^c/i,
        /^ò/i,
        /^i/i,
        /^l/i,
        /^su/i,
        /^d/i,
        /^sa/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[dlmcahs]/i,
        short: /^(dò|lu|mà|ci|ar|ha|sa)/i,
        abbreviated: /^(did|dil|dim|dic|dia|dih|dis)/i,
        wide: /^(didòmhnaich|diluain|dimàirt|diciadain|diardaoin|dihaoine|disathairne)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^d/i,
        /^l/i,
        /^m/i,
        /^c/i,
        /^a/i,
        /^h/i,
        /^s/i],

        any: [
        /^d/i,
        /^l/i,
        /^m/i,
        /^c/i,
        /^a/i,
        /^h/i,
        /^s/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|mi|n|(san|aig) (madainn|feasgar|feasgar|oidhche))/i,
        any: /^([ap]\.?\s?m\.?|meadhan oidhche|meadhan là|(san|aig) (madainn|feasgar|feasgar|oidhche))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^m/i,
          pm: /^f/i,
          midnight: /^meadhan oidhche/i,
          noon: /^meadhan là/i,
          morning: /sa mhadainn/i,
          afternoon: /feasgar/i,
          evening: /feasgar/i,
          night: /air an oidhche/i
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
//#region dist/date-fns/_entries/locale/gd/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    gd: gd }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();