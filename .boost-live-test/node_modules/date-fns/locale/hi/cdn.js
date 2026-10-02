(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/_lib/buildLocalizeFn.js
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
//#region dist/date-fns/locale/hi/_lib/localize.js
var numberValues = {
  locale: {
    1: "१",
    2: "२",
    3: "३",
    4: "४",
    5: "५",
    6: "६",
    7: "७",
    8: "८",
    9: "९",
    0: "०"
  },
  number: {
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
    "०": "0"
  }
};
var eraValues = {
  narrow: ["ईसा-पूर्व", "ईस्वी"],
  abbreviated: ["ईसा-पूर्व", "ईस्वी"],
  wide: ["ईसा-पूर्व", "ईसवी सन"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "ति1",
  "ति2",
  "ति3",
  "ति4"],

  wide: [
  "पहली तिमाही",
  "दूसरी तिमाही",
  "तीसरी तिमाही",
  "चौथी तिमाही"]

};
var monthValues = {
  narrow: [
  "ज",
  "फ़",
  "मा",
  "अ",
  "मई",
  "जू",
  "जु",
  "अग",
  "सि",
  "अक्टू",
  "न",
  "दि"],

  abbreviated: [
  "जन",
  "फ़र",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुल",
  "अग",
  "सित",
  "अक्टू",
  "नव",
  "दिस"],

  wide: [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर"]

};
var dayValues = {
  narrow: [
  "र",
  "सो",
  "मं",
  "बु",
  "गु",
  "शु",
  "श"],

  short: [
  "र",
  "सो",
  "मं",
  "बु",
  "गु",
  "शु",
  "श"],

  abbreviated: [
  "रवि",
  "सोम",
  "मंगल",
  "बुध",
  "गुरु",
  "शुक्र",
  "शनि"],

  wide: [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार"]

};
var dayPeriodValues = {
  narrow: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  abbreviated: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  wide: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  abbreviated: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  wide: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return numberToLocale(Number(dirtyNumber));
};
function localeToNumber(locale) {
  var enNumber = locale.toString().replace(/[१२३४५६७८९०]/g, function (match) {
    return numberValues.number[match];
  });
  return Number(enNumber);
}
function numberToLocale(enNumber) {
  return enNumber.toString().replace(/\d/g, function (match) {
    return numberValues.locale[match];
  });
}
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
//#region dist/date-fns/locale/hi/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "१ सेकंड से कम",
    other: "{{count}} सेकंड से कम"
  },
  xSeconds: {
    one: "१ सेकंड",
    other: "{{count}} सेकंड"
  },
  halfAMinute: "आधा मिनट",
  lessThanXMinutes: {
    one: "१ मिनट से कम",
    other: "{{count}} मिनट से कम"
  },
  xMinutes: {
    one: "१ मिनट",
    other: "{{count}} मिनट"
  },
  aboutXHours: {
    one: "लगभग १ घंटा",
    other: "लगभग {{count}} घंटे"
  },
  xHours: {
    one: "१ घंटा",
    other: "{{count}} घंटे"
  },
  xDays: {
    one: "१ दिन",
    other: "{{count}} दिन"
  },
  aboutXWeeks: {
    one: "लगभग १ सप्ताह",
    other: "लगभग {{count}} सप्ताह"
  },
  xWeeks: {
    one: "१ सप्ताह",
    other: "{{count}} सप्ताह"
  },
  aboutXMonths: {
    one: "लगभग १ महीना",
    other: "लगभग {{count}} महीने"
  },
  xMonths: {
    one: "१ महीना",
    other: "{{count}} महीने"
  },
  aboutXYears: {
    one: "लगभग १ वर्ष",
    other: "लगभग {{count}} वर्ष"
  },
  xYears: {
    one: "१ वर्ष",
    other: "{{count}} वर्ष"
  },
  overXYears: {
    one: "१ वर्ष से अधिक",
    other: "{{count}} वर्ष से अधिक"
  },
  almostXYears: {
    one: "लगभग १ वर्ष",
    other: "लगभग {{count}} वर्ष"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", numberToLocale(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + "मे ";else
  return result + " पहले";
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
      full: "h:mm:ss a zzzz",
      long: "h:mm:ss a z",
      medium: "h:mm:ss a",
      short: "h:mm a"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'को' {{time}}",
      long: "{{date}} 'को' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/hi/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'पिछले' eeee p",
  yesterday: "'कल' p",
  today: "'आज' p",
  tomorrow: "'कल' p",
  nextWeek: "eeee 'को' p",
  other: "P"
};
var formatRelative = function formatRelative(token, _date, _baseDate, _options) {return formatRelativeLocale[token];};
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
//#region dist/date-fns/locale/hi.js
/**
* @category Locales
* @summary Hindi locale (India).
* @language Hindi
* @iso-639-2 hin
* @author Mukesh Mandiwal [@mukeshmandiwal](https://github.com/mukeshmandiwal)
*/
var hi = {
  code: "hi",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^[०१२३४५६७८९]+/i,
      parsePattern: /^[०१२३४५६७८९]+/i,
      valueCallback: localeToNumber
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(ईसा-पूर्व|ईस्वी)/i,
        abbreviated: /^(ईसा\.?\s?पूर्व\.?|ईसा\.?)/i,
        wide: /^(ईसा-पूर्व|ईसवी पूर्व|ईसवी सन|ईसवी)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^ति[1234]/i,
        wide: /^[1234](पहली|दूसरी|तीसरी|चौथी)? तिमाही/i
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
        narrow: /^[जफ़माअप्मईजूनजुअगसिअक्तनदि]/i,
        abbreviated: /^(जन|फ़र|मार्च|अप्|मई|जून|जुल|अग|सित|अक्तू|नव|दिस)/i,
        wide: /^(जनवरी|फ़रवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्तूबर|नवंबर|दिसंबर)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ज/i,
        /^फ़/i,
        /^मा/i,
        /^अप्/i,
        /^मई/i,
        /^जू/i,
        /^जु/i,
        /^अग/i,
        /^सि/i,
        /^अक्तू/i,
        /^न/i,
        /^दि/i],

        any: [
        /^जन/i,
        /^फ़/i,
        /^मा/i,
        /^अप्/i,
        /^मई/i,
        /^जू/i,
        /^जु/i,
        /^अग/i,
        /^सि/i,
        /^अक्तू/i,
        /^नव/i,
        /^दिस/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[रविसोममंगलबुधगुरुशुक्रशनि]/i,
        short: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
        abbreviated: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
        wide: /^(रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^रवि/i,
        /^सोम/i,
        /^मंगल/i,
        /^बुध/i,
        /^गुरु/i,
        /^शुक्र/i,
        /^शनि/i],

        any: [
        /^रवि/i,
        /^सोम/i,
        /^मंगल/i,
        /^बुध/i,
        /^गुरु/i,
        /^शुक्र/i,
        /^शनि/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(पू|अ|म|द.\?|सु|दो|शा|रा)/i,
        any: /^(पूर्वाह्न|अपराह्न|म|द.\?|सु|दो|शा|रा)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^पूर्वाह्न/i,
          pm: /^अपराह्न/i,
          midnight: /^मध्य/i,
          noon: /^दो/i,
          morning: /सु/i,
          afternoon: /दो/i,
          evening: /शा/i,
          night: /रा/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 4
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/hi/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    hi: hi }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();