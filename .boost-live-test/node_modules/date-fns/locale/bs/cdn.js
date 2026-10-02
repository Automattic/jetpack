(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/bs/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: {
      standalone: "manje od 1 sekunde",
      withPrepositionAgo: "manje od 1 sekunde",
      withPrepositionIn: "manje od 1 sekundu"
    },
    dual: "manje od {{count}} sekunde",
    other: "manje od {{count}} sekundi"
  },
  xSeconds: {
    one: {
      standalone: "1 sekunda",
      withPrepositionAgo: "1 sekunde",
      withPrepositionIn: "1 sekundu"
    },
    dual: "{{count}} sekunde",
    other: "{{count}} sekundi"
  },
  halfAMinute: "pola minute",
  lessThanXMinutes: {
    one: {
      standalone: "manje od 1 minute",
      withPrepositionAgo: "manje od 1 minute",
      withPrepositionIn: "manje od 1 minutu"
    },
    dual: "manje od {{count}} minute",
    other: "manje od {{count}} minuta"
  },
  xMinutes: {
    one: {
      standalone: "1 minuta",
      withPrepositionAgo: "1 minute",
      withPrepositionIn: "1 minutu"
    },
    dual: "{{count}} minute",
    other: "{{count}} minuta"
  },
  aboutXHours: {
    one: {
      standalone: "oko 1 sat",
      withPrepositionAgo: "oko 1 sat",
      withPrepositionIn: "oko 1 sat"
    },
    dual: "oko {{count}} sata",
    other: "oko {{count}} sati"
  },
  xHours: {
    one: {
      standalone: "1 sat",
      withPrepositionAgo: "1 sat",
      withPrepositionIn: "1 sat"
    },
    dual: "{{count}} sata",
    other: "{{count}} sati"
  },
  xDays: {
    one: {
      standalone: "1 dan",
      withPrepositionAgo: "1 dan",
      withPrepositionIn: "1 dan"
    },
    dual: "{{count}} dana",
    other: "{{count}} dana"
  },
  aboutXWeeks: {
    one: {
      standalone: "oko 1 sedmicu",
      withPrepositionAgo: "oko 1 sedmicu",
      withPrepositionIn: "oko 1 sedmicu"
    },
    dual: "oko {{count}} sedmice",
    other: "oko {{count}} sedmice"
  },
  xWeeks: {
    one: {
      standalone: "1 sedmicu",
      withPrepositionAgo: "1 sedmicu",
      withPrepositionIn: "1 sedmicu"
    },
    dual: "{{count}} sedmice",
    other: "{{count}} sedmice"
  },
  aboutXMonths: {
    one: {
      standalone: "oko 1 mjesec",
      withPrepositionAgo: "oko 1 mjesec",
      withPrepositionIn: "oko 1 mjesec"
    },
    dual: "oko {{count}} mjeseca",
    other: "oko {{count}} mjeseci"
  },
  xMonths: {
    one: {
      standalone: "1 mjesec",
      withPrepositionAgo: "1 mjesec",
      withPrepositionIn: "1 mjesec"
    },
    dual: "{{count}} mjeseca",
    other: "{{count}} mjeseci"
  },
  aboutXYears: {
    one: {
      standalone: "oko 1 godinu",
      withPrepositionAgo: "oko 1 godinu",
      withPrepositionIn: "oko 1 godinu"
    },
    dual: "oko {{count}} godine",
    other: "oko {{count}} godina"
  },
  xYears: {
    one: {
      standalone: "1 godina",
      withPrepositionAgo: "1 godine",
      withPrepositionIn: "1 godinu"
    },
    dual: "{{count}} godine",
    other: "{{count}} godina"
  },
  overXYears: {
    one: {
      standalone: "preko 1 godinu",
      withPrepositionAgo: "preko 1 godinu",
      withPrepositionIn: "preko 1 godinu"
    },
    dual: "preko {{count}} godine",
    other: "preko {{count}} godina"
  },
  almostXYears: {
    one: {
      standalone: "gotovo 1 godinu",
      withPrepositionAgo: "gotovo 1 godinu",
      withPrepositionIn: "gotovo 1 godinu"
    },
    dual: "gotovo {{count}} godine",
    other: "gotovo {{count}} godina"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) {if (options !== null && options !== void 0 && options.addSuffix) {if (options.comparison && options.comparison > 0) result = tokenValue.one.withPrepositionIn;else
      result = tokenValue.one.withPrepositionAgo;} else
    result = tokenValue.one.standalone;} else
  if (count % 10 > 1 && count % 10 < 5 && String(count).substr(-2, 1) !== "1") result = tokenValue.dual.replace("{{count}}", String(count));else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "za " + result;else
  return "prije " + result;
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
      full: "EEEE, d. MMMM yyyy.",
      long: "d. MMMM yyyy.",
      medium: "d. MMM yy.",
      short: "dd. MM. yy."
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH:mm:ss (zzzz)",
      long: "HH:mm:ss z",
      medium: "HH:mm:ss",
      short: "HH:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'u' {{time}}",
      long: "{{date}} 'u' {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/bs/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: function lastWeek(date) {
    switch (date.getDay()) {
      case 0:return "'prošle nedjelje u' p";
      case 3:return "'prošle srijede u' p";
      case 6:return "'prošle subote u' p";
      default:return "'prošli' EEEE 'u' p";
    }
  },
  yesterday: "'juče u' p",
  today: "'danas u' p",
  tomorrow: "'sutra u' p",
  nextWeek: function nextWeek(date) {
    switch (date.getDay()) {
      case 0:return "'sljedeće nedjelje u' p";
      case 3:return "'sljedeću srijedu u' p";
      case 6:return "'sljedeću subotu u' p";
      default:return "'sljedeći' EEEE 'u' p";
    }
  },
  other: "P"
};
var formatRelative = function formatRelative(token, date, _baseDate, _options) {
  var format = formatRelativeLocale[token];
  if (typeof format === "function") return format(date);
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
//#region dist/date-fns/locale/bs/_lib/localize.js
var eraValues = {
  narrow: ["pr.n.e.", "AD"],
  abbreviated: ["pr. Hr.", "po. Hr."],
  wide: ["Prije Hrista", "Poslije Hrista"]
};
var quarterValues = {
  narrow: [
  "1.",
  "2.",
  "3.",
  "4."],

  abbreviated: [
  "1. kv.",
  "2. kv.",
  "3. kv.",
  "4. kv."],

  wide: [
  "1. kvartal",
  "2. kvartal",
  "3. kvartal",
  "4. kvartal"]

};
var monthValues = {
  narrow: [
  "1.",
  "2.",
  "3.",
  "4.",
  "5.",
  "6.",
  "7.",
  "8.",
  "9.",
  "10.",
  "11.",
  "12."],

  abbreviated: [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "avg",
  "sep",
  "okt",
  "nov",
  "dec"],

  wide: [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "juni",
  "juli",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar"]

};
var formattingMonthValues = {
  narrow: [
  "1.",
  "2.",
  "3.",
  "4.",
  "5.",
  "6.",
  "7.",
  "8.",
  "9.",
  "10.",
  "11.",
  "12."],

  abbreviated: [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "avg",
  "sep",
  "okt",
  "nov",
  "dec"],

  wide: [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "juni",
  "juli",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar"]

};
var dayValues = {
  narrow: [
  "N",
  "P",
  "U",
  "S",
  "Č",
  "P",
  "S"],

  short: [
  "ned",
  "pon",
  "uto",
  "sre",
  "čet",
  "pet",
  "sub"],

  abbreviated: [
  "ned",
  "pon",
  "uto",
  "sre",
  "čet",
  "pet",
  "sub"],

  wide: [
  "nedjelja",
  "ponedjeljak",
  "utorak",
  "srijeda",
  "četvrtak",
  "petak",
  "subota"]

};
var dayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "popodne",
    evening: "uveče",
    night: "noću"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "popodne",
    evening: "uveče",
    night: "noću"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "poslije podne",
    evening: "uveče",
    night: "noću"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "popodne",
    evening: "uveče",
    night: "noću"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "popodne",
    evening: "uveče",
    night: "noću"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "ponoć",
    noon: "podne",
    morning: "ujutru",
    afternoon: "poslije podne",
    evening: "uveče",
    night: "noću"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  return String(number) + ".";
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
//#region dist/date-fns/locale/bs.js
/**
* @category Locales
* @summary Bosnian locale.
* @language Bosnian
* @iso-639-2 bos
* @author Branislav Lazić [@branislavlazic](https://github.com/branislavlazic)
*/
var bs = {
  code: "bs",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)\./i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(pr\.n\.e\.|AD)/i,
        abbreviated: /^(pr\.\s?Hr\.|po\.\s?Hr\.)/i,
        wide: /^(Prije Hrista|prije nove ere|Poslije Hrista|nova era)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^pr/i, /^(po|nova)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234]\.\s?kv\.?/i,
        wide: /^[1234]\. kvartal/i
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
        narrow: /^(10|11|12|[123456789])\./i,
        abbreviated: /^(jan|feb|mar|apr|maj|jun|jul|avg|sep|okt|nov|dec)/i,
        wide: /^((januar|januara)|(februar|februara)|(mart|marta)|(april|aprila)|(maj|maja)|(juni|juna)|(juli|jula)|(avgust|avgusta)|(septembar|septembra)|(oktobar|oktobra)|(novembar|novembra)|(decembar|decembra))/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^1/i,
        /^2/i,
        /^3/i,
        /^4/i,
        /^5/i,
        /^6/i,
        /^7/i,
        /^8/i,
        /^9/i,
        /^10/i,
        /^11/i,
        /^12/i],

        any: [
        /^ja/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^maj/i,
        /^jun/i,
        /^jul/i,
        /^avg/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[npusčc]/i,
        short: /^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
        abbreviated: /^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
        wide: /^(nedjelja|ponedjeljak|utorak|srijeda|(četvrtak|cetvrtak)|petak|subota)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^m/i,
        /^t/i,
        /^w/i,
        /^t/i,
        /^f/i,
        /^s/i],

        any: [
        /^su/i,
        /^m/i,
        /^tu/i,
        /^w/i,
        /^th/i,
        /^f/i,
        /^sa/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^(am|pm|ponoc|ponoć|(po)?podne|uvece|uveče|noću|poslije podne|ujutru)/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^pono/i,
          noon: /^pod/i,
          morning: /jutro/i,
          afternoon: /(poslije\s|po)+podne/i,
          evening: /(uvece|uveče)/i,
          night: /(nocu|noću)/i
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
//#region dist/date-fns/_entries/locale/bs/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    bs: bs }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();