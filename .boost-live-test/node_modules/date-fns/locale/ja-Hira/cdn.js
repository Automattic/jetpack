(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ja-Hira/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "1びょうみまん",
    other: "{{count}}びょうみまん",
    oneWithSuffix: "やく1びょう",
    otherWithSuffix: "やく{{count}}びょう"
  },
  xSeconds: {
    one: "1びょう",
    other: "{{count}}びょう"
  },
  halfAMinute: "30びょう",
  lessThanXMinutes: {
    one: "1ぷんみまん",
    other: "{{count}}ふんみまん",
    oneWithSuffix: "やく1ぷん",
    otherWithSuffix: "やく{{count}}ふん"
  },
  xMinutes: {
    one: "1ぷん",
    other: "{{count}}ふん"
  },
  aboutXHours: {
    one: "やく1じかん",
    other: "やく{{count}}じかん"
  },
  xHours: {
    one: "1じかん",
    other: "{{count}}じかん"
  },
  xDays: {
    one: "1にち",
    other: "{{count}}にち"
  },
  aboutXWeeks: {
    one: "やく1しゅうかん",
    other: "やく{{count}}しゅうかん"
  },
  xWeeks: {
    one: "1しゅうかん",
    other: "{{count}}しゅうかん"
  },
  aboutXMonths: {
    one: "やく1かげつ",
    other: "やく{{count}}かげつ"
  },
  xMonths: {
    one: "1かげつ",
    other: "{{count}}かげつ"
  },
  aboutXYears: {
    one: "やく1ねん",
    other: "やく{{count}}ねん"
  },
  xYears: {
    one: "1ねん",
    other: "{{count}}ねん"
  },
  overXYears: {
    one: "1ねんいじょう",
    other: "{{count}}ねんいじょう"
  },
  almostXYears: {
    one: "1ねんちかく",
    other: "{{count}}ねんちかく"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  options = options || {};
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) {if (options.addSuffix && tokenValue.oneWithSuffix) result = tokenValue.oneWithSuffix;else
    result = tokenValue.one;} else
  if (options.addSuffix && tokenValue.otherWithSuffix) result = tokenValue.otherWithSuffix.replace("{{count}}", String(count));else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options.addSuffix) if (options.comparison && options.comparison > 0) return result + "あと";else
  return result + "まえ";
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
      full: "yねんMがつdにちEEEE",
      long: "yねんMがつdにち",
      medium: "y/MM/dd",
      short: "y/MM/dd"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "Hじmmふんssびょう zzzz",
      long: "H:mm:ss z",
      medium: "H:mm:ss",
      short: "H:mm"
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
//#region dist/date-fns/locale/ja-Hira/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "せんしゅうのeeeeのp",
  yesterday: "きのうのp",
  today: "きょうのp",
  tomorrow: "あしたのp",
  nextWeek: "よくしゅうのeeeeのp",
  other: "P"
};
var formatRelative = function formatRelative(token, _date, _baseDate, _options) {
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
//#region dist/date-fns/locale/ja-Hira/_lib/localize.js
var eraValues = {
  narrow: ["BC", "AC"],
  abbreviated: ["きげんぜん", "せいれき"],
  wide: ["きげんぜん", "せいれき"]
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
  "だい1しはんき",
  "だい2しはんき",
  "だい3しはんき",
  "だい4しはんき"]

};
var monthValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12"],

  abbreviated: [
  "1がつ",
  "2がつ",
  "3がつ",
  "4がつ",
  "5がつ",
  "6がつ",
  "7がつ",
  "8がつ",
  "9がつ",
  "10がつ",
  "11がつ",
  "12がつ"],

  wide: [
  "1がつ",
  "2がつ",
  "3がつ",
  "4がつ",
  "5がつ",
  "6がつ",
  "7がつ",
  "8がつ",
  "9がつ",
  "10がつ",
  "11がつ",
  "12がつ"]

};
var dayValues = {
  narrow: [
  "にち",
  "げつ",
  "か",
  "すい",
  "もく",
  "きん",
  "ど"],

  short: [
  "にち",
  "げつ",
  "か",
  "すい",
  "もく",
  "きん",
  "ど"],

  abbreviated: [
  "にち",
  "げつ",
  "か",
  "すい",
  "もく",
  "きん",
  "ど"],

  wide: [
  "にちようび",
  "げつようび",
  "かようび",
  "すいようび",
  "もくようび",
  "きんようび",
  "どようび"]

};
var dayPeriodValues = {
  narrow: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  },
  abbreviated: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  },
  wide: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  },
  abbreviated: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  },
  wide: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  switch (String(options === null || options === void 0 ? void 0 : options.unit)) {
    case "year":return "".concat(number, "\u306D\u3093");
    case "quarter":return "\u3060\u3044".concat(number, "\u3057\u306F\u3093\u304D");
    case "month":return "".concat(number, "\u304C\u3064");
    case "week":return "\u3060\u3044".concat(number, "\u3057\u3085\u3046");
    case "date":return "".concat(number, "\u306B\u3061");
    case "hour":return "".concat(number, "\u3058");
    case "minute":return "".concat(number, "\u3075\u3093");
    case "second":return "".concat(number, "\u3073\u3087\u3046");
    default:return "".concat(number);
  }
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
    argumentCallback: function argumentCallback(quarter) {return Number(quarter) - 1;}
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
//#region dist/date-fns/locale/ja-Hira.js
/**
* @category Locales
* @summary Japanese (Hiragana) locale.
* @language Japanese (Hiragana)
* @iso-639-2 jpn
* @author Eri Hiramatsu [@Eritutteo](https://github.com/Eritutteo)
*/
var jaHira = {
  code: "ja-Hira",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^だ?い?\d+(ねん|しはんき|がつ|しゅう|にち|じ|ふん|びょう)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {
        return parseInt(value, 10);
      }
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(B\.?C\.?|A\.?D\.?)/i,
        abbreviated: /^(きげん[前後]|せいれき)/i,
        wide: /^(きげん[前後]|せいれき)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [/^B/i, /^A/i],
        any: [/^(きげんぜん)/i, /^(せいれき|きげんご)/i]
      },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^Q[1234]/i,
        wide: /^だい[1234一二三四１２３４]しはんき/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /(1|一|１)/i,
        /(2|二|２)/i,
        /(3|三|３)/i,
        /(4|四|４)/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^([123456789]|1[012])/,
        abbreviated: /^([123456789]|1[012])がつ/i,
        wide: /^([123456789]|1[012])がつ/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^1\D/,
        /^2/,
        /^3/,
        /^4/,
        /^5/,
        /^6/,
        /^7/,
        /^8/,
        /^9/,
        /^10/,
        /^11/,
        /^12/]
      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(にち|げつ|か|すい|もく|きん|ど)/,
        short: /^(にち|げつ|か|すい|もく|きん|ど)/,
        abbreviated: /^(にち|げつ|か|すい|もく|きん|ど)/,
        wide: /^(にち|げつ|か|すい|もく|きん|ど)ようび/
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^にち/,
        /^げつ/,
        /^か/,
        /^すい/,
        /^もく/,
        /^きん/,
        /^ど/]
      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^(AM|PM|ごぜん|ごご|しょうご|しんや|まよなか|よる|あさ)/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^(A|ごぜん)/i,
          pm: /^(P|ごご)/i,
          midnight: /^しんや|まよなか/i,
          noon: /^しょうご/i,
          morning: /^あさ/i,
          afternoon: /^ごご/i,
          evening: /^よる/i,
          night: /^しんや/i
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
//#region dist/date-fns/_entries/locale/ja-Hira/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    jaHira: jaHira }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();