(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/lb/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    standalone: {
      one: "manner wéi eng Sekonn",
      other: "manner wéi {{count}} Sekonnen"
    },
    withPreposition: {
      one: "manner wéi enger Sekonn",
      other: "manner wéi {{count}} Sekonnen"
    }
  },
  xSeconds: {
    standalone: {
      one: "eng Sekonn",
      other: "{{count}} Sekonnen"
    },
    withPreposition: {
      one: "enger Sekonn",
      other: "{{count}} Sekonnen"
    }
  },
  halfAMinute: {
    standalone: "eng hallef Minutt",
    withPreposition: "enger hallwer Minutt"
  },
  lessThanXMinutes: {
    standalone: {
      one: "manner wéi eng Minutt",
      other: "manner wéi {{count}} Minutten"
    },
    withPreposition: {
      one: "manner wéi enger Minutt",
      other: "manner wéi {{count}} Minutten"
    }
  },
  xMinutes: {
    standalone: {
      one: "eng Minutt",
      other: "{{count}} Minutten"
    },
    withPreposition: {
      one: "enger Minutt",
      other: "{{count}} Minutten"
    }
  },
  aboutXHours: {
    standalone: {
      one: "ongeféier eng Stonn",
      other: "ongeféier {{count}} Stonnen"
    },
    withPreposition: {
      one: "ongeféier enger Stonn",
      other: "ongeféier {{count}} Stonnen"
    }
  },
  xHours: {
    standalone: {
      one: "eng Stonn",
      other: "{{count}} Stonnen"
    },
    withPreposition: {
      one: "enger Stonn",
      other: "{{count}} Stonnen"
    }
  },
  xDays: {
    standalone: {
      one: "een Dag",
      other: "{{count}} Deeg"
    },
    withPreposition: {
      one: "engem Dag",
      other: "{{count}} Deeg"
    }
  },
  aboutXWeeks: {
    standalone: {
      one: "ongeféier eng Woch",
      other: "ongeféier {{count}} Wochen"
    },
    withPreposition: {
      one: "ongeféier enger Woche",
      other: "ongeféier {{count}} Wochen"
    }
  },
  xWeeks: {
    standalone: {
      one: "eng Woch",
      other: "{{count}} Wochen"
    },
    withPreposition: {
      one: "enger Woch",
      other: "{{count}} Wochen"
    }
  },
  aboutXMonths: {
    standalone: {
      one: "ongeféier ee Mount",
      other: "ongeféier {{count}} Méint"
    },
    withPreposition: {
      one: "ongeféier engem Mount",
      other: "ongeféier {{count}} Méint"
    }
  },
  xMonths: {
    standalone: {
      one: "ee Mount",
      other: "{{count}} Méint"
    },
    withPreposition: {
      one: "engem Mount",
      other: "{{count}} Méint"
    }
  },
  aboutXYears: {
    standalone: {
      one: "ongeféier ee Joer",
      other: "ongeféier {{count}} Joer"
    },
    withPreposition: {
      one: "ongeféier engem Joer",
      other: "ongeféier {{count}} Joer"
    }
  },
  xYears: {
    standalone: {
      one: "ee Joer",
      other: "{{count}} Joer"
    },
    withPreposition: {
      one: "engem Joer",
      other: "{{count}} Joer"
    }
  },
  overXYears: {
    standalone: {
      one: "méi wéi ee Joer",
      other: "méi wéi {{count}} Joer"
    },
    withPreposition: {
      one: "méi wéi engem Joer",
      other: "méi wéi {{count}} Joer"
    }
  },
  almostXYears: {
    standalone: {
      one: "bal ee Joer",
      other: "bal {{count}} Joer"
    },
    withPreposition: {
      one: "bal engem Joer",
      other: "bal {{count}} Joer"
    }
  }
};
var EXCEPTION_CONSONANTS = [
"d",
"h",
"n",
"t",
"z"];

var VOWELS = [
"a,",
"e",
"i",
"o",
"u"];

var DIGITS_SPOKEN_N_NEEDED = [
0,
1,
2,
3,
8,
9];

var FIRST_TWO_DIGITS_SPOKEN_NO_N_NEEDED = [
40,
50,
60,
70];

