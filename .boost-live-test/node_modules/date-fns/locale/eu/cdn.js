(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/eu/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "segundo bat baino gutxiago",
    other: "{{count}} segundo baino gutxiago"
  },
  xSeconds: {
    one: "1 segundo",
    other: "{{count}} segundo"
  },
  halfAMinute: "minutu erdi",
  lessThanXMinutes: {
    one: "minutu bat baino gutxiago",
    other: "{{count}} minutu baino gutxiago"
  },
  xMinutes: {
    one: "1 minutu",
    other: "{{count}} minutu"
  },
  aboutXHours: {
    one: "1 ordu gutxi gorabehera",
    other: "{{count}} ordu gutxi gorabehera"
  },
  xHours: {
    one: "1 ordu",
    other: "{{count}} ordu"
  },
  xDays: {
    one: "1 egun",
    other: "{{count}} egun"
  },
  aboutXWeeks: {
    one: "aste 1 inguru",
    other: "{{count}} aste inguru"
  },
  xWeeks: {
    one: "1 aste",
    other: "{{count}} astean"
  },
  aboutXMonths: {
    one: "1 hilabete gutxi gorabehera",
    other: "{{count}} hilabete gutxi gorabehera"
  },
  xMonths: {
    one: "1 hilabete",
    other: "{{count}} hilabete"
  },
  aboutXYears: {
    one: "1 urte gutxi gorabehera",
    other: "{{count}} urte gutxi gorabehera"
  },
  xYears: {
    one: "1 urte",
    other: "{{count}} urte"
  },
  overXYears: {
    one: "1 urte baino gehiago",
    other: "{{count}} urte baino gehiago"
  },
  almostXYears: {
    one: "ia 1 urte",
    other: "ia {{count}} urte"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "en " + result;else
  return "duela " + result;
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
      full: "EEEE, y'ko' MMMM'ren' d'a' y'ren'",
      long: "y'ko' MMMM'ren' d'a'",
      medium: "y MMM d",
      short: "yy/MM/dd"
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
      full: "{{date}} 'tan' {{time}}",
      long: "{{date}} 'tan' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/eu/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'joan den' eeee, LT",
  yesterday: "'atzo,' p",
  today: "'gaur,' p",
  tomorrow: "'bihar,' p",
  nextWeek: "eeee, p",
  other: "P"
};
var formatRelativeLocalePlural = {
  lastWeek: "'joan den' eeee, p",
  yesterday: "'atzo,' p",
  today: "'gaur,' p",
  tomorrow: "'bihar,' p",
  nextWeek: "eeee, p",
  other: "P"
};
var formatRelative = function formatRelative(token, date) {
  if (date.getHours() !== 1) return formatRelativeLocalePlural[token];
  return formatRelativeLocale[token];
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
//#region dist/date-fns/locale/eu/_lib/localize.js
var eraValues = {
  narrow: ["k.a.", "k.o."],
  abbreviated: ["k.a.", "k.o."],
  wide: ["kristo aurretik", "kristo ondoren"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1H",
  "2H",
  "3H",
  "4H"],

  wide: [
  "1. hiruhilekoa",
  "2. hiruhilekoa",
  "3. hiruhilekoa",
  "4. hiruhilekoa"]

};
var monthValues = {
  narrow: [
  "u",
  "o",
  "m",
  "a",
  "m",
  "e",
  "u",
  "a",
  "i",
  "u",
  "a",
  "a"],

  abbreviated: [
  "urt",
  "ots",
  "mar",
  "api",
  "mai",
  "eka",
  "uzt",
  "abu",
  "ira",
  "urr",
  "aza",
  "abe"],

  wide: [
  "urtarrila",
  "otsaila",
  "martxoa",
  "apirila",
  "maiatza",
  "ekaina",
  "uztaila",
  "abuztua",
  "iraila",
  "urria",
  "azaroa",
  "abendua"]

};
var dayValues = {
  narrow: [
  "i",
  "a",
  "a",
  "a",
  "o",
  "o",
  "l"],

  short: [
  "ig",
  "al",
  "as",
  "az",
  "og",
  "or",
  "lr"],

  abbreviated: [
  "iga",
  "ast",
  "ast",
  "ast",
  "ost",
  "ost",
  "lar"],

  wide: [
  "igandea",
  "astelehena",
  "asteartea",
  "asteazkena",
  "osteguna",
  "ostirala",
  "larunbata"]

};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "ge",
    noon: "eg",
    morning: "goiza",
    afternoon: "arratsaldea",
    evening: "arratsaldea",
    night: "gaua"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gauerdia",
    noon: "eguerdia",
    morning: "goiza",
    afternoon: "arratsaldea",
    evening: "arratsaldea",
    night: "gaua"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gauerdia",
    noon: "eguerdia",
    morning: "goiza",
    afternoon: "arratsaldea",
    evening: "arratsaldea",
    night: "gaua"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "ge",
    noon: "eg",
    morning: "goizean",
    afternoon: "arratsaldean",
    evening: "arratsaldean",
    night: "gauean"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gauerdia",
    noon: "eguerdia",
    morning: "goizean",
    afternoon: "arratsaldean",
    evening: "arratsaldean",
    night: "gauean"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gauerdia",
    noon: "eguerdia",
    morning: "goizean",
    afternoon: "arratsaldean",
    evening: "arratsaldean",
    night: "gauean"
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
//#region dist/date-fns/locale/eu.js
/**
* @category Locales
* @summary Basque locale.
* @language Basque
* @iso-639-2 eus
* @author Jacob Söderblom [@JacobSoderblom](https://github.com/JacobSoderblom)
*/
var eu = {
  code: "eu",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(.)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(k.a.|k.o.)/i,
        abbreviated: /^(k.a.|k.o.)/i,
        wide: /^(kristo aurretik|kristo ondoren)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [/^k.a./i, /^k.o./i],
        abbreviated: [/^(k.a.)/i, /^(k.o.)/i],
        wide: [/^(kristo aurretik)/i, /^(kristo ondoren)/i]
      },
      defaultParseWidth: "wide"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234]H/i,
        wide: /^[1234](.)? hiruhilekoa/i
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
        narrow: /^[uomaei]/i,
        abbreviated: /^(urt|ots|mar|api|mai|eka|uzt|abu|ira|urr|aza|abe)/i,
        wide: /^(urtarrila|otsaila|martxoa|apirila|maiatza|ekaina|uztaila|abuztua|iraila|urria|azaroa|abendua)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^u/i,
        /^o/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^e/i,
        /^u/i,
        /^a/i,
        /^i/i,
        /^u/i,
        /^a/i,
        /^a/i],

        any: [
        /^urt/i,
        /^ots/i,
        /^mar/i,
        /^api/i,
        /^mai/i,
        /^eka/i,
        /^uzt/i,
        /^abu/i,
        /^ira/i,
        /^urr/i,
        /^aza/i,
        /^abe/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[iaol]/i,
        short: /^(ig|al|as|az|og|or|lr)/i,
        abbreviated: /^(iga|ast|ast|ast|ost|ost|lar)/i,
        wide: /^(igandea|astelehena|asteartea|asteazkena|osteguna|ostirala|larunbata)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^i/i,
        /^a/i,
        /^a/i,
        /^a/i,
        /^o/i,
        /^o/i,
        /^l/i],

        short: [
        /^ig/i,
        /^al/i,
        /^as/i,
        /^az/i,
        /^og/i,
        /^or/i,
        /^lr/i],

        abbreviated: [
        /^iga/i,
        /^ast/i,
        /^ast/i,
        /^ast/i,
        /^ost/i,
        /^ost/i,
        /^lar/i],

        wide: [
        /^igandea/i,
        /^astelehena/i,
        /^asteartea/i,
        /^asteazkena/i,
        /^osteguna/i,
        /^ostirala/i,
        /^larunbata/i]

      },
      defaultParseWidth: "wide"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|ge|eg|((goiza|goizean)|arratsaldea|(gaua|gauean)))/i,
        any: /^([ap]\.?\s?m\.?|gauerdia|eguerdia|((goiza|goizean)|arratsaldea|(gaua|gauean)))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: {
        narrow: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^ge/i,
          noon: /^eg/i,
          morning: /goiz/i,
          afternoon: /arratsaldea/i,
          evening: /arratsaldea/i,
          night: /gau/i
        },
        any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^gauerdia/i,
          noon: /^eguerdia/i,
          morning: /goiz/i,
          afternoon: /arratsaldea/i,
          evening: /arratsaldea/i,
          night: /gau/i
        }
      },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/eu/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    eu: eu }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();