(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/sq/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "më pak se një sekondë",
    other: "më pak se {{count}} sekonda"
  },
  xSeconds: {
    one: "1 sekondë",
    other: "{{count}} sekonda"
  },
  halfAMinute: "gjysëm minuti",
  lessThanXMinutes: {
    one: "më pak se një minute",
    other: "më pak se {{count}} minuta"
  },
  xMinutes: {
    one: "1 minutë",
    other: "{{count}} minuta"
  },
  aboutXHours: {
    one: "rreth 1 orë",
    other: "rreth {{count}} orë"
  },
  xHours: {
    one: "1 orë",
    other: "{{count}} orë"
  },
  xDays: {
    one: "1 ditë",
    other: "{{count}} ditë"
  },
  aboutXWeeks: {
    one: "rreth 1 javë",
    other: "rreth {{count}} javë"
  },
  xWeeks: {
    one: "1 javë",
    other: "{{count}} javë"
  },
  aboutXMonths: {
    one: "rreth 1 muaj",
    other: "rreth {{count}} muaj"
  },
  xMonths: {
    one: "1 muaj",
    other: "{{count}} muaj"
  },
  aboutXYears: {
    one: "rreth 1 vit",
    other: "rreth {{count}} vite"
  },
  xYears: {
    one: "1 vit",
    other: "{{count}} vite"
  },
  overXYears: {
    one: "mbi 1 vit",
    other: "mbi {{count}} vite"
  },
  almostXYears: {
    one: "pothuajse 1 vit",
    other: "pothuajse {{count}} vite"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "në " + result;else
  return result + " më parë";
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
      full: "{{date}} 'në' {{time}}",
      long: "{{date}} 'në' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/sq/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'të' eeee 'e shkuar në' p",
  yesterday: "'dje në' p",
  today: "'sot në' p",
  tomorrow: "'nesër në' p",
  nextWeek: "eeee 'at' p",
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
//#region dist/date-fns/locale/sq/_lib/localize.js
var eraValues = {
  narrow: ["P", "M"],
  abbreviated: ["PK", "MK"],
  wide: ["Para Krishtit", "Mbas Krishtit"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Q1",
  "Q2",
  "Q3",
  "Q4"],

  wide: [
  "4-mujori I",
  "4-mujori II",
  "4-mujori III",
  "4-mujori IV"]

};
var monthValues = {
  narrow: [
  "J",
  "S",
  "M",
  "P",
  "M",
  "Q",
  "K",
  "G",
  "S",
  "T",
  "N",
  "D"],

  abbreviated: [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj"],

  wide: [
  "Janar",
  "Shkurt",
  "Mars",
  "Prill",
  "Maj",
  "Qershor",
  "Korrik",
  "Gusht",
  "Shtator",
  "Tetor",
  "Nëntor",
  "Dhjetor"]

};
var dayValues = {
  narrow: [
  "D",
  "H",
  "M",
  "M",
  "E",
  "P",
  "S"],

  short: [
  "Di",
  "Hë",
  "Ma",
  "Më",
  "En",
  "Pr",
  "Sh"],

  abbreviated: [
  "Die",
  "Hën",
  "Mar",
  "Mër",
  "Enj",
  "Pre",
  "Sht"],

  wide: [
  "Dielë",
  "Hënë",
  "Martë",
  "Mërkurë",
  "Enjte",
  "Premte",
  "Shtunë"]

};
var dayPeriodValues = {
  narrow: {
    am: "p",
    pm: "m",
    midnight: "m",
    noon: "d",
    morning: "mëngjes",
    afternoon: "dite",
    evening: "mbrëmje",
    night: "natë"
  },
  abbreviated: {
    am: "PD",
    pm: "MD",
    midnight: "mesnëtë",
    noon: "drek",
    morning: "mëngjes",
    afternoon: "mbasdite",
    evening: "mbrëmje",
    night: "natë"
  },
  wide: {
    am: "p.d.",
    pm: "m.d.",
    midnight: "mesnëtë",
    noon: "drek",
    morning: "mëngjes",
    afternoon: "mbasdite",
    evening: "mbrëmje",
    night: "natë"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "p",
    pm: "m",
    midnight: "m",
    noon: "d",
    morning: "në mëngjes",
    afternoon: "në mbasdite",
    evening: "në mbrëmje",
    night: "në mesnatë"
  },
  abbreviated: {
    am: "PD",
    pm: "MD",
    midnight: "mesnatë",
    noon: "drek",
    morning: "në mëngjes",
    afternoon: "në mbasdite",
    evening: "në mbrëmje",
    night: "në mesnatë"
  },
  wide: {
    am: "p.d.",
    pm: "m.d.",
    midnight: "mesnatë",
    noon: "drek",
    morning: "në mëngjes",
    afternoon: "në mbasdite",
    evening: "në mbrëmje",
    night: "në mesnatë"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  if ((options === null || options === void 0 ? void 0 : options.unit) === "hour") return String(number);
  if (number === 1) return number + "-rë";
  if (number === 4) return number + "t";
  return number + "-të";
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
//#region dist/date-fns/locale/sq.js
/**
* @category Locales
* @summary Albanian locale.
* @language Shqip
* @iso-639-2 sqi
* @author Ardit Dine [@arditdine](https://github.com/arditdine)
*/
var sq = {
  code: "sq",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(-rë|-të|t|)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(p|m)/i,
        abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
        wide: /^(para krishtit|mbas krishtit)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b/i, /^(p|m)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234]-mujori (i{1,3}|iv)/i
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
        narrow: /^[jsmpqkftnd]/i,
        abbreviated: /^(jan|shk|mar|pri|maj|qer|kor|gus|sht|tet|nën|dhj)/i,
        wide: /^(janar|shkurt|mars|prill|maj|qershor|korrik|gusht|shtator|tetor|nëntor|dhjetor)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^j/i,
        /^s/i,
        /^m/i,
        /^p/i,
        /^m/i,
        /^q/i,
        /^k/i,
        /^g/i,
        /^s/i,
        /^t/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^shk/i,
        /^mar/i,
        /^pri/i,
        /^maj/i,
        /^qer/i,
        /^kor/i,
        /^gu/i,
        /^sht/i,
        /^tet/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[dhmeps]/i,
        short: /^(di|hë|ma|më|en|pr|sh)/i,
        abbreviated: /^(die|hën|mar|mër|enj|pre|sht)/i,
        wide: /^(dielë|hënë|martë|mërkurë|enjte|premte|shtunë)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^d/i,
        /^h/i,
        /^m/i,
        /^m/i,
        /^e/i,
        /^p/i,
        /^s/i],

        any: [
        /^d/i,
        /^h/i,
        /^ma/i,
        /^më/i,
        /^e/i,
        /^p/i,
        /^s/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(p|m|me|në (mëngjes|mbasdite|mbrëmje|mesnatë))/i,
        any: /^([pm]\.?\s?d\.?|drek|në (mëngjes|mbasdite|mbrëmje|mesnatë))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^p/i,
          pm: /^m/i,
          midnight: /^me/i,
          noon: /^dr/i,
          morning: /mëngjes/i,
          afternoon: /mbasdite/i,
          evening: /mbrëmje/i,
          night: /natë/i
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
//#region dist/date-fns/_entries/locale/sq/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    sq: sq }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();