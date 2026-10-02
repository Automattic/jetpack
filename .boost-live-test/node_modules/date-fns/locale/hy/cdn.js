(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/hy/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "ավելի քիչ քան 1 վայրկյան",
    other: "ավելի քիչ քան {{count}} վայրկյան"
  },
  xSeconds: {
    one: "1 վայրկյան",
    other: "{{count}} վայրկյան"
  },
  halfAMinute: "կես րոպե",
  lessThanXMinutes: {
    one: "ավելի քիչ քան 1 րոպե",
    other: "ավելի քիչ քան {{count}} րոպե"
  },
  xMinutes: {
    one: "1 րոպե",
    other: "{{count}} րոպե"
  },
  aboutXHours: {
    one: "մոտ 1 ժամ",
    other: "մոտ {{count}} ժամ"
  },
  xHours: {
    one: "1 ժամ",
    other: "{{count}} ժամ"
  },
  xDays: {
    one: "1 օր",
    other: "{{count}} օր"
  },
  aboutXWeeks: {
    one: "մոտ 1 շաբաթ",
    other: "մոտ {{count}} շաբաթ"
  },
  xWeeks: {
    one: "1 շաբաթ",
    other: "{{count}} շաբաթ"
  },
  aboutXMonths: {
    one: "մոտ 1 ամիս",
    other: "մոտ {{count}} ամիս"
  },
  xMonths: {
    one: "1 ամիս",
    other: "{{count}} ամիս"
  },
  aboutXYears: {
    one: "մոտ 1 տարի",
    other: "մոտ {{count}} տարի"
  },
  xYears: {
    one: "1 տարի",
    other: "{{count}} տարի"
  },
  overXYears: {
    one: "ավելի քան 1 տարի",
    other: "ավելի քան {{count}} տարի"
  },
  almostXYears: {
    one: "համարյա 1 տարի",
    other: "համարյա {{count}} տարի"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + " հետո";else
  return result + " առաջ";
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
      full: "d MMMM, y, EEEE",
      long: "d MMMM, y",
      medium: "d MMM, y",
      short: "dd.MM.yyyy"
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
      full: "{{date}} 'ժ․'{{time}}",
      long: "{{date}} 'ժ․'{{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/hy/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'նախորդ' eeee p'֊ին'",
  yesterday: "'երեկ' p'֊ին'",
  today: "'այսօր' p'֊ին'",
  tomorrow: "'վաղը' p'֊ին'",
  nextWeek: "'հաջորդ' eeee p'֊ին'",
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
//#region dist/date-fns/locale/hy/_lib/localize.js
var eraValues = {
  narrow: ["Ք", "Մ"],
  abbreviated: ["ՔԱ", "ՄԹ"],
  wide: ["Քրիստոսից առաջ", "Մեր թվարկության"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Ք1",
  "Ք2",
  "Ք3",
  "Ք4"],

  wide: [
  "1֊ին քառորդ",
  "2֊րդ քառորդ",
  "3֊րդ քառորդ",
  "4֊րդ քառորդ"]

};
var monthValues = {
  narrow: [
  "Հ",
  "Փ",
  "Մ",
  "Ա",
  "Մ",
  "Հ",
  "Հ",
  "Օ",
  "Ս",
  "Հ",
  "Ն",
  "Դ"],

  abbreviated: [
  "հուն",
  "փետ",
  "մար",
  "ապր",
  "մայ",
  "հուն",
  "հուլ",
  "օգս",
  "սեպ",
  "հոկ",
  "նոյ",
  "դեկ"],

  wide: [
  "հունվար",
  "փետրվար",
  "մարտ",
  "ապրիլ",
  "մայիս",
  "հունիս",
  "հուլիս",
  "օգոստոս",
  "սեպտեմբեր",
  "հոկտեմբեր",
  "նոյեմբեր",
  "դեկտեմբեր"]

};
var dayValues = {
  narrow: [
  "Կ",
  "Ե",
  "Ե",
  "Չ",
  "Հ",
  "Ո",
  "Շ"],

  short: [
  "կր",
  "եր",
  "եք",
  "չք",
  "հգ",
  "ուր",
  "շբ"],

  abbreviated: [
  "կիր",
  "երկ",
  "երք",
  "չոր",
  "հնգ",
  "ուրբ",
  "շաբ"],

  wide: [
  "կիրակի",
  "երկուշաբթի",
  "երեքշաբթի",
  "չորեքշաբթի",
  "հինգշաբթի",
  "ուրբաթ",
  "շաբաթ"]

};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "կեսգշ",
    noon: "կեսօր",
    morning: "առավոտ",
    afternoon: "ցերեկ",
    evening: "երեկո",
    night: "գիշեր"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "կեսգիշեր",
    noon: "կեսօր",
    morning: "առավոտ",
    afternoon: "ցերեկ",
    evening: "երեկո",
    night: "գիշեր"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "կեսգիշեր",
    noon: "կեսօր",
    morning: "առավոտ",
    afternoon: "ցերեկ",
    evening: "երեկո",
    night: "գիշեր"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "կեսգշ",
    noon: "կեսօր",
    morning: "առավոտը",
    afternoon: "ցերեկը",
    evening: "երեկոյան",
    night: "գիշերը"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "կեսգիշերին",
    noon: "կեսօրին",
    morning: "առավոտը",
    afternoon: "ցերեկը",
    evening: "երեկոյան",
    night: "գիշերը"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "կեսգիշերին",
    noon: "կեսօրին",
    morning: "առավոտը",
    afternoon: "ցերեկը",
    evening: "երեկոյան",
    night: "գիշերը"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;
  if (rem100 < 10) {
    if (rem100 % 10 === 1) return number + "֊ին";
  }
  return number + "֊րդ";
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
//#region dist/date-fns/locale/hy.js
/**
* @category Locales
* @summary Armenian locale
* @language Armenian
* @iso-639-2 arm
* @author Alex Igityan [@alexigityan](https://github.com/alexigityan)
*/
var hy = {
  code: "hy",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)((-|֊)?(ին|րդ))?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(Ք|Մ)/i,
        abbreviated: /^(Ք\.?\s?Ա\.?|Մ\.?\s?Թ\.?\s?Ա\.?|Մ\.?\s?Թ\.?|Ք\.?\s?Հ\.?)/i,
        wide: /^(քրիստոսից առաջ|մեր թվարկությունից առաջ|մեր թվարկության|քրիստոսից հետո)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^ք/i, /^մ/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^ք[1234]/i,
        wide: /^[1234]((-|֊)?(ին|րդ)) քառորդ/i
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
        narrow: /^[հփմաօսնդ]/i,
        abbreviated: /^(հուն|փետ|մար|ապր|մայ|հուն|հուլ|օգս|սեպ|հոկ|նոյ|դեկ)/i,
        wide: /^(հունվար|փետրվար|մարտ|ապրիլ|մայիս|հունիս|հուլիս|օգոստոս|սեպտեմբեր|հոկտեմբեր|նոյեմբեր|դեկտեմբեր)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^հ/i,
        /^փ/i,
        /^մ/i,
        /^ա/i,
        /^մ/i,
        /^հ/i,
        /^հ/i,
        /^օ/i,
        /^ս/i,
        /^հ/i,
        /^ն/i,
        /^դ/i],

        any: [
        /^հու/i,
        /^փ/i,
        /^մար/i,
        /^ա/i,
        /^մայ/i,
        /^հուն/i,
        /^հուլ/i,
        /^օ/i,
        /^ս/i,
        /^հոկ/i,
        /^ն/i,
        /^դ/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[եչհոշկ]/i,
        short: /^(կր|եր|եք|չք|հգ|ուր|շբ)/i,
        abbreviated: /^(կիր|երկ|երք|չոր|հնգ|ուրբ|շաբ)/i,
        wide: /^(կիրակի|երկուշաբթի|երեքշաբթի|չորեքշաբթի|հինգշաբթի|ուրբաթ|շաբաթ)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^կ/i,
        /^ե/i,
        /^ե/i,
        /^չ/i,
        /^հ/i,
        /^(ո|Ո)/,
        /^շ/i],

        short: [
        /^կ/i,
        /^եր/i,
        /^եք/i,
        /^չ/i,
        /^հ/i,
        /^(ո|Ո)/,
        /^շ/i],

        abbreviated: [
        /^կ/i,
        /^երկ/i,
        /^երք/i,
        /^չ/i,
        /^հ/i,
        /^(ո|Ո)/,
        /^շ/i],

        wide: [
        /^կ/i,
        /^երկ/i,
        /^երե/i,
        /^չ/i,
        /^հ/i,
        /^(ո|Ո)/,
        /^շ/i]

      },
      defaultParseWidth: "wide"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^([ap]|կեսգշ|կեսօր|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i,
        any: /^([ap]\.?\s?m\.?|կեսգիշեր(ին)?|կեսօր(ին)?|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /կեսգիշեր/i,
          noon: /կեսօր/i,
          morning: /առավոտ/i,
          afternoon: /ցերեկ/i,
          evening: /երեկո/i,
          night: /գիշեր/i
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
//#region dist/date-fns/_entries/locale/hy/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    hy: hy }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();