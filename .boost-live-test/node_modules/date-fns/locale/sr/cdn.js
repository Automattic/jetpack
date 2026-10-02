(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/sr/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: {
      standalone: "мање од 1 секунде",
      withPrepositionAgo: "мање од 1 секунде",
      withPrepositionIn: "мање од 1 секунду"
    },
    dual: "мање од {{count}} секунде",
    other: "мање од {{count}} секунди"
  },
  xSeconds: {
    one: {
      standalone: "1 секунда",
      withPrepositionAgo: "1 секунде",
      withPrepositionIn: "1 секунду"
    },
    dual: "{{count}} секунде",
    other: "{{count}} секунди"
  },
  halfAMinute: "пола минуте",
  lessThanXMinutes: {
    one: {
      standalone: "мање од 1 минуте",
      withPrepositionAgo: "мање од 1 минуте",
      withPrepositionIn: "мање од 1 минуту"
    },
    dual: "мање од {{count}} минуте",
    other: "мање од {{count}} минута"
  },
  xMinutes: {
    one: {
      standalone: "1 минута",
      withPrepositionAgo: "1 минуте",
      withPrepositionIn: "1 минуту"
    },
    dual: "{{count}} минуте",
    other: "{{count}} минута"
  },
  aboutXHours: {
    one: {
      standalone: "око 1 сат",
      withPrepositionAgo: "око 1 сат",
      withPrepositionIn: "око 1 сат"
    },
    dual: "око {{count}} сата",
    other: "око {{count}} сати"
  },
  xHours: {
    one: {
      standalone: "1 сат",
      withPrepositionAgo: "1 сат",
      withPrepositionIn: "1 сат"
    },
    dual: "{{count}} сата",
    other: "{{count}} сати"
  },
  xDays: {
    one: {
      standalone: "1 дан",
      withPrepositionAgo: "1 дан",
      withPrepositionIn: "1 дан"
    },
    dual: "{{count}} дана",
    other: "{{count}} дана"
  },
  aboutXWeeks: {
    one: {
      standalone: "око 1 недељу",
      withPrepositionAgo: "око 1 недељу",
      withPrepositionIn: "око 1 недељу"
    },
    dual: "око {{count}} недеље",
    other: "око {{count}} недеље"
  },
  xWeeks: {
    one: {
      standalone: "1 недељу",
      withPrepositionAgo: "1 недељу",
      withPrepositionIn: "1 недељу"
    },
    dual: "{{count}} недеље",
    other: "{{count}} недеље"
  },
  aboutXMonths: {
    one: {
      standalone: "око 1 месец",
      withPrepositionAgo: "око 1 месец",
      withPrepositionIn: "око 1 месец"
    },
    dual: "око {{count}} месеца",
    other: "око {{count}} месеци"
  },
  xMonths: {
    one: {
      standalone: "1 месец",
      withPrepositionAgo: "1 месец",
      withPrepositionIn: "1 месец"
    },
    dual: "{{count}} месеца",
    other: "{{count}} месеци"
  },
  aboutXYears: {
    one: {
      standalone: "око 1 годину",
      withPrepositionAgo: "око 1 годину",
      withPrepositionIn: "око 1 годину"
    },
    dual: "око {{count}} године",
    other: "око {{count}} година"
  },
  xYears: {
    one: {
      standalone: "1 година",
      withPrepositionAgo: "1 године",
      withPrepositionIn: "1 годину"
    },
    dual: "{{count}} године",
    other: "{{count}} година"
  },
  overXYears: {
    one: {
      standalone: "преко 1 годину",
      withPrepositionAgo: "преко 1 годину",
      withPrepositionIn: "преко 1 годину"
    },
    dual: "преко {{count}} године",
    other: "преко {{count}} година"
  },
  almostXYears: {
    one: {
      standalone: "готово 1 годину",
      withPrepositionAgo: "готово 1 годину",
      withPrepositionIn: "готово 1 годину"
    },
    dual: "готово {{count}} године",
    other: "готово {{count}} година"
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
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "за " + result;else
  return "пре " + result;
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
      full: "{{date}} 'у' {{time}}",
      long: "{{date}} 'у' {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/sr/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: function lastWeek(date) {
    switch (date.getDay()) {
      case 0:return "'прошле недеље у' p";
      case 3:return "'прошле среде у' p";
      case 6:return "'прошле суботе у' p";
      default:return "'прошли' EEEE 'у' p";
    }
  },
  yesterday: "'јуче у' p",
  today: "'данас у' p",
  tomorrow: "'сутра у' p",
  nextWeek: function nextWeek(date) {
    switch (date.getDay()) {
      case 0:return "'следеће недеље у' p";
      case 3:return "'следећу среду у' p";
      case 6:return "'следећу суботу у' p";
      default:return "'следећи' EEEE 'у' p";
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
//#region dist/date-fns/locale/sr/_lib/localize.js
var eraValues = {
  narrow: ["пр.н.е.", "АД"],
  abbreviated: ["пр. Хр.", "по. Хр."],
  wide: ["Пре Христа", "После Христа"]
};
var quarterValues = {
  narrow: [
  "1.",
  "2.",
  "3.",
  "4."],

  abbreviated: [
  "1. кв.",
  "2. кв.",
  "3. кв.",
  "4. кв."],

  wide: [
  "1. квартал",
  "2. квартал",
  "3. квартал",
  "4. квартал"]

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
  "јан",
  "феб",
  "мар",
  "апр",
  "мај",
  "јун",
  "јул",
  "авг",
  "сеп",
  "окт",
  "нов",
  "дец"],

  wide: [
  "јануар",
  "фебруар",
  "март",
  "април",
  "мај",
  "јун",
  "јул",
  "август",
  "септембар",
  "октобар",
  "новембар",
  "децембар"]

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
  "јан",
  "феб",
  "мар",
  "апр",
  "мај",
  "јун",
  "јул",
  "авг",
  "сеп",
  "окт",
  "нов",
  "дец"],

  wide: [
  "јануар",
  "фебруар",
  "март",
  "април",
  "мај",
  "јун",
  "јул",
  "август",
  "септембар",
  "октобар",
  "новембар",
  "децембар"]

};
var dayValues = {
  narrow: [
  "Н",
  "П",
  "У",
  "С",
  "Ч",
  "П",
  "С"],

  short: [
  "нед",
  "пон",
  "уто",
  "сре",
  "чет",
  "пет",
  "суб"],

  abbreviated: [
  "нед",
  "пон",
  "уто",
  "сре",
  "чет",
  "пет",
  "суб"],

  wide: [
  "недеља",
  "понедељак",
  "уторак",
  "среда",
  "четвртак",
  "петак",
  "субота"]

};
var formattingDayPeriodValues = {
  narrow: {
    am: "АМ",
    pm: "ПМ",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "поподне",
    evening: "увече",
    night: "ноћу"
  },
  abbreviated: {
    am: "АМ",
    pm: "ПМ",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "поподне",
    evening: "увече",
    night: "ноћу"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "после подне",
    evening: "увече",
    night: "ноћу"
  }
};
var dayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "поподне",
    evening: "увече",
    night: "ноћу"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "поподне",
    evening: "увече",
    night: "ноћу"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "поноћ",
    noon: "подне",
    morning: "ујутру",
    afternoon: "после подне",
    evening: "увече",
    night: "ноћу"
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
//#region dist/date-fns/locale/sr.js
/**
* @category Locales
* @summary Serbian cyrillic locale.
* @language Serbian
* @iso-639-2 srp
* @author Igor Radivojević [@rogyvoje](https://github.com/rogyvoje)
*/
var sr = {
  code: "sr",
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
        narrow: /^(пр\.н\.е\.|АД)/i,
        abbreviated: /^(пр\.\s?Хр\.|по\.\s?Хр\.)/i,
        wide: /^(Пре Христа|пре нове ере|После Христа|нова ера)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^пр/i, /^(по|нова)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234]\.\s?кв\.?/i,
        wide: /^[1234]\. квартал/i
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
        abbreviated: /^(јан|феб|мар|апр|мај|јун|јул|авг|сеп|окт|нов|дец)/i,
        wide: /^((јануар|јануара)|(фебруар|фебруара)|(март|марта)|(април|априла)|(мја|маја)|(јун|јуна)|(јул|јула)|(август|августа)|(септембар|септембра)|(октобар|октобра)|(новембар|новембра)|(децембар|децембра))/i
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
        /^ја/i,
        /^ф/i,
        /^мар/i,
        /^ап/i,
        /^мај/i,
        /^јун/i,
        /^јул/i,
        /^авг/i,
        /^с/i,
        /^о/i,
        /^н/i,
        /^д/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[пусчн]/i,
        short: /^(нед|пон|уто|сре|чет|пет|суб)/i,
        abbreviated: /^(нед|пон|уто|сре|чет|пет|суб)/i,
        wide: /^(недеља|понедељак|уторак|среда|четвртак|петак|субота)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^п/i,
        /^у/i,
        /^с/i,
        /^ч/i,
        /^п/i,
        /^с/i,
        /^н/i],

        any: [
        /^нед/i,
        /^пон/i,
        /^уто/i,
        /^сре/i,
        /^чет/i,
        /^пет/i,
        /^суб/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^(ам|пм|поноћ|(по)?подне|увече|ноћу|после подне|ујутру)/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^поно/i,
          noon: /^под/i,
          morning: /ујутру/i,
          afternoon: /(после\s|по)+подне/i,
          evening: /(увече)/i,
          night: /(ноћу)/i
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
//#region dist/date-fns/_entries/locale/sr/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    sr: sr }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();