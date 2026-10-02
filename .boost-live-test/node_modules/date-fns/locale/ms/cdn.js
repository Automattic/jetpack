(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ms/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "kurang dari 1 saat",
    other: "kurang dari {{count}} saat"
  },
  xSeconds: {
    one: "1 saat",
    other: "{{count}} saat"
  },
  halfAMinute: "setengah minit",
  lessThanXMinutes: {
    one: "kurang dari 1 minit",
    other: "kurang dari {{count}} minit"
  },
  xMinutes: {
    one: "1 minit",
    other: "{{count}} minit"
  },
  aboutXHours: {
    one: "sekitar 1 jam",
    other: "sekitar {{count}} jam"
  },
  xHours: {
    one: "1 jam",
    other: "{{count}} jam"
  },
  xDays: {
    one: "1 hari",
    other: "{{count}} hari"
  },
  aboutXWeeks: {
    one: "sekitar 1 minggu",
    other: "sekitar {{count}} minggu"
  },
  xWeeks: {
    one: "1 minggu",
    other: "{{count}} minggu"
  },
  aboutXMonths: {
    one: "sekitar 1 bulan",
    other: "sekitar {{count}} bulan"
  },
  xMonths: {
    one: "1 bulan",
    other: "{{count}} bulan"
  },
  aboutXYears: {
    one: "sekitar 1 tahun",
    other: "sekitar {{count}} tahun"
  },
  xYears: {
    one: "1 tahun",
    other: "{{count}} tahun"
  },
  overXYears: {
    one: "lebih dari 1 tahun",
    other: "lebih dari {{count}} tahun"
  },
  almostXYears: {
    one: "hampir 1 tahun",
    other: "hampir {{count}} tahun"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "dalam masa " + result;else
  return result + " yang lalu";
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
      short: "d/M/yyyy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH.mm.ss",
      long: "HH.mm.ss",
      medium: "HH.mm",
      short: "HH.mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'pukul' {{time}}",
      long: "{{date}} 'pukul' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ms/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'lepas pada jam' p",
  yesterday: "'Semalam pada jam' p",
  today: "'Hari ini pada jam' p",
  tomorrow: "'Esok pada jam' p",
  nextWeek: "eeee 'pada jam' p",
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
//#region dist/date-fns/locale/ms/_lib/localize.js
var eraValues = {
  narrow: ["SM", "M"],
  abbreviated: ["SM", "M"],
  wide: ["Sebelum Masihi", "Masihi"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "S1",
  "S2",
  "S3",
  "S4"],

  wide: [
  "Suku pertama",
  "Suku kedua",
  "Suku ketiga",
  "Suku keempat"]

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
  "O",
  "S",
  "O",
  "N",
  "D"],

  abbreviated: [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis"],

  wide: [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember"]

};
var dayValues = {
  narrow: [
  "A",
  "I",
  "S",
  "R",
  "K",
  "J",
  "S"],

  short: [
  "Ahd",
  "Isn",
  "Sel",
  "Rab",
  "Kha",
  "Jum",
  "Sab"],

  abbreviated: [
  "Ahd",
  "Isn",
  "Sel",
  "Rab",
  "Kha",
  "Jum",
  "Sab"],

  wide: [
  "Ahad",
  "Isnin",
  "Selasa",
  "Rabu",
  "Khamis",
  "Jumaat",
  "Sabtu"]

};
var dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "tgh malam",
    noon: "tgh hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "tengah hari",
    evening: "petang",
    night: "malam"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return "ke-" + Number(dirtyNumber);
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
//#region dist/date-fns/locale/ms.js
/**
* @category Locales
* @summary Malay locale.
* @language Malay
* @iso-639-2 msa
* @author Ruban Selvarajah [@Zyten](https://github.com/Zyten)
*/
var ms = {
  code: "ms",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^ke-(\d+)?/i,
      parsePattern: /petama|\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(sm|m)/i,
        abbreviated: /^(s\.?\s?m\.?|m\.?)/i,
        wide: /^(sebelum masihi|masihi)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^s/i, /^(m)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^S[1234]/i,
        wide: /Suku (pertama|kedua|ketiga|keempat)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /pertama|1/i,
        /kedua|2/i,
        /ketiga|3/i,
        /keempat|4/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^[jfmasond]/i,
        abbreviated: /^(jan|feb|mac|apr|mei|jun|jul|ogo|sep|okt|nov|dis)/i,
        wide: /^(januari|februari|mac|april|mei|jun|julai|ogos|september|oktober|november|disember)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^j/i,
        /^f/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^j/i,
        /^j/i,
        /^o/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^f/i,
        /^ma/i,
        /^ap/i,
        /^me/i,
        /^jun/i,
        /^jul/i,
        /^og/i,
        /^s/i,
        /^ok/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[aisrkj]/i,
        short: /^(ahd|isn|sel|rab|kha|jum|sab)/i,
        abbreviated: /^(ahd|isn|sel|rab|kha|jum|sab)/i,
        wide: /^(ahad|isnin|selasa|rabu|khamis|jumaat|sabtu)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^a/i,
        /^i/i,
        /^s/i,
        /^r/i,
        /^k/i,
        /^j/i,
        /^s/i],

        any: [
        /^a/i,
        /^i/i,
        /^se/i,
        /^r/i,
        /^k/i,
        /^j/i,
        /^sa/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(am|pm|tengah malam|tengah hari|pagi|petang|malam)/i,
        any: /^([ap]\.?\s?m\.?|tengah malam|tengah hari|pagi|petang|malam)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^pm/i,
          midnight: /^tengah m/i,
          noon: /^tengah h/i,
          morning: /pa/i,
          afternoon: /tengah h/i,
          evening: /pe/i,
          night: /m/i
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
//#region dist/date-fns/_entries/locale/ms/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    ms: ms }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();