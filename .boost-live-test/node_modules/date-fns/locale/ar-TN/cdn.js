(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ar-TN/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "أقل من ثانية",
    two: "أقل من زوز ثواني",
    threeToTen: "أقل من {{count}} ثواني",
    other: "أقل من {{count}} ثانية"
  },
  xSeconds: {
    one: "ثانية",
    two: "زوز ثواني",
    threeToTen: "{{count}} ثواني",
    other: "{{count}} ثانية"
  },
  halfAMinute: "نص دقيقة",
  lessThanXMinutes: {
    one: "أقل من دقيقة",
    two: "أقل من دقيقتين",
    threeToTen: "أقل من {{count}} دقايق",
    other: "أقل من {{count}} دقيقة"
  },
  xMinutes: {
    one: "دقيقة",
    two: "دقيقتين",
    threeToTen: "{{count}} دقايق",
    other: "{{count}} دقيقة"
  },
  aboutXHours: {
    one: "ساعة تقريب",
    two: "ساعتين تقريب",
    threeToTen: "{{count}} سوايع تقريب",
    other: "{{count}} ساعة تقريب"
  },
  xHours: {
    one: "ساعة",
    two: "ساعتين",
    threeToTen: "{{count}} سوايع",
    other: "{{count}} ساعة"
  },
  xDays: {
    one: "نهار",
    two: "نهارين",
    threeToTen: "{{count}} أيام",
    other: "{{count}} يوم"
  },
  aboutXWeeks: {
    one: "جمعة تقريب",
    two: "جمعتين تقريب",
    threeToTen: "{{count}} جماع تقريب",
    other: "{{count}} جمعة تقريب"
  },
  xWeeks: {
    one: "جمعة",
    two: "جمعتين",
    threeToTen: "{{count}} جماع",
    other: "{{count}} جمعة"
  },
  aboutXMonths: {
    one: "شهر تقريب",
    two: "شهرين تقريب",
    threeToTen: "{{count}} أشهرة تقريب",
    other: "{{count}} شهر تقريب"
  },
  xMonths: {
    one: "شهر",
    two: "شهرين",
    threeToTen: "{{count}} أشهرة",
    other: "{{count}} شهر"
  },
  aboutXYears: {
    one: "عام تقريب",
    two: "عامين تقريب",
    threeToTen: "{{count}} أعوام تقريب",
    other: "{{count}} عام تقريب"
  },
  xYears: {
    one: "عام",
    two: "عامين",
    threeToTen: "{{count}} أعوام",
    other: "{{count}} عام"
  },
  overXYears: {
    one: "أكثر من عام",
    two: "أكثر من عامين",
    threeToTen: "أكثر من {{count}} أعوام",
    other: "أكثر من {{count}} عام"
  },
  almostXYears: {
    one: "عام تقريب",
    two: "عامين تقريب",
    threeToTen: "{{count}} أعوام تقريب",
    other: "{{count}} عام تقريب"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var usageGroup = formatDistanceLocale[token];
  var result;
  if (typeof usageGroup === "string") result = usageGroup;else
  if (count === 1) result = usageGroup.one;else
  if (count === 2) result = usageGroup.two;else
  if (count <= 10) result = usageGroup.threeToTen.replace("{{count}}", String(count));else
  result = usageGroup.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "في " + result;else
  return "عندو " + result;
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
      full: "EEEE، do MMMM y",
      long: "do MMMM y",
      medium: "d MMM y",
      short: "dd/MM/yyyy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH:mm:ss",
      long: "HH:mm:ss",
      medium: "HH:mm:ss",
      short: "HH:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'مع' {{time}}",
      long: "{{date}} 'مع' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ar-TN/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'إلي فات مع' p",
  yesterday: "'البارح مع' p",
  today: "'اليوم مع' p",
  tomorrow: "'غدوة مع' p",
  nextWeek: "eeee 'الجمعة الجاية مع' p 'نهار'",
  other: "P"
};
var formatRelative = function formatRelative(token) {return formatRelativeLocale[token];};
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
//#region dist/date-fns/locale/ar-TN/_lib/localize.js
var eraValues = {
  narrow: ["ق", "ب"],
  abbreviated: ["ق.م.", "ب.م."],
  wide: ["قبل الميلاد", "بعد الميلاد"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "ر1",
  "ر2",
  "ر3",
  "ر4"],

  wide: [
  "الربع الأول",
  "الربع الثاني",
  "الربع الثالث",
  "الربع الرابع"]

};
var monthValues = {
  narrow: [
  "د",
  "ن",
  "أ",
  "س",
  "أ",
  "ج",
  "ج",
  "م",
  "أ",
  "م",
  "ف",
  "ج"],

  abbreviated: [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"],

  wide: [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"]

};
var dayValues = {
  narrow: [
  "ح",
  "ن",
  "ث",
  "ر",
  "خ",
  "ج",
  "س"],

  short: [
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
  "سبت"],

  abbreviated: [
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
  "سبت"],

  wide: [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت"]

};
var dayPeriodValues = {
  narrow: {
    am: "ص",
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل"
  },
  abbreviated: {
    am: "ص",
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل"
  },
  wide: {
    am: "ص",
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل"
  },
  abbreviated: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل"
  },
  wide: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل"
  }
};
var ordinalNumber = function ordinalNumber(num) {return String(num);};
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
//#region dist/date-fns/locale/ar-TN.js
/**
* @category Locales
* @summary Arabic locale (Tunisian Arabic).
* @language Arabic
* @iso-639-2 ara
* @author Koussay Haj Kacem [@essana3](https://github.com/essana3)
*/
var arTN = {
  code: "ar-TN",
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
        narrow: /[قب]/,
        abbreviated: /[قب]\.م\./,
        wide: /(قبل|بعد) الميلاد/
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/قبل/, /بعد/] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /ر[1234]/,
        wide: /الربع (الأول|الثاني|الثالث|الرابع)/
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
        narrow: /^[جفمأسند]/,
        abbreviated: /^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/,
        wide: /^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ج/i,
        /^ف/i,
        /^م/i,
        /^أ/i,
        /^م/i,
        /^ج/i,
        /^ج/i,
        /^أ/i,
        /^س/i,
        /^أ/i,
        /^ن/i,
        /^د/i],

        any: [
        /^جانفي/i,
        /^فيفري/i,
        /^مارس/i,
        /^أفريل/i,
        /^ماي/i,
        /^جوان/i,
        /^جويلية/i,
        /^أوت/i,
        /^سبتمبر/i,
        /^أكتوبر/i,
        /^نوفمبر/i,
        /^ديسمبر/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[حنثرخجس]/i,
        short: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
        abbreviated: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
        wide: /^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ح/i,
        /^ن/i,
        /^ث/i,
        /^ر/i,
        /^خ/i,
        /^ج/i,
        /^س/i],

        wide: [
        /^الأحد/i,
        /^الاثنين/i,
        /^الثلاثاء/i,
        /^الأربعاء/i,
        /^الخميس/i,
        /^الجمعة/i,
        /^السبت/i],

        any: [
        /^أح/i,
        /^اث/i,
        /^ث/i,
        /^أر/i,
        /^خ/i,
        /^ج/i,
        /^س/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(ص|ع|ن ل|ل|(في|مع) (صباح|قايلة|عشية|ليل))/,
        any: /^([صع]|نص الليل|قايلة|(في|مع) (صباح|قايلة|عشية|ليل))/
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^ص/,
          pm: /^ع/,
          midnight: /نص الليل/,
          noon: /قايلة/,
          afternoon: /بعد القايلة/,
          morning: /صباح/,
          evening: /عشية/,
          night: /ليل/
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
//#region dist/date-fns/_entries/locale/ar-TN/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    arTN: arTN }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();