function isFinalNNeeded(nextWords) {
  var firstLetter = nextWords.charAt(0).toLowerCase();
  if (VOWELS.indexOf(firstLetter) != -1 || EXCEPTION_CONSONANTS.indexOf(firstLetter) != -1) return true;
  var firstWord = nextWords.split(" ")[0];
  var number = parseInt(firstWord);
  if (!isNaN(number) && DIGITS_SPOKEN_N_NEEDED.indexOf(number % 10) != -1 && FIRST_TWO_DIGITS_SPOKEN_NO_N_NEEDED.indexOf(parseInt(firstWord.substring(0, 2))) == -1) return true;
  return false;
}
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  var usageGroup = options !== null && options !== void 0 && options.addSuffix ? tokenValue.withPreposition : tokenValue.standalone;
  if (typeof usageGroup === "string") result = usageGroup;else
  if (count === 1) result = usageGroup.one;else
  result = usageGroup.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "a" + (isFinalNNeeded(result) ? "n" : "") + " " + result;else
  return "viru" + (isFinalNNeeded(result) ? "n" : "") + " " + result;
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
      full: "EEEE, do MMMM y",
      long: "do MMMM y",
      medium: "do MMM y",
      short: "dd.MM.yy"
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
      full: "{{date}} 'um' {{time}}",
      long: "{{date}} 'um' {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/lb/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: function lastWeek(date) {
    var day = date.getDay();
    var result = "'läschte";
    if (day === 2 || day === 4) result += "n";
    result += "' eeee 'um' p";
    return result;
  },
  yesterday: "'gëschter um' p",
  today: "'haut um' p",
  tomorrow: "'moien um' p",
  nextWeek: "eeee 'um' p",
  other: "P"
};
var formatRelative = function formatRelative(token, date, _baseDate, _options) {
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
//#region dist/date-fns/locale/lb/_lib/localize.js
var eraValues = {
  narrow: ["v.Chr.", "n.Chr."],
  abbreviated: ["v.Chr.", "n.Chr."],
  wide: ["viru Christus", "no Christus"]
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
  "1. Quartal",
  "2. Quartal",
  "3. Quartal",
  "4. Quartal"]

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
  "Mäe",
  "Abr",
  "Mee",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez"],

  wide: [
  "Januar",
  "Februar",
  "Mäerz",
  "Abrëll",
  "Mee",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember"]

};
var dayValues = {
  narrow: [
  "S",
  "M",
  "D",
  "M",
  "D",
  "F",
  "S"],

  short: [
  "So",
  "Mé",
  "Dë",
  "Më",
  "Do",
  "Fr",
  "Sa"],

  abbreviated: [
  "So.",
  "Mé.",
  "Dë.",
  "Më.",
  "Do.",
  "Fr.",
  "Sa."],

  wide: [
  "Sonndeg",
  "Méindeg",
  "Dënschdeg",
  "Mëttwoch",
  "Donneschdeg",
  "Freideg",
  "Samschdeg"]

};
var dayPeriodValues = {
  narrow: {
    am: "mo.",
    pm: "nomë.",
    midnight: "Mëtternuecht",
    noon: "Mëtteg",
    morning: "Moien",
    afternoon: "Nomëtteg",
    evening: "Owend",
    night: "Nuecht"
  },
  abbreviated: {
    am: "moies",
    pm: "nomëttes",
    midnight: "Mëtternuecht",
    noon: "Mëtteg",
    morning: "Moien",
    afternoon: "Nomëtteg",
    evening: "Owend",
    night: "Nuecht"
  },
  wide: {
    am: "moies",
    pm: "nomëttes",
    midnight: "Mëtternuecht",
    noon: "Mëtteg",
    morning: "Moien",
    afternoon: "Nomëtteg",
    evening: "Owend",
    night: "Nuecht"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "mo.",
    pm: "nom.",
    midnight: "Mëtternuecht",
    noon: "mëttes",
    morning: "moies",
    afternoon: "nomëttes",
    evening: "owes",
    night: "nuets"
  },
  abbreviated: {
    am: "moies",
    pm: "nomëttes",
    midnight: "Mëtternuecht",
    noon: "mëttes",
    morning: "moies",
    afternoon: "nomëttes",
    evening: "owes",
    night: "nuets"
  },
  wide: {
    am: "moies",
    pm: "nomëttes",
    midnight: "Mëtternuecht",
    noon: "mëttes",
    morning: "moies",
    afternoon: "nomëttes",
    evening: "owes",
    night: "nuets"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return Number(dirtyNumber) + ".";
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
//#region dist/date-fns/locale/lb.js
/**
* @category Locales
* @summary Luxembourgish locale.
* @language Luxembourgish
* @iso-639-2 ltz
* @author Daniel Waxweiler [@dwaxweiler](https://github.com/dwaxweiler)
*/
var lb = {
  code: "lb",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(\.)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
        abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
        wide: /^(viru Christus|virun eiser Zäitrechnung|no Christus|eiser Zäitrechnung)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^v/i, /^n/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](\.)? Quartal/i
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
        abbreviated: /^(jan|feb|mäe|abr|mee|jun|jul|aug|sep|okt|nov|dez)/i,
        wide: /^(januar|februar|mäerz|abrëll|mee|juni|juli|august|september|oktober|november|dezember)/i
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
        /^a/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^f/i,
        /^mä/i,
        /^ab/i,
        /^me/i,
        /^jun/i,
        /^jul/i,
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
        narrow: /^[smdf]/i,
        short: /^(so|mé|dë|më|do|fr|sa)/i,
        abbreviated: /^(son?|méi?|dën?|mët?|don?|fre?|sam?)\.?/i,
        wide: /^(sonndeg|méindeg|dënschdeg|mëttwoch|donneschdeg|freideg|samschdeg)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^so/i,
        /^mé/i,
        /^dë/i,
        /^më/i,
        /^do/i,
        /^f/i,
        /^sa/i]
      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(mo\.?|nomë\.?|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i,
        abbreviated: /^(moi\.?|nomët\.?|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i,
        wide: /^(moies|nomëttes|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: {
          am: /^m/i,
          pm: /^n/i,
          midnight: /^Mëtter/i,
          noon: /^mëttes/i,
          morning: /moies/i,
          afternoon: /nomëttes/i,
          evening: /owes/i,
          night: /nuets/i
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
//#region dist/date-fns/_entries/locale/lb/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    lb: lb }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();