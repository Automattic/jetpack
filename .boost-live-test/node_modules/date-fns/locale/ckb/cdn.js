(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ckb/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "کەمتر لە یەک چرکە",
    other: "کەمتر لە {{count}} چرکە"
  },
  xSeconds: {
    one: "1 چرکە",
    other: "{{count}} چرکە"
  },
  halfAMinute: "نیو کاتژمێر",
  lessThanXMinutes: {
    one: "کەمتر لە یەک خولەک",
    other: "کەمتر لە {{count}} خولەک"
  },
  xMinutes: {
    one: "1 خولەک",
    other: "{{count}} خولەک"
  },
  aboutXHours: {
    one: "دەوروبەری 1 کاتژمێر",
    other: "دەوروبەری {{count}} کاتژمێر"
  },
  xHours: {
    one: "1 کاتژمێر",
    other: "{{count}} کاتژمێر"
  },
  xDays: {
    one: "1 ڕۆژ",
    other: "{{count}} ژۆژ"
  },
  aboutXWeeks: {
    one: "دەوروبەری 1 هەفتە",
    other: "دوروبەری {{count}} هەفتە"
  },
  xWeeks: {
    one: "1 هەفتە",
    other: "{{count}} هەفتە"
  },
  aboutXMonths: {
    one: "داوروبەری 1 مانگ",
    other: "دەوروبەری {{count}} مانگ"
  },
  xMonths: {
    one: "1 مانگ",
    other: "{{count}} مانگ"
  },
  aboutXYears: {
    one: "دەوروبەری  1 ساڵ",
    other: "دەوروبەری {{count}} ساڵ"
  },
  xYears: {
    one: "1 ساڵ",
    other: "{{count}} ساڵ"
  },
  overXYears: {
    one: "زیاتر لە ساڵێک",
    other: "زیاتر لە {{count}} ساڵ"
  },
  almostXYears: {
    one: "بەنزیکەیی ساڵێک  ",
    other: "بەنزیکەیی {{count}} ساڵ"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", count.toString());
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "لە ماوەی " + result + "دا";else
  return result + "پێش ئێستا";
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
      full: "{{date}} 'کاتژمێر' {{time}}",
      long: "{{date}} 'کاتژمێر' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ckb/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'هەفتەی ڕابردوو' eeee 'کاتژمێر' p",
  yesterday: "'دوێنێ کاتژمێر' p",
  today: "'ئەمڕۆ کاتژمێر' p",
  tomorrow: "'بەیانی کاتژمێر' p",
  nextWeek: "eeee 'کاتژمێر' p",
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
//#region dist/date-fns/locale/ckb/_lib/localize.js
var eraValues = {
  narrow: ["پ", "د"],
  abbreviated: ["پ-ز", "د-ز"],
  wide: ["پێش زاین", "دوای زاین"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "چ1م",
  "چ2م",
  "چ3م",
  "چ4م"],

  wide: [
  "چارەگی یەکەم",
  "چارەگی دووەم",
  "چارەگی سێیەم",
  "چارەگی چوارەم"]

};
var monthValues = {
  narrow: [
  "ک-د",
  "ش",
  "ئا",
  "ن",
  "م",
  "ح",
  "ت",
  "ئا",
  "ئە",
  "تش-ی",
  "تش-د",
  "ک-ی"],

  abbreviated: [
  "کان-دوو",
  "شوب",
  "ئاد",
  "نیس",
  "مایس",
  "حوز",
  "تەم",
  "ئاب",
  "ئەل",
  "تش-یەک",
  "تش-دوو",
  "کان-یەک"],

  wide: [
  "کانوونی دووەم",
  "شوبات",
  "ئادار",
  "نیسان",
  "مایس",
  "حوزەیران",
  "تەمموز",
  "ئاب",
  "ئەیلول",
  "تشرینی یەکەم",
  "تشرینی دووەم",
  "کانوونی یەکەم"]

};
var dayValues = {
  narrow: [
  "ی-ش",
  "د-ش",
  "س-ش",
  "چ-ش",
  "پ-ش",
  "هە",
  "ش"],

  short: [
  "یە-شە",
  "دوو-شە",
  "سێ-شە",
  "چو-شە",
  "پێ-شە",
  "هەی",
  "شە"],

  abbreviated: [
  "یەک-شەم",
  "دوو-شەم",
  "سێ-شەم",
  "چوار-شەم",
  "پێنج-شەم",
  "هەینی",
  "شەمە"],

  wide: [
  "یەک شەمە",
  "دوو شەمە",
  "سێ شەمە",
  "چوار شەمە",
  "پێنج شەمە",
  "هەینی",
  "شەمە"]

};
var dayPeriodValues = {
  narrow: {
    am: "پ",
    pm: "د",
    midnight: "ن-ش",
    noon: "ن",
    morning: "بەیانی",
    afternoon: "دوای نیوەڕۆ",
    evening: "ئێوارە",
    night: "شەو"
  },
  abbreviated: {
    am: "پ-ن",
    pm: "د-ن",
    midnight: "نیوە شەو",
    noon: "نیوەڕۆ",
    morning: "بەیانی",
    afternoon: "دوای نیوەڕۆ",
    evening: "ئێوارە",
    night: "شەو"
  },
  wide: {
    am: "پێش نیوەڕۆ",
    pm: "دوای نیوەڕۆ",
    midnight: "نیوە شەو",
    noon: "نیوەڕۆ",
    morning: "بەیانی",
    afternoon: "دوای نیوەڕۆ",
    evening: "ئێوارە",
    night: "شەو"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "پ",
    pm: "د",
    midnight: "ن-ش",
    noon: "ن",
    morning: "لە بەیانیدا",
    afternoon: "لە دوای نیوەڕۆدا",
    evening: "لە ئێوارەدا",
    night: "لە شەودا"
  },
  abbreviated: {
    am: "پ-ن",
    pm: "د-ن",
    midnight: "نیوە شەو",
    noon: "نیوەڕۆ",
    morning: "لە بەیانیدا",
    afternoon: "لە دوای نیوەڕۆدا",
    evening: "لە ئێوارەدا",
    night: "لە شەودا"
  },
  wide: {
    am: "پێش نیوەڕۆ",
    pm: "دوای نیوەڕۆ",
    midnight: "نیوە شەو",
    noon: "نیوەڕۆ",
    morning: "لە بەیانیدا",
    afternoon: "لە دوای نیوەڕۆدا",
    evening: "لە ئێوارەدا",
    night: "لە شەودا"
  }
};
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
//#region dist/date-fns/locale/ckb.js
/**
* @type {Locale}
* @category Locales
* @summary Central Kurdish locale.
* @language Central Kurdish
* @iso-639-2 kur
* @author Revan Sarbast [@Revan99]{@link https://github.com/Revan99}
*/
var ckb = {
  code: "ckb",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(th|st|nd|rd)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(پ|د)/i,
        abbreviated: /^(پ-ز|د.ز)/i,
        wide: /^(پێش زاین| دوای زاین)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^د/g, /^پ/g] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^م[1234]چ/i,
        wide: /^(یەکەم|دووەم|سێیەم| چوارەم) (چارەگی)? quarter/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        wide: [
        /چارەگی یەکەم/,
        /چارەگی دووەم/,
        /چارەگی سيیەم/,
        /چارەگی چوارەم/],

        any: [
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
        narrow: /^(ک-د|ش|ئا|ن|م|ح|ت|ئە|تش-ی|تش-د|ک-ی)/i,
        abbreviated: /^(کان-دوو|شوب|ئاد|نیس|مایس|حوز|تەم|ئاب|ئەل|تش-یەک|تش-دوو|کان-یەک)/i,
        wide: /^(کانوونی دووەم|شوبات|ئادار|نیسان|مایس|حوزەیران|تەمموز|ئاب|ئەیلول|تشرینی یەکەم|تشرینی دووەم|کانوونی یەکەم)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ک-د/i,
        /^ش/i,
        /^ئا/i,
        /^ن/i,
        /^م/i,
        /^ح/i,
        /^ت/i,
        /^ئا/i,
        /^ئە/i,
        /^تش-ی/i,
        /^تش-د/i,
        /^ک-ی/i],

        any: [
        /^کان-دوو/i,
        /^شوب/i,
        /^ئاد/i,
        /^نیس/i,
        /^مایس/i,
        /^حوز/i,
        /^تەم/i,
        /^ئاب/i,
        /^ئەل/i,
        /^تش-یەک/i,
        /^تش-دوو/i,
        /^|کان-یەک/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ش|ی|د|س|چ|پ|هە)/i,
        short: /^(یە-شە|دوو-شە|سێ-شە|چو-شە|پێ-شە|هە|شە)/i,
        abbreviated: /^(یەک-شەم|دوو-شەم|سێ-شەم|چوار-شەم|پێنخ-شەم|هەینی|شەمە)/i,
        wide: /^(یەک شەمە|دوو شەمە|سێ شەمە|چوار شەمە|پێنج شەمە|هەینی|شەمە)/i
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
      matchPatterns: {
        narrow: /^(پ|د|ن-ش|ن| (بەیانی|دوای نیوەڕۆ|ئێوارە|شەو))/i,
        abbreviated: /^(پ-ن|د-ن|نیوە شەو|نیوەڕۆ|بەیانی|دوای نیوەڕۆ|ئێوارە|شەو)/,
        wide: /^(پێش نیوەڕۆ|دوای نیوەڕۆ|نیوەڕۆ|نیوە شەو|لەبەیانیدا|لەدواینیوەڕۆدا|لە ئێوارەدا|لە شەودا)/,
        any: /^(پ|د|بەیانی|نیوەڕۆ|ئێوارە|شەو)/
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^د/i,
          pm: /^پ/i,
          midnight: /^ن-ش/i,
          noon: /^ن/i,
          morning: /بەیانی/i,
          afternoon: /دواینیوەڕۆ/i,
          evening: /ئێوارە/i,
          night: /شەو/i
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
//#region dist/date-fns/_entries/locale/ckb/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    ckb: ckb }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();