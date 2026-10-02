(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/is/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "minna en 1 sekúnda",
    other: "minna en {{count}} sekúndur"
  },
  xSeconds: {
    one: "1 sekúnda",
    other: "{{count}} sekúndur"
  },
  halfAMinute: "hálf mínúta",
  lessThanXMinutes: {
    one: "minna en 1 mínúta",
    other: "minna en {{count}} mínútur"
  },
  xMinutes: {
    one: "1 mínúta",
    other: "{{count}} mínútur"
  },
  aboutXHours: {
    one: "u.þ.b. 1 klukkustund",
    other: "u.þ.b. {{count}} klukkustundir"
  },
  xHours: {
    one: "1 klukkustund",
    other: "{{count}} klukkustundir"
  },
  xDays: {
    one: "1 dagur",
    other: "{{count}} dagar"
  },
  aboutXWeeks: {
    one: "um viku",
    other: "um {{count}} vikur"
  },
  xWeeks: {
    one: "1 viku",
    other: "{{count}} vikur"
  },
  aboutXMonths: {
    one: "u.þ.b. 1 mánuður",
    other: "u.þ.b. {{count}} mánuðir"
  },
  xMonths: {
    one: "1 mánuður",
    other: "{{count}} mánuðir"
  },
  aboutXYears: {
    one: "u.þ.b. 1 ár",
    other: "u.þ.b. {{count}} ár"
  },
  xYears: {
    one: "1 ár",
    other: "{{count}} ár"
  },
  overXYears: {
    one: "meira en 1 ár",
    other: "meira en {{count}} ár"
  },
  almostXYears: {
    one: "næstum 1 ár",
    other: "næstum {{count}} ár"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", count.toString());
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "í " + result;else
  return result + " síðan";
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
      full: "EEEE, do MMMM y",
      long: "do MMMM y",
      medium: "do MMM y",
      short: "d.MM.y"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "'kl'. HH:mm:ss zzzz",
      long: "HH:mm:ss z",
      medium: "HH:mm:ss",
      short: "HH:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'kl.' {{time}}",
      long: "{{date}} 'kl.' {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/is/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'síðasta' dddd 'kl.' p",
  yesterday: "'í gær kl.' p",
  today: "'í dag kl.' p",
  tomorrow: "'á morgun kl.' p",
  nextWeek: "dddd 'kl.' p",
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
//#region dist/date-fns/locale/is/_lib/localize.js
var eraValues = {
  narrow: ["f.Kr.", "e.Kr."],
  abbreviated: ["f.Kr.", "e.Kr."],
  wide: ["fyrir Krist", "eftir Krist"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1F",
  "2F",
  "3F",
  "4F"],

  wide: [
  "1. fjórðungur",
  "2. fjórðungur",
  "3. fjórðungur",
  "4. fjórðungur"]

};
var monthValues = {
  narrow: [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "Á",
  "S",
  "Ó",
  "N",
  "D"],

  abbreviated: [
  "jan.",
  "feb.",
  "mars",
  "apríl",
  "maí",
  "júní",
  "júlí",
  "ágúst",
  "sept.",
  "okt.",
  "nóv.",
  "des."],

  wide: [
  "janúar",
  "febrúar",
  "mars",
  "apríl",
  "maí",
  "júní",
  "júlí",
  "ágúst",
  "september",
  "október",
  "nóvember",
  "desember"]

};
var dayValues = {
  narrow: [
  "S",
  "M",
  "Þ",
  "M",
  "F",
  "F",
  "L"],

  short: [
  "Su",
  "Má",
  "Þr",
  "Mi",
  "Fi",
  "Fö",
  "La"],

  abbreviated: [
  "sun.",
  "mán.",
  "þri.",
  "mið.",
  "fim.",
  "fös.",
  "lau."],

  wide: [
  "sunnudagur",
  "mánudagur",
  "þriðjudagur",
  "miðvikudagur",
  "fimmtudagur",
  "föstudagur",
  "laugardagur"]

};
var dayPeriodValues = {
  narrow: {
    am: "f",
    pm: "e",
    midnight: "miðnætti",
    noon: "hádegi",
    morning: "morgunn",
    afternoon: "síðdegi",
    evening: "kvöld",
    night: "nótt"
  },
  abbreviated: {
    am: "f.h.",
    pm: "e.h.",
    midnight: "miðnætti",
    noon: "hádegi",
    morning: "morgunn",
    afternoon: "síðdegi",
    evening: "kvöld",
    night: "nótt"
  },
  wide: {
    am: "fyrir hádegi",
    pm: "eftir hádegi",
    midnight: "miðnætti",
    noon: "hádegi",
    morning: "morgunn",
    afternoon: "síðdegi",
    evening: "kvöld",
    night: "nótt"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "f",
    pm: "e",
    midnight: "á miðnætti",
    noon: "á hádegi",
    morning: "að morgni",
    afternoon: "síðdegis",
    evening: "um kvöld",
    night: "um nótt"
  },
  abbreviated: {
    am: "f.h.",
    pm: "e.h.",
    midnight: "á miðnætti",
    noon: "á hádegi",
    morning: "að morgni",
    afternoon: "síðdegis",
    evening: "um kvöld",
    night: "um nótt"
  },
  wide: {
    am: "fyrir hádegi",
    pm: "eftir hádegi",
    midnight: "á miðnætti",
    noon: "á hádegi",
    morning: "að morgni",
    afternoon: "síðdegis",
    evening: "um kvöld",
    night: "um nótt"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return Number(dirtyNumber) + ".";
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
//#region dist/date-fns/locale/is.js
/**
* @category Locales
* @summary Icelandic locale.
* @language Icelandic
* @iso-639-2 isl
* @author Derek Blank [@derekblank](https://github.com/derekblank)
* @author Arnór Ýmir [@lamayg](https://github.com/lamayg)
*/
var is = {
  code: "is",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(\.)?/i,
      parsePattern: /\d+(\.)?/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(f\.Kr\.|e\.Kr\.)/i,
        abbreviated: /^(f\.Kr\.|e\.Kr\.)/i,
        wide: /^(fyrir Krist|eftir Krist)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^(f\.Kr\.)/i, /^(e\.Kr\.)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]\.?/i,
        abbreviated: /^q[1234]\.?/i,
        wide: /^[1234]\.? fjórðungur/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /1\.?/i,
        /2\.?/i,
        /3\.?/i,
        /4\.?/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^[jfmásónd]/i,
        abbreviated: /^(jan\.|feb\.|mars\.|apríl\.|maí|júní|júlí|águst|sep\.|oct\.|nov\.|dec\.)/i,
        wide: /^(januar|febrúar|mars|apríl|maí|júní|júlí|águst|september|október|nóvember|desember)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^j/i,
        /^f/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^j/i,
        /^j/i,
        /^á/i,
        /^s/i,
        /^ó/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^maí/i,
        /^jún/i,
        /^júl/i,
        /^áu/i,
        /^s/i,
        /^ó/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[smtwf]/i,
        short: /^(su|má|þr|mi|fi|fö|la)/i,
        abbreviated: /^(sun|mán|þri|mið|fim|fös|lau)\.?/i,
        wide: /^(sunnudagur|mánudagur|þriðjudagur|miðvikudagur|fimmtudagur|föstudagur|laugardagur)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^m/i,
        /^þ/i,
        /^m/i,
        /^f/i,
        /^f/i,
        /^l/i],

        any: [
        /^su/i,
        /^má/i,
        /^þr/i,
        /^mi/i,
        /^fi/i,
        /^fö/i,
        /^la/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(f|e|síðdegis|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i,
        any: /^(fyrir hádegi|eftir hádegi|[ef]\.?h\.?|síðdegis|morgunn|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^f/i,
          pm: /^e/i,
          midnight: /^mi/i,
          noon: /^há/i,
          morning: /morgunn/i,
          afternoon: /síðdegi/i,
          evening: /kvöld/i,
          night: /nótt/i
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
//#region dist/date-fns/_entries/locale/is/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    is: is }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();