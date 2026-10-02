(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ug/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "بىر سىكۇنت ئىچىدە",
    other: "سىكۇنت ئىچىدە {{count}}"
  },
  xSeconds: {
    one: "بىر سىكۇنت",
    other: "سىكۇنت {{count}}"
  },
  halfAMinute: "يىرىم مىنۇت",
  lessThanXMinutes: {
    one: "بىر مىنۇت ئىچىدە",
    other: "مىنۇت ئىچىدە {{count}}"
  },
  xMinutes: {
    one: "بىر مىنۇت",
    other: "مىنۇت {{count}}"
  },
  aboutXHours: {
    one: "تەخمىنەن بىر سائەت",
    other: "سائەت {{count}} تەخمىنەن"
  },
  xHours: {
    one: "بىر سائەت",
    other: "سائەت {{count}}"
  },
  xDays: {
    one: "بىر كۈن",
    other: "كۈن {{count}}"
  },
  aboutXWeeks: {
    one: "تەخمىنەن بىرھەپتە",
    other: "ھەپتە {{count}} تەخمىنەن"
  },
  xWeeks: {
    one: "بىرھەپتە",
    other: "ھەپتە {{count}}"
  },
  aboutXMonths: {
    one: "تەخمىنەن بىر ئاي",
    other: "ئاي {{count}} تەخمىنەن"
  },
  xMonths: {
    one: "بىر ئاي",
    other: "ئاي {{count}}"
  },
  aboutXYears: {
    one: "تەخمىنەن بىر يىل",
    other: "يىل {{count}} تەخمىنەن"
  },
  xYears: {
    one: "بىر يىل",
    other: "يىل {{count}}"
  },
  overXYears: {
    one: "بىر يىلدىن ئارتۇق",
    other: "يىلدىن ئارتۇق {{count}}"
  },
  almostXYears: {
    one: "ئاساسەن بىر يىل",
    other: "يىل {{count}} ئاساسەن"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result;else
  return result + " بولدى";
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
      full: "{{date}} 'دە' {{time}}",
      long: "{{date}} 'دە' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ug/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'ئ‍ۆتكەن' eeee 'دە' p",
  yesterday: "'تۈنۈگۈن دە' p",
  today: "'بۈگۈن دە' p",
  tomorrow: "'ئەتە دە' p",
  nextWeek: "eeee 'دە' p",
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
//#region dist/date-fns/locale/ug/_lib/localize.js
var eraValues = {
  narrow: ["ب", "ك"],
  abbreviated: ["ب", "ك"],
  wide: ["مىيلادىدىن بۇرۇن", "مىيلادىدىن كىيىن"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1",
  "2",
  "3",
  "4"],

  wide: [
  "بىرىنجى چارەك",
  "ئىككىنجى چارەك",
  "ئۈچىنجى چارەك",
  "تۆتىنجى چارەك"]

};
var monthValues = {
  narrow: [
  "ي",
  "ف",
  "م",
  "ا",
  "م",
  "ى",
  "ى",
  "ا",
  "س",
  "ۆ",
  "ن",
  "د"],

  abbreviated: [
  "يانۋار",
  "فېۋىرال",
  "مارت",
  "ئاپرىل",
  "ماي",
  "ئىيۇن",
  "ئىيول",
  "ئاۋغۇست",
  "سىنتەبىر",
  "ئۆكتەبىر",
  "نويابىر",
  "دىكابىر"],

  wide: [
  "يانۋار",
  "فېۋىرال",
  "مارت",
  "ئاپرىل",
  "ماي",
  "ئىيۇن",
  "ئىيول",
  "ئاۋغۇست",
  "سىنتەبىر",
  "ئۆكتەبىر",
  "نويابىر",
  "دىكابىر"]

};
var dayValues = {
  narrow: [
  "ي",
  "د",
  "س",
  "چ",
  "پ",
  "ج",
  "ش"],

  short: [
  "ي",
  "د",
  "س",
  "چ",
  "پ",
  "ج",
  "ش"],

  abbreviated: [
  "يەكشەنبە",
  "دۈشەنبە",
  "سەيشەنبە",
  "چارشەنبە",
  "پەيشەنبە",
  "جۈمە",
  "شەنبە"],

  wide: [
  "يەكشەنبە",
  "دۈشەنبە",
  "سەيشەنبە",
  "چارشەنبە",
  "پەيشەنبە",
  "جۈمە",
  "شەنبە"]

};
var dayPeriodValues = {
  narrow: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە"
  },
  abbreviated: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە"
  },
  wide: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە"
  },
  abbreviated: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە"
  },
  wide: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە"
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
//#region dist/date-fns/locale/ug.js
/**
* @category Locales
* @summary Uighur locale
* @language Uighur
* @iso-639-2 uig
* @author Abduwaly M. [@abduwaly](https://github.com/abduwaly)
*/
var ug = {
  code: "ug",
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
        narrow: /^(ب|ك)/i,
        wide: /^(مىيلادىدىن بۇرۇن|مىيلادىدىن كىيىن)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^بۇرۇن/i, /^كىيىن/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^چ[1234]/i,
        wide: /^چارەك [1234]/i
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
        narrow: /^[يفمئامئ‍ئاسۆند]/i,
        abbreviated: /^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i,
        wide: /^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ي/i,
        /^ف/i,
        /^م/i,
        /^ا/i,
        /^م/i,
        /^ى‍/i,
        /^ى‍/i,
        /^ا‍/i,
        /^س/i,
        /^ۆ/i,
        /^ن/i,
        /^د/i],

        any: [
        /^يان/i,
        /^فېۋ/i,
        /^مار/i,
        /^ئاپ/i,
        /^ماي/i,
        /^ئىيۇن/i,
        /^ئىيول/i,
        /^ئاۋ/i,
        /^سىن/i,
        /^ئۆك/i,
        /^نوي/i,
        /^دىك/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[دسچپجشي]/i,
        short: /^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
        abbreviated: /^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
        wide: /^(يەكشەنبە|دۈشەنبە|سەيشەنبە|چارشەنبە|پەيشەنبە|جۈمە|شەنبە)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ي/i,
        /^د/i,
        /^س/i,
        /^چ/i,
        /^پ/i,
        /^ج/i,
        /^ش/i],

        any: [
        /^ي/i,
        /^د/i,
        /^س/i,
        /^چ/i,
        /^پ/i,
        /^ج/i,
        /^ش/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i,
        any: /^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^ئە/i,
          pm: /^چ/i,
          midnight: /^ك/i,
          noon: /^چ/i,
          morning: /ئەتىگەن/i,
          afternoon: /چۈشتىن كىيىن/i,
          evening: /ئاخشىم/i,
          night: /كىچە/i
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
//#region dist/date-fns/_entries/locale/ug/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    ug: ug }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();