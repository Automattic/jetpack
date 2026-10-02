(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/az/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "bir saniyədən az",
    other: "{{count}} bir saniyədən az"
  },
  xSeconds: {
    one: "1 saniyə",
    other: "{{count}} saniyə"
  },
  halfAMinute: "yarım dəqiqə",
  lessThanXMinutes: {
    one: "bir dəqiqədən az",
    other: "{{count}} bir dəqiqədən az"
  },
  xMinutes: {
    one: "bir dəqiqə",
    other: "{{count}} dəqiqə"
  },
  aboutXHours: {
    one: "təxminən 1 saat",
    other: "təxminən {{count}} saat"
  },
  xHours: {
    one: "1 saat",
    other: "{{count}} saat"
  },
  xDays: {
    one: "1 gün",
    other: "{{count}} gün"
  },
  aboutXWeeks: {
    one: "təxminən 1 həftə",
    other: "təxminən {{count}} həftə"
  },
  xWeeks: {
    one: "1 həftə",
    other: "{{count}} həftə"
  },
  aboutXMonths: {
    one: "təxminən 1 ay",
    other: "təxminən {{count}} ay"
  },
  xMonths: {
    one: "1 ay",
    other: "{{count}} ay"
  },
  aboutXYears: {
    one: "təxminən 1 il",
    other: "təxminən {{count}} il"
  },
  xYears: {
    one: "1 il",
    other: "{{count}} il"
  },
  overXYears: {
    one: "1 ildən çox",
    other: "{{count}} ildən çox"
  },
  almostXYears: {
    one: "demək olar ki 1 il",
    other: "demək olar ki {{count}} il"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + " sonra";else
  return result + " əvvəl";
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
      full: "EEEE, do MMMM y 'il'",
      long: "do MMMM y 'il'",
      medium: "d MMM y 'il'",
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
    formats: {
      full: "{{date}} {{time}} - 'də'",
      long: "{{date}} {{time}} - 'də'",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/az/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'sonuncu' eeee p -'də'",
  yesterday: "'dünən' p -'də'",
  today: "'bugün' p -'də'",
  tomorrow: "'sabah' p -'də'",
  nextWeek: "eeee p -'də'",
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
//#region dist/date-fns/locale/az/_lib/localize.js
var eraValues = {
  narrow: ["e.ə", "b.e"],
  abbreviated: ["e.ə", "b.e"],
  wide: ["eramızdan əvvəl", "bizim era"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "K1",
  "K2",
  "K3",
  "K4"],

  wide: [
  "1ci kvartal",
  "2ci kvartal",
  "3cü kvartal",
  "4cü kvartal"]

};
var monthValues = {
  narrow: [
  "Y",
  "F",
  "M",
  "A",
  "M",
  "İ",
  "İ",
  "A",
  "S",
  "O",
  "N",
  "D"],

  abbreviated: [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyun",
  "İyul",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek"],

  wide: [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr"]

};
var dayValues = {
  narrow: [
  "B.",
  "B.e",
  "Ç.a",
  "Ç.",
  "C.a",
  "C.",
  "Ş."],

  short: [
  "B.",
  "B.e",
  "Ç.a",
  "Ç.",
  "C.a",
  "C.",
  "Ş."],

  abbreviated: [
  "Baz",
  "Baz.e",
  "Çər.a",
  "Çər",
  "Cüm.a",
  "Cüm",
  "Şə"],

  wide: [
  "Bazar",
  "Bazar ertəsi",
  "Çərşənbə axşamı",
  "Çərşənbə",
  "Cümə axşamı",
  "Cümə",
  "Şənbə"]

};
var dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə"
  }
};
var suffixes = {
  1: "-inci",
  5: "-inci",
  8: "-inci",
  70: "-inci",
  80: "-inci",
  2: "-nci",
  7: "-nci",
  20: "-nci",
  50: "-nci",
  3: "-üncü",
  4: "-üncü",
  100: "-üncü",
  6: "-ncı",
  9: "-uncu",
  10: "-uncu",
  30: "-uncu",
  60: "-ıncı",
  90: "-ıncı"
};
var getSuffix = function getSuffix(number) {
  if (number === 0) return number + "-ıncı";
  var a = number % 10;
  var b = number % 100 - a;
  var c = number >= 100 ? 100 : null;
  if (suffixes[a]) return suffixes[a];else
  if (suffixes[b]) return suffixes[b];else
  if (c !== null) return suffixes[c];
  return "";
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  return number + getSuffix(number);
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
//#region dist/date-fns/locale/az.js
/**
* @category Locales
* @summary Azerbaijani locale.
* @language Azerbaijani
* @iso-639-2 aze
*/
var az = {
  code: "az",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(-?(ci|inci|nci|uncu|üncü|ncı))?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(b|a)$/i,
        abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)$/i,
        wide: /^(bizim eradan əvvəl|bizim era)$/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b$/i, /^(a|c)$/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]$/i,
        abbreviated: /^K[1234]$/i,
        wide: /^[1234](ci)? kvartal$/i
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
        narrow: /^[(?-i)yfmaisond]$/i,
        abbreviated: /^(Yan|Fev|Mar|Apr|May|İyun|İyul|Avq|Sen|Okt|Noy|Dek)$/i,
        wide: /^(Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avgust|Sentyabr|Oktyabr|Noyabr|Dekabr)$/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^[(?-i)y]$/i,
        /^[(?-i)f]$/i,
        /^[(?-i)m]$/i,
        /^[(?-i)a]$/i,
        /^[(?-i)m]$/i,
        /^[(?-i)i]$/i,
        /^[(?-i)i]$/i,
        /^[(?-i)a]$/i,
        /^[(?-i)s]$/i,
        /^[(?-i)o]$/i,
        /^[(?-i)n]$/i,
        /^[(?-i)d]$/i],

        abbreviated: [
        /^Yan$/i,
        /^Fev$/i,
        /^Mar$/i,
        /^Apr$/i,
        /^May$/i,
        /^İyun$/i,
        /^İyul$/i,
        /^Avg$/i,
        /^Sen$/i,
        /^Okt$/i,
        /^Noy$/i,
        /^Dek$/i],

        wide: [
        /^Yanvar$/i,
        /^Fevral$/i,
        /^Mart$/i,
        /^Aprel$/i,
        /^May$/i,
        /^İyun$/i,
        /^İyul$/i,
        /^Avgust$/i,
        /^Sentyabr$/i,
        /^Oktyabr$/i,
        /^Noyabr$/i,
        /^Dekabr$/i]

      },
      defaultParseWidth: "narrow"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(B\.|B\.e|Ç\.a|Ç\.|C\.a|C\.|Ş\.)$/i,
        short: /^(B\.|B\.e|Ç\.a|Ç\.|C\.a|C\.|Ş\.)$/i,
        abbreviated: /^(Baz\.e|Çər|Çər\.a|Cüm|Cüm\.a|Şə)$/i,
        wide: /^(Bazar|Bazar ertəsi|Çərşənbə axşamı|Çərşənbə|Cümə axşamı|Cümə|Şənbə)$/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^B\.$/i,
        /^B\.e$/i,
        /^Ç\.a$/i,
        /^Ç\.$/i,
        /^C\.a$/i,
        /^C\.$/i,
        /^Ş\.$/i],

        abbreviated: [
        /^Baz$/i,
        /^Baz\.e$/i,
        /^Çər\.a$/i,
        /^Çər$/i,
        /^Cüm\.a$/i,
        /^Cüm$/i,
        /^Şə$/i],

        wide: [
        /^Bazar$/i,
        /^Bazar ertəsi$/i,
        /^Çərşənbə axşamı$/i,
        /^Çərşənbə$/i,
        /^Cümə axşamı$/i,
        /^Cümə$/i,
        /^Şənbə$/i],

        any: [
        /^B\.$/i,
        /^B\.e$/i,
        /^Ç\.a$/i,
        /^Ç\.$/i,
        /^C\.a$/i,
        /^C\.$/i,
        /^Ş\.$/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|gecəyarı|gün|səhər|gündüz|axşam|gecə)$/i,
        any: /^(am|pm|a\.m\.|p\.m\.|AM|PM|gecəyarı|gün|səhər|gündüz|axşam|gecə)$/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a$/i,
          pm: /^p$/i,
          midnight: /^gecəyarı$/i,
          noon: /^gün$/i,
          morning: /səhər$/i,
          afternoon: /gündüz$/i,
          evening: /axşam$/i,
          night: /gecə$/i
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
//#region dist/date-fns/_entries/locale/az/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    az: az }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();