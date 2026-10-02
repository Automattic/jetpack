(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/af/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "minder as 'n sekonde",
    other: "minder as {{count}} sekondes"
  },
  xSeconds: {
    one: "1 sekonde",
    other: "{{count}} sekondes"
  },
  halfAMinute: "'n halwe minuut",
  lessThanXMinutes: {
    one: "minder as 'n minuut",
    other: "minder as {{count}} minute"
  },
  xMinutes: {
    one: "'n minuut",
    other: "{{count}} minute"
  },
  aboutXHours: {
    one: "ongeveer 1 uur",
    other: "ongeveer {{count}} ure"
  },
  xHours: {
    one: "1 uur",
    other: "{{count}} ure"
  },
  xDays: {
    one: "1 dag",
    other: "{{count}} dae"
  },
  aboutXWeeks: {
    one: "ongeveer 1 week",
    other: "ongeveer {{count}} weke"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weke"
  },
  aboutXMonths: {
    one: "ongeveer 1 maand",
    other: "ongeveer {{count}} maande"
  },
  xMonths: {
    one: "1 maand",
    other: "{{count}} maande"
  },
  aboutXYears: {
    one: "ongeveer 1 jaar",
    other: "ongeveer {{count}} jaar"
  },
  xYears: {
    one: "1 jaar",
    other: "{{count}} jaar"
  },
  overXYears: {
    one: "meer as 1 jaar",
    other: "meer as {{count}} jaar"
  },
  almostXYears: {
    one: "byna 1 jaar",
    other: "byna {{count}} jaar"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "oor " + result;else
  return result + " gelede";
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
      full: "EEEE, d MMMM yyyy",
      long: "d MMMM yyyy",
      medium: "d MMM yyyy",
      short: "yyyy/MM/dd"
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
      full: "{{date}} 'om' {{time}}",
      long: "{{date}} 'om' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/af/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'verlede' eeee 'om' p",
  yesterday: "'gister om' p",
  today: "'vandag om' p",
  tomorrow: "'môre om' p",
  nextWeek: "eeee 'om' p",
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
//#region dist/date-fns/locale/af/_lib/localize.js
var eraValues = {
  narrow: ["vC", "nC"],
  abbreviated: ["vC", "nC"],
  wide: ["voor Christus", "na Christus"]
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
  "1ste kwartaal",
  "2de kwartaal",
  "3de kwartaal",
  "4de kwartaal"]

};
var monthValues = {
  narrow: [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D"],

  abbreviated: [
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Des"],

  wide: [
  "Januarie",
  "Februarie",
  "Maart",
  "April",
  "Mei",
  "Junie",
  "Julie",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "Desember"]

};
var dayValues = {
  narrow: [
  "S",
  "M",
  "D",
  "W",
  "D",
  "V",
  "S"],

  short: [
  "So",
  "Ma",
  "Di",
  "Wo",
  "Do",
  "Vr",
  "Sa"],

  abbreviated: [
  "Son",
  "Maa",
  "Din",
  "Woe",
  "Don",
  "Vry",
  "Sat"],

  wide: [
  "Sondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrydag",
  "Saterdag"]

};
var dayPeriodValues = {
  narrow: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "middaguur",
    morning: "oggend",
    afternoon: "middag",
    evening: "laat middag",
    night: "aand"
  },
  abbreviated: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "middaguur",
    morning: "oggend",
    afternoon: "middag",
    evening: "laat middag",
    night: "aand"
  },
  wide: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "middaguur",
    morning: "oggend",
    afternoon: "middag",
    evening: "laat middag",
    night: "aand"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "uur die middag",
    morning: "uur die oggend",
    afternoon: "uur die middag",
    evening: "uur die aand",
    night: "uur die aand"
  },
  abbreviated: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "uur die middag",
    morning: "uur die oggend",
    afternoon: "uur die middag",
    evening: "uur die aand",
    night: "uur die aand"
  },
  wide: {
    am: "vm",
    pm: "nm",
    midnight: "middernag",
    noon: "uur die middag",
    morning: "uur die oggend",
    afternoon: "uur die middag",
    evening: "uur die aand",
    night: "uur die aand"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;
  if (rem100 < 20) switch (rem100) {
    case 1:
    case 8:return number + "ste";
    default:return number + "de";
  }
  return number + "ste";
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
//#region dist/date-fns/locale/af.js
/**
* @category Locales
* @summary Afrikaans locale.
* @language Afrikaans
* @iso-639-2 afr
* @author Marnus Weststrate [@marnusw](https://github.com/marnusw)
*/
var af = {
  code: "af",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(ste|de)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^([vn]\.? ?C\.?)/,
        abbreviated: /^([vn]\. ?C\.?)/,
        wide: /^((voor|na) Christus)/
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^v/, /^n/] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^K[1234]/i,
        wide: /^[1234](st|d)e kwartaal/i
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
        narrow: /^[jfmasond]/i,
        abbreviated: /^(Jan|Feb|Mrt|Apr|Mei|Jun|Jul|Aug|Sep|Okt|Nov|Dec)\.?/i,
        wide: /^(Januarie|Februarie|Maart|April|Mei|Junie|Julie|Augustus|September|Oktober|November|Desember)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^J/i,
        /^F/i,
        /^M/i,
        /^A/i,
        /^M/i,
        /^J/i,
        /^J/i,
        /^A/i,
        /^S/i,
        /^O/i,
        /^N/i,
        /^D/i],

        any: [
        /^Jan/i,
        /^Feb/i,
        /^Mrt/i,
        /^Apr/i,
        /^Mei/i,
        /^Jun/i,
        /^Jul/i,
        /^Aug/i,
        /^Sep/i,
        /^Okt/i,
        /^Nov/i,
        /^Dec/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[smdwv]/i,
        short: /^(So|Ma|Di|Wo|Do|Vr|Sa)/i,
        abbreviated: /^(Son|Maa|Din|Woe|Don|Vry|Sat)/i,
        wide: /^(Sondag|Maandag|Dinsdag|Woensdag|Donderdag|Vrydag|Saterdag)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^S/i,
        /^M/i,
        /^D/i,
        /^W/i,
        /^D/i,
        /^V/i,
        /^S/i],

        any: [
        /^So/i,
        /^Ma/i,
        /^Di/i,
        /^Wo/i,
        /^Do/i,
        /^Vr/i,
        /^Sa/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^(vm|nm|middernag|(?:uur )?die (oggend|middag|aand))/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^vm/i,
          pm: /^nm/i,
          midnight: /^middernag/i,
          noon: /^middaguur/i,
          morning: /oggend/i,
          afternoon: /middag/i,
          evening: /laat middag/i,
          night: /aand/i
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
//#region dist/date-fns/_entries/locale/af/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    af: af }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();