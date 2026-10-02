(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/el/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "λιγότερο από ένα δευτερόλεπτο",
    other: "λιγότερο από {{count}} δευτερόλεπτα"
  },
  xSeconds: {
    one: "1 δευτερόλεπτο",
    other: "{{count}} δευτερόλεπτα"
  },
  halfAMinute: "μισό λεπτό",
  lessThanXMinutes: {
    one: "λιγότερο από ένα λεπτό",
    other: "λιγότερο από {{count}} λεπτά"
  },
  xMinutes: {
    one: "1 λεπτό",
    other: "{{count}} λεπτά"
  },
  aboutXHours: {
    one: "περίπου 1 ώρα",
    other: "περίπου {{count}} ώρες"
  },
  xHours: {
    one: "1 ώρα",
    other: "{{count}} ώρες"
  },
  xDays: {
    one: "1 ημέρα",
    other: "{{count}} ημέρες"
  },
  aboutXWeeks: {
    one: "περίπου 1 εβδομάδα",
    other: "περίπου {{count}} εβδομάδες"
  },
  xWeeks: {
    one: "1 εβδομάδα",
    other: "{{count}} εβδομάδες"
  },
  aboutXMonths: {
    one: "περίπου 1 μήνας",
    other: "περίπου {{count}} μήνες"
  },
  xMonths: {
    one: "1 μήνας",
    other: "{{count}} μήνες"
  },
  aboutXYears: {
    one: "περίπου 1 χρόνο",
    other: "περίπου {{count}} χρόνια"
  },
  xYears: {
    one: "1 χρόνο",
    other: "{{count}} χρόνια"
  },
  overXYears: {
    one: "πάνω από 1 χρόνο",
    other: "πάνω από {{count}} χρόνια"
  },
  almostXYears: {
    one: "περίπου 1 χρόνο",
    other: "περίπου {{count}} χρόνια"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "σε " + result;else
  return result + " πριν";
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
      full: "EEEE, d MMMM y",
      long: "d MMMM y",
      medium: "d MMM y",
      short: "d/M/yy"
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
      full: "{{date}} - {{time}}",
      long: "{{date}} - {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/el/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: function lastWeek(date) {
    switch (date.getDay()) {
      case 6:return "'το προηγούμενο' eeee 'στις' p";
      default:return "'την προηγούμενη' eeee 'στις' p";
    }
  },
  yesterday: "'χθες στις' p",
  today: "'σήμερα στις' p",
  tomorrow: "'αύριο στις' p",
  nextWeek: "eeee 'στις' p",
  other: "P"
};
var formatRelative = function formatRelative(token, date) {
  var format = formatRelativeLocale[token];
  if (typeof format === "function") return format(date);
  return format;
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
//#region dist/date-fns/locale/el/_lib/localize.js
var eraValues = {
  narrow: ["πΧ", "μΧ"],
  abbreviated: ["π.Χ.", "μ.Χ."],
  wide: ["προ Χριστού", "μετά Χριστόν"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Τ1",
  "Τ2",
  "Τ3",
  "Τ4"],

  wide: [
  "1ο τρίμηνο",
  "2ο τρίμηνο",
  "3ο τρίμηνο",
  "4ο τρίμηνο"]

};
var monthValues = {
  narrow: [
  "Ι",
  "Φ",
  "Μ",
  "Α",
  "Μ",
  "Ι",
  "Ι",
  "Α",
  "Σ",
  "Ο",
  "Ν",
  "Δ"],

  abbreviated: [
  "Ιαν",
  "Φεβ",
  "Μάρ",
  "Απρ",
  "Μάι",
  "Ιούν",
  "Ιούλ",
  "Αύγ",
  "Σεπ",
  "Οκτ",
  "Νοέ",
  "Δεκ"],

  wide: [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος"]

};
var formattingMonthValues = {
  narrow: [
  "Ι",
  "Φ",
  "Μ",
  "Α",
  "Μ",
  "Ι",
  "Ι",
  "Α",
  "Σ",
  "Ο",
  "Ν",
  "Δ"],

  abbreviated: [
  "Ιαν",
  "Φεβ",
  "Μαρ",
  "Απρ",
  "Μαΐ",
  "Ιουν",
  "Ιουλ",
  "Αυγ",
  "Σεπ",
  "Οκτ",
  "Νοε",
  "Δεκ"],

  wide: [
  "Ιανουαρίου",
  "Φεβρουαρίου",
  "Μαρτίου",
  "Απριλίου",
  "Μαΐου",
  "Ιουνίου",
  "Ιουλίου",
  "Αυγούστου",
  "Σεπτεμβρίου",
  "Οκτωβρίου",
  "Νοεμβρίου",
  "Δεκεμβρίου"]

};
var dayValues = {
  narrow: [
  "Κ",
  "Δ",
  "T",
  "Τ",
  "Π",
  "Π",
  "Σ"],

  short: [
  "Κυ",
  "Δε",
  "Τρ",
  "Τε",
  "Πέ",
  "Πα",
  "Σά"],

  abbreviated: [
  "Κυρ",
  "Δευ",
  "Τρί",
  "Τετ",
  "Πέμ",
  "Παρ",
  "Σάβ"],

  wide: [
  "Κυριακή",
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο"]

};
var dayPeriodValues = {
  narrow: {
    am: "πμ",
    pm: "μμ",
    midnight: "μεσάνυχτα",
    noon: "μεσημέρι",
    morning: "πρωί",
    afternoon: "απόγευμα",
    evening: "βράδυ",
    night: "νύχτα"
  },
  abbreviated: {
    am: "π.μ.",
    pm: "μ.μ.",
    midnight: "μεσάνυχτα",
    noon: "μεσημέρι",
    morning: "πρωί",
    afternoon: "απόγευμα",
    evening: "βράδυ",
    night: "νύχτα"
  },
  wide: {
    am: "π.μ.",
    pm: "μ.μ.",
    midnight: "μεσάνυχτα",
    noon: "μεσημέρι",
    morning: "πρωί",
    afternoon: "απόγευμα",
    evening: "βράδυ",
    night: "νύχτα"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  var unit = options === null || options === void 0 ? void 0 : options.unit;
  var suffix;
  if (unit === "year" || unit === "month") suffix = "ος";else
  if (unit === "week" || unit === "dayOfYear" || unit === "day" || unit === "hour" || unit === "date") suffix = "η";else
  suffix = "ο";
  return number + suffix;
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
    defaultWidth: "wide",
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide"
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
//#region dist/date-fns/locale/el.js
/**
* @category Locales
* @summary Greek locale.
* @language Greek
* @iso-639-2 ell
* @author Fanis Katsimpas [@fanixk](https://github.com/fanixk)
* @author Theodoros Orfanidis [@teoulas](https://github.com/teoulas)
*/
var el = {
  code: "el",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(ος|η|ο)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(πΧ|μΧ)/i,
        abbreviated: /^(π\.?\s?χ\.?|π\.?\s?κ\.?\s?χ\.?|μ\.?\s?χ\.?|κ\.?\s?χ\.?)/i,
        wide: /^(προ Χριστο(ύ|υ)|πριν απ(ό|ο) την Κοιν(ή|η) Χρονολογ(ί|ι)α|μετ(ά|α) Χριστ(ό|ο)ν|Κοιν(ή|η) Χρονολογ(ί|ι)α)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^π/i, /^(μ|κ)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^τ[1234]/i,
        wide: /^[1234]ο? τρ(ί|ι)μηνο/i
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
        narrow: /^[ιφμαμιιασονδ]/i,
        abbreviated: /^(ιαν|φεβ|μ[άα]ρ|απρ|μ[άα][ιΐ]|ιο[ύυ]ν|ιο[ύυ]λ|α[ύυ]γ|σεπ|οκτ|νο[έε]|δεκ)/i,
        wide: /^(μ[άα][ιΐ]|α[ύυ]γο[υύ]στ)(ος|ου)|(ιανου[άα]ρ|φεβρου[άα]ρ|μ[άα]ρτ|απρ[ίι]λ|ιο[ύυ]ν|ιο[ύυ]λ|σεπτ[έε]μβρ|οκτ[ώω]βρ|νο[έε]μβρ|δεκ[έε]μβρ)(ιος|ίου)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ι/i,
        /^φ/i,
        /^μ/i,
        /^α/i,
        /^μ/i,
        /^ι/i,
        /^ι/i,
        /^α/i,
        /^σ/i,
        /^ο/i,
        /^ν/i,
        /^δ/i],

        any: [
        /^ια/i,
        /^φ/i,
        /^μ[άα]ρ/i,
        /^απ/i,
        /^μ[άα][ιΐ]/i,
        /^ιο[ύυ]ν/i,
        /^ιο[ύυ]λ/i,
        /^α[ύυ]/i,
        /^σ/i,
        /^ο/i,
        /^ν/i,
        /^δ/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[κδτπσ]/i,
        short: /^(κυ|δε|τρ|τε|π[εέ]|π[αά]|σ[αά])/i,
        abbreviated: /^(κυρ|δευ|τρι|τετ|πεμ|παρ|σαβ)/i,
        wide: /^(κυριακ(ή|η)|δευτ(έ|ε)ρα|τρ(ί|ι)τη|τετ(ά|α)ρτη|π(έ|ε)μπτη|παρασκευ(ή|η)|σ(ά|α)ββατο)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^κ/i,
        /^δ/i,
        /^τ/i,
        /^τ/i,
        /^π/i,
        /^π/i,
        /^σ/i],

        any: [
        /^κ/i,
        /^δ/i,
        /^τρ/i,
        /^τε/i,
        /^π[εέ]/i,
        /^π[αά]/i,
        /^σ/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(πμ|μμ|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i,
        any: /^([πμ]\.?\s?μ\.?|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^πμ|π\.\s?μ\./i,
          pm: /^μμ|μ\.\s?μ\./i,
          midnight: /^μεσάν/i,
          noon: /^μεσημ(έ|ε)/i,
          morning: /πρω(ί|ι)/i,
          afternoon: /απ(ό|ο)γευμα/i,
          evening: /βρ(ά|α)δυ/i,
          night: /ν(ύ|υ)χτα/i
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
//#region dist/date-fns/_entries/locale/el/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    el: el }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();