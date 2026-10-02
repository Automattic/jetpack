(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/uz-Cyrl/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "1 сониядан кам",
    other: "{{count}} сониядан кам"
  },
  xSeconds: {
    one: "1 сония",
    other: "{{count}} сония"
  },
  halfAMinute: "ярим дақиқа",
  lessThanXMinutes: {
    one: "1 дақиқадан кам",
    other: "{{count}} дақиқадан кам"
  },
  xMinutes: {
    one: "1 дақиқа",
    other: "{{count}} дақиқа"
  },
  aboutXHours: {
    one: "тахминан 1 соат",
    other: "тахминан {{count}} соат"
  },
  xHours: {
    one: "1 соат",
    other: "{{count}} соат"
  },
  xDays: {
    one: "1 кун",
    other: "{{count}} кун"
  },
  aboutXWeeks: {
    one: "тахминан 1 хафта",
    other: "тахминан {{count}} хафта"
  },
  xWeeks: {
    one: "1 хафта",
    other: "{{count}} хафта"
  },
  aboutXMonths: {
    one: "тахминан 1 ой",
    other: "тахминан {{count}} ой"
  },
  xMonths: {
    one: "1 ой",
    other: "{{count}} ой"
  },
  aboutXYears: {
    one: "тахминан 1 йил",
    other: "тахминан {{count}} йил"
  },
  xYears: {
    one: "1 йил",
    other: "{{count}} йил"
  },
  overXYears: {
    one: "1 йилдан кўп",
    other: "{{count}} йилдан кўп"
  },
  almostXYears: {
    one: "деярли 1 йил",
    other: "деярли {{count}} йил"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + "дан кейин";else
  return result + " олдин";
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
      full: "EEEE, do MMMM, y",
      long: "do MMMM, y",
      medium: "d MMM, y",
      short: "dd/MM/yyyy"
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
//#endregion
//#region dist/date-fns/locale/uz-Cyrl/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'ўтган' eeee p 'да'",
  yesterday: "'кеча' p 'да'",
  today: "'бугун' p 'да'",
  tomorrow: "'эртага' p 'да'",
  nextWeek: "eeee p 'да'",
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
//#region dist/date-fns/locale/uz-Cyrl/_lib/localize.js
var eraValues = {
  narrow: ["М.А", "М"],
  abbreviated: ["М.А", "М"],
  wide: ["Милоддан Аввалги", "Милодий"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1-чор.",
  "2-чор.",
  "3-чор.",
  "4-чор."],

  wide: [
  "1-чорак",
  "2-чорак",
  "3-чорак",
  "4-чорак"]

};
var monthValues = {
  narrow: [
  "Я",
  "Ф",
  "М",
  "А",
  "М",
  "И",
  "И",
  "А",
  "С",
  "О",
  "Н",
  "Д"],

  abbreviated: [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек"],

  wide: [
  "январ",
  "феврал",
  "март",
  "апрел",
  "май",
  "июн",
  "июл",
  "август",
  "сентабр",
  "октабр",
  "ноябр",
  "декабр"]

};
var dayValues = {
  narrow: [
  "Я",
  "Д",
  "С",
  "Ч",
  "П",
  "Ж",
  "Ш"],

  short: [
  "як",
  "ду",
  "се",
  "чо",
  "па",
  "жу",
  "ша"],

  abbreviated: [
  "якш",
  "душ",
  "сеш",
  "чор",
  "пай",
  "жум",
  "шан"],

  wide: [
  "якшанба",
  "душанба",
  "сешанба",
  "чоршанба",
  "пайшанба",
  "жума",
  "шанба"]

};
var dayPeriodValues = { any: {
    am: "П.О.",
    pm: "П.К.",
    midnight: "ярим тун",
    noon: "пешин",
    morning: "эрталаб",
    afternoon: "пешиндан кейин",
    evening: "кечаси",
    night: "тун"
  } };
var formattingDayPeriodValues = { any: {
    am: "П.О.",
    pm: "П.К.",
    midnight: "ярим тун",
    noon: "пешин",
    morning: "эрталаб",
    afternoon: "пешиндан кейин",
    evening: "кечаси",
    night: "тун"
  } };
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return String(dirtyNumber);
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
    defaultWidth: "any",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "any"
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
//#region dist/date-fns/locale/uz-Cyrl.js
/**
* @category Locales
* @summary Uzbek Cyrillic locale.
* @language Uzbek
* @iso-639-2 uzb
* @author Kamronbek Shodmonov [@kamronbek28](https://github.com/kamronbek28)
*/
var uzCyrl = {
  code: "uz-Cyrl",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(чи)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(м\.а|м\.)/i,
        abbreviated: /^(м\.а|м\.)/i,
        wide: /^(милоддан аввал|милоддан кейин)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^м/i, /^а/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234]-чор./i,
        wide: /^[1234]-чорак/i
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
        narrow: /^[яфмамииасонд]/i,
        abbreviated: /^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)/i,
        wide: /^(январ|феврал|март|апрел|май|июн|июл|август|сентабр|октабр|ноябр|декабр)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^я/i,
        /^ф/i,
        /^м/i,
        /^а/i,
        /^м/i,
        /^и/i,
        /^и/i,
        /^а/i,
        /^с/i,
        /^о/i,
        /^н/i,
        /^д/i],

        any: [
        /^я/i,
        /^ф/i,
        /^мар/i,
        /^ап/i,
        /^май/i,
        /^июн/i,
        /^июл/i,
        /^ав/i,
        /^с/i,
        /^о/i,
        /^н/i,
        /^д/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[ядсчпжш]/i,
        short: /^(як|ду|се|чо|па|жу|ша)/i,
        abbreviated: /^(якш|душ|сеш|чор|пай|жум|шан)/i,
        wide: /^(якшанба|душанба|сешанба|чоршанба|пайшанба|жума|шанба)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^я/i,
        /^д/i,
        /^с/i,
        /^ч/i,
        /^п/i,
        /^ж/i,
        /^ш/i],

        any: [
        /^як/i,
        /^ду/i,
        /^се/i,
        /^чор/i,
        /^пай/i,
        /^жу/i,
        /^шан/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^(п\.о\.|п\.к\.|ярим тун|пешиндан кейин|(эрталаб|пешиндан кейин|кечаси|тун))/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^п\.о\./i,
          pm: /^п\.к\./i,
          midnight: /^ярим тун/i,
          noon: /^пешиндан кейин/i,
          morning: /эрталаб/i,
          afternoon: /пешиндан кейин/i,
          evening: /кечаси/i,
          night: /тун/i
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
//#region dist/date-fns/_entries/locale/uz-Cyrl/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    uzCyrl: uzCyrl }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();