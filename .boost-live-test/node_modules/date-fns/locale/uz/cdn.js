(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/uz/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "sekunddan kam",
    other: "{{count}} sekunddan kam"
  },
  xSeconds: {
    one: "1 sekund",
    other: "{{count}} sekund"
  },
  halfAMinute: "yarim minut",
  lessThanXMinutes: {
    one: "bir minutdan kam",
    other: "{{count}} minutdan kam"
  },
  xMinutes: {
    one: "1 minut",
    other: "{{count}} minut"
  },
  aboutXHours: {
    one: "tahminan 1 soat",
    other: "tahminan {{count}} soat"
  },
  xHours: {
    one: "1 soat",
    other: "{{count}} soat"
  },
  xDays: {
    one: "1 kun",
    other: "{{count}} kun"
  },
  aboutXWeeks: {
    one: "tahminan 1 hafta",
    other: "tahminan {{count}} hafta"
  },
  xWeeks: {
    one: "1 hafta",
    other: "{{count}} hafta"
  },
  aboutXMonths: {
    one: "tahminan 1 oy",
    other: "tahminan {{count}} oy"
  },
  xMonths: {
    one: "1 oy",
    other: "{{count}} oy"
  },
  aboutXYears: {
    one: "tahminan 1 yil",
    other: "tahminan {{count}} yil"
  },
  xYears: {
    one: "1 yil",
    other: "{{count}} yil"
  },
  overXYears: {
    one: "1 yildan ko'p",
    other: "{{count}} yildan ko'p"
  },
  almostXYears: {
    one: "deyarli 1 yil",
    other: "deyarli {{count}} yil"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + " dan keyin";else
  return result + " oldin";
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
      full: "h:mm:ss zzzz",
      long: "h:mm:ss z",
      medium: "h:mm:ss",
      short: "h:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: { any: "{{date}}, {{time}}" },
    defaultWidth: "any"
  })
};
//#endregion
//#region dist/date-fns/locale/uz/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'oldingi' eeee p 'da'",
  yesterday: "'kecha' p 'da'",
  today: "'bugun' p 'da'",
  tomorrow: "'ertaga' p 'da'",
  nextWeek: "eeee p 'da'",
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
//#region dist/date-fns/locale/uz/_lib/localize.js
var eraValues = {
  narrow: ["M.A", "M."],
  abbreviated: ["M.A", "M."],
  wide: ["Miloddan Avvalgi", "Milodiy"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "CH.1",
  "CH.2",
  "CH.3",
  "CH.4"],

  wide: [
  "1-chi chorak",
  "2-chi chorak",
  "3-chi chorak",
  "4-chi chorak"]

};
var monthValues = {
  narrow: [
  "Y",
  "F",
  "M",
  "A",
  "M",
  "I",
  "I",
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
  "Iyun",
  "Iyul",
  "Avg",
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
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr"]

};
var dayValues = {
  narrow: [
  "Y",
  "D",
  "S",
  "CH",
  "P",
  "J",
  "SH"],

  short: [
  "Ya",
  "Du",
  "Se",
  "Cho",
  "Pa",
  "Ju",
  "Sha"],

  abbreviated: [
  "Yak",
  "Dush",
  "Sesh",
  "Chor",
  "Pay",
  "Jum",
  "Shan"],

  wide: [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba"]

};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "y.t",
    noon: "p.",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "yarim tun",
    noon: "peshin",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "yarim tun",
    noon: "peshin",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "y.t",
    noon: "p.",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "yarim tun",
    noon: "peshin",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "yarim tun",
    noon: "peshin",
    morning: "ertalab",
    afternoon: "tushdan keyin",
    evening: "kechqurun",
    night: "tun"
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
//#region dist/date-fns/locale/uz.js
/**
* @category Locales
* @summary Uzbek locale.
* @language Uzbek
* @iso-639-2 uzb
* @author Mukhammadali [@mukhammadali](https://github.com/Mukhammadali)
*/
var uz = {
  code: "uz",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(chi)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(m\.a|m\.)/i,
        abbreviated: /^(m\.a\.?\s?m\.?)/i,
        wide: /^(miloddan avval|miloddan keyin)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](chi)? chorak/i
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
        narrow: /^[yfmasond]/i,
        abbreviated: /^(yan|fev|mar|apr|may|iyun|iyul|avg|sen|okt|noy|dek)/i,
        wide: /^(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^y/i,
        /^f/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^i/i,
        /^i/i,
        /^a/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i],

        any: [
        /^ya/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^may/i,
        /^iyun/i,
        /^iyul/i,
        /^av/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[ydschj]/i,
        short: /^(ya|du|se|cho|pa|ju|sha)/i,
        abbreviated: /^(yak|dush|sesh|chor|pay|jum|shan)/i,
        wide: /^(yakshanba|dushanba|seshanba|chorshanba|payshanba|juma|shanba)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^y/i,
        /^d/i,
        /^s/i,
        /^ch/i,
        /^p/i,
        /^j/i,
        /^sh/i],

        any: [
        /^ya/i,
        /^d/i,
        /^se/i,
        /^ch/i,
        /^p/i,
        /^j/i,
        /^sh/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|y\.t|p| (ertalab|tushdan keyin|kechqurun|tun))/i,
        any: /^([ap]\.?\s?m\.?|yarim tun|peshin| (ertalab|tushdan keyin|kechqurun|tun))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^y\.t/i,
          noon: /^pe/i,
          morning: /ertalab/i,
          afternoon: /tushdan keyin/i,
          evening: /kechqurun/i,
          night: /tun/i
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
//#region dist/date-fns/_entries/locale/uz/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    uz: uz }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();