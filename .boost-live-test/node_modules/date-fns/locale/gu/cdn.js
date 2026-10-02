(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/gu/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "હમણાં",
    other: "​આશરે {{count}} સેકંડ"
  },
  xSeconds: {
    one: "1 સેકંડ",
    other: "{{count}} સેકંડ"
  },
  halfAMinute: "અડધી મિનિટ",
  lessThanXMinutes: {
    one: "આ મિનિટ",
    other: "​આશરે {{count}} મિનિટ"
  },
  xMinutes: {
    one: "1 મિનિટ",
    other: "{{count}} મિનિટ"
  },
  aboutXHours: {
    one: "​આશરે 1 કલાક",
    other: "​આશરે {{count}} કલાક"
  },
  xHours: {
    one: "1 કલાક",
    other: "{{count}} કલાક"
  },
  xDays: {
    one: "1 દિવસ",
    other: "{{count}} દિવસ"
  },
  aboutXWeeks: {
    one: "આશરે 1 અઠવાડિયું",
    other: "આશરે {{count}} અઠવાડિયા"
  },
  xWeeks: {
    one: "1 અઠવાડિયું",
    other: "{{count}} અઠવાડિયા"
  },
  aboutXMonths: {
    one: "આશરે 1 મહિનો",
    other: "આશરે {{count}} મહિના"
  },
  xMonths: {
    one: "1 મહિનો",
    other: "{{count}} મહિના"
  },
  aboutXYears: {
    one: "આશરે 1 વર્ષ",
    other: "આશરે {{count}} વર્ષ"
  },
  xYears: {
    one: "1 વર્ષ",
    other: "{{count}} વર્ષ"
  },
  overXYears: {
    one: "1 વર્ષથી વધુ",
    other: "{{count}} વર્ષથી વધુ"
  },
  almostXYears: {
    one: "લગભગ 1 વર્ષ",
    other: "લગભગ {{count}} વર્ષ"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + "માં";else
  return result + " પહેલાં";
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
      full: "EEEE, d MMMM, y",
      long: "d MMMM, y",
      medium: "d MMM, y",
      short: "d/M/yy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "hh:mm:ss a zzzz",
      long: "hh:mm:ss a z",
      medium: "hh:mm:ss a",
      short: "hh:mm a"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} {{time}}",
      long: "{{date}} {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/gu/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'પાછલા' eeee p",
  yesterday: "'ગઈકાલે' p",
  today: "'આજે' p",
  tomorrow: "'આવતીકાલે' p",
  nextWeek: "eeee p",
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
//#region dist/date-fns/locale/gu/_lib/localize.js
var eraValues = {
  narrow: ["ઈસપૂ", "ઈસ"],
  abbreviated: ["ઈ.સ.પૂર્વે", "ઈ.સ."],
  wide: ["ઈસવીસન પૂર્વે", "ઈસવીસન"]
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
  "1લો ત્રિમાસ",
  "2જો ત્રિમાસ",
  "3જો ત્રિમાસ",
  "4થો ત્રિમાસ"]

};
var monthValues = {
  narrow: [
  "જા",
  "ફે",
  "મા",
  "એ",
  "મે",
  "જૂ",
  "જુ",
  "ઓ",
  "સ",
  "ઓ",
  "ન",
  "ડિ"],

  abbreviated: [
  "જાન્યુ",
  "ફેબ્રુ",
  "માર્ચ",
  "એપ્રિલ",
  "મે",
  "જૂન",
  "જુલાઈ",
  "ઑગસ્ટ",
  "સપ્ટે",
  "ઓક્ટો",
  "નવે",
  "ડિસે"],

  wide: [
  "જાન્યુઆરી",
  "ફેબ્રુઆરી",
  "માર્ચ",
  "એપ્રિલ",
  "મે",
  "જૂન",
  "જુલાઇ",
  "ઓગસ્ટ",
  "સપ્ટેમ્બર",
  "ઓક્ટોબર",
  "નવેમ્બર",
  "ડિસેમ્બર"]

};
var dayValues = {
  narrow: [
  "ર",
  "સો",
  "મં",
  "બુ",
  "ગુ",
  "શુ",
  "શ"],

  short: [
  "ર",
  "સો",
  "મં",
  "બુ",
  "ગુ",
  "શુ",
  "શ"],

  abbreviated: [
  "રવિ",
  "સોમ",
  "મંગળ",
  "બુધ",
  "ગુરુ",
  "શુક્ર",
  "શનિ"],

  wide: [
  "રવિવાર",
  "સોમવાર",
  "મંગળવાર",
  "બુધવાર",
  "ગુરુવાર",
  "શુક્રવાર",
  "શનિવાર"]

};
var dayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "મ.રાત્રિ",
    noon: "બ.",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "મ.રાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે"
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
//#region dist/date-fns/locale/gu.js
/**
* @category Locales
* @summary Gujarati locale (India).
* @language Gujarati
* @iso-639-2 guj
* @author Manaday Mavani [@ManadayM](https://github.com/manadaym)
*/
var gu = {
  code: "gu",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(લ|જ|થ|ઠ્ઠ|મ)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(ઈસપૂ|ઈસ)/i,
        abbreviated: /^(ઈ\.સ\.પૂર્વે|ઈ\.સ\.)/i,
        wide: /^(ઈસવીસન\sપૂર્વે|ઈસવીસન)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^ઈસપૂ/i, /^ઈસ/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](લો|જો|થો)? ત્રિમાસ/i
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
        narrow: /^[જાફેમાએમેજૂજુઓસઓનડિ]/i,
        abbreviated: /^(જાન્યુ|ફેબ્રુ|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઈ|ઑગસ્ટ|સપ્ટે|ઓક્ટો|નવે|ડિસે)/i,
        wide: /^(જાન્યુઆરી|ફેબ્રુઆરી|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઇ|ઓગસ્ટ|સપ્ટેમ્બર|ઓક્ટોબર|નવેમ્બર|ડિસેમ્બર)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^જા/i,
        /^ફે/i,
        /^મા/i,
        /^એ/i,
        /^મે/i,
        /^જૂ/i,
        /^જુ/i,
        /^ઑગ/i,
        /^સ/i,
        /^ઓક્ટો/i,
        /^ન/i,
        /^ડિ/i],

        any: [
        /^જા/i,
        /^ફે/i,
        /^મા/i,
        /^એ/i,
        /^મે/i,
        /^જૂ/i,
        /^જુ/i,
        /^ઑગ/i,
        /^સ/i,
        /^ઓક્ટો/i,
        /^ન/i,
        /^ડિ/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
        short: /^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
        abbreviated: /^(રવિ|સોમ|મંગળ|બુધ|ગુરુ|શુક્ર|શનિ)/i,
        wide: /^(રવિવાર|સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ર/i,
        /^સો/i,
        /^મં/i,
        /^બુ/i,
        /^ગુ/i,
        /^શુ/i,
        /^શ/i],

        any: [
        /^ર/i,
        /^સો/i,
        /^મં/i,
        /^બુ/i,
        /^ગુ/i,
        /^શુ/i,
        /^શ/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|મ\.?|સ|બ|સાં|રા)/i,
        any: /^(a|p|મ\.?|સ|બ|સાં|રા)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^મ\.?/i,
          noon: /^બ/i,
          morning: /સ/i,
          afternoon: /બ/i,
          evening: /સાં/i,
          night: /રા/i
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
//#region dist/date-fns/_entries/locale/gu/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    gu: gu }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();