(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ro/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "mai puțin de o secundă",
    other: "mai puțin de {{count}} secunde"
  },
  xSeconds: {
    one: "1 secundă",
    other: "{{count}} secunde"
  },
  halfAMinute: "jumătate de minut",
  lessThanXMinutes: {
    one: "mai puțin de un minut",
    other: "mai puțin de {{count}} minute"
  },
  xMinutes: {
    one: "1 minut",
    other: "{{count}} minute"
  },
  aboutXHours: {
    one: "circa 1 oră",
    other: "circa {{count}} ore"
  },
  xHours: {
    one: "1 oră",
    other: "{{count}} ore"
  },
  xDays: {
    one: "1 zi",
    other: "{{count}} zile"
  },
  aboutXWeeks: {
    one: "circa o săptămână",
    other: "circa {{count}} săptămâni"
  },
  xWeeks: {
    one: "1 săptămână",
    other: "{{count}} săptămâni"
  },
  aboutXMonths: {
    one: "circa 1 lună",
    other: "circa {{count}} luni"
  },
  xMonths: {
    one: "1 lună",
    other: "{{count}} luni"
  },
  aboutXYears: {
    one: "circa 1 an",
    other: "circa {{count}} ani"
  },
  xYears: {
    one: "1 an",
    other: "{{count}} ani"
  },
  overXYears: {
    one: "peste 1 an",
    other: "peste {{count}} ani"
  },
  almostXYears: {
    one: "aproape 1 an",
    other: "aproape {{count}} ani"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "în " + result;else
  return result + " în urmă";
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
      full: "{{date}} 'la' {{time}}",
      long: "{{date}} 'la' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ro/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'trecută la' p",
  yesterday: "'ieri la' p",
  today: "'astăzi la' p",
  tomorrow: "'mâine la' p",
  nextWeek: "eeee 'viitoare la' p",
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
//#region dist/date-fns/locale/ro/_lib/localize.js
var eraValues = {
  narrow: ["Î", "D"],
  abbreviated: ["Î.d.C.", "D.C."],
  wide: ["Înainte de Cristos", "După Cristos"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "T1",
  "T2",
  "T3",
  "T4"],

  wide: [
  "primul trimestru",
  "al doilea trimestru",
  "al treilea trimestru",
  "al patrulea trimestru"]

};
var monthValues = {
  narrow: [
  "I",
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
  "ian",
  "feb",
  "mar",
  "apr",
  "mai",
  "iun",
  "iul",
  "aug",
  "sep",
  "oct",
  "noi",
  "dec"],

  wide: [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie"]

};
var dayValues = {
  narrow: [
  "d",
  "l",
  "m",
  "m",
  "j",
  "v",
  "s"],

  short: [
  "du",
  "lu",
  "ma",
  "mi",
  "jo",
  "vi",
  "sâ"],

  abbreviated: [
  "dum",
  "lun",
  "mar",
  "mie",
  "joi",
  "vin",
  "sâm"],

  wide: [
  "duminică",
  "luni",
  "marți",
  "miercuri",
  "joi",
  "vineri",
  "sâmbătă"]

};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "ami",
    morning: "dim",
    afternoon: "da",
    evening: "s",
    night: "n"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "miezul nopții",
    noon: "amiază",
    morning: "dimineață",
    afternoon: "după-amiază",
    evening: "seară",
    night: "noapte"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "miezul nopții",
    noon: "amiază",
    morning: "dimineață",
    afternoon: "după-amiază",
    evening: "seară",
    night: "noapte"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "amiază",
    morning: "dimineață",
    afternoon: "după-amiază",
    evening: "seară",
    night: "noapte"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "miezul nopții",
    noon: "amiază",
    morning: "dimineață",
    afternoon: "după-amiază",
    evening: "seară",
    night: "noapte"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "miezul nopții",
    noon: "amiază",
    morning: "dimineață",
    afternoon: "după-amiază",
    evening: "seară",
    night: "noapte"
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
//#region dist/date-fns/locale/ro.js
/**
* @category Locales
* @summary Romanian locale.
* @language Romanian
* @iso-639-2 ron
* @author Sergiu Munteanu [@jsergiu](https://github.com/jsergiu)
* @author Adrian Ocneanu [@aocneanu](https://github.com/aocneanu)
* @author Mihai Ocneanu [@gandesc](https://github.com/gandesc)
*/
var ro = {
  code: "ro",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(Î|D)/i,
        abbreviated: /^(Î\.?\s?d\.?\s?C\.?|Î\.?\s?e\.?\s?n\.?|D\.?\s?C\.?|e\.?\s?n\.?)/i,
        wide: /^(Înainte de Cristos|Înaintea erei noastre|După Cristos|Era noastră)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        any: [/^ÎC/i, /^DC/i],
        wide: [/^(Înainte de Cristos|Înaintea erei noastre)/i, /^(După Cristos|Era noastră)/i]
      },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^T[1234]/i,
        wide: /^trimestrul [1234]/i
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
        narrow: /^[ifmaasond]/i,
        abbreviated: /^(ian|feb|mar|apr|mai|iun|iul|aug|sep|oct|noi|dec)/i,
        wide: /^(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^i/i,
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
        /^ia/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^mai/i,
        /^iun/i,
        /^iul/i,
        /^au/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[dlmjvs]/i,
        short: /^(d|l|ma|mi|j|v|s)/i,
        abbreviated: /^(dum|lun|mar|mie|jo|vi|sâ)/i,
        wide: /^(duminica|luni|marţi|miercuri|joi|vineri|sâmbătă)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^d/i,
        /^l/i,
        /^m/i,
        /^m/i,
        /^j/i,
        /^v/i,
        /^s/i],

        any: [
        /^d/i,
        /^l/i,
        /^ma/i,
        /^mi/i,
        /^j/i,
        /^v/i,
        /^s/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|mn|a|(dimineaţa|după-amiaza|seara|noaptea))/i,
        any: /^([ap]\.?\s?m\.?|miezul nopții|amiaza|(dimineaţa|după-amiaza|seara|noaptea))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^mn/i,
          noon: /amiaza/i,
          morning: /dimineaţa/i,
          afternoon: /după-amiaza/i,
          evening: /seara/i,
          night: /noaptea/i
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
//#region dist/date-fns/_entries/locale/ro/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    ro: ro }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();