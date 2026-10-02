(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/fi/_lib/formatDistance.js
function futureSeconds(text) {
  return text.replace(/sekuntia?/, "sekunnin");
}
function futureMinutes(text) {
  return text.replace(/minuuttia?/, "minuutin");
}
function futureHours(text) {
  return text.replace(/tuntia?/, "tunnin");
}
function futureDays(text) {
  return text.replace(/päivää?/, "päivän");
}
function futureWeeks(text) {
  return text.replace(/(viikko|viikkoa)/, "viikon");
}
function futureMonths(text) {
  return text.replace(/(kuukausi|kuukautta)/, "kuukauden");
}
function futureYears(text) {
  return text.replace(/(vuosi|vuotta)/, "vuoden");
}
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "alle sekunti",
    other: "alle {{count}} sekuntia",
    futureTense: futureSeconds
  },
  xSeconds: {
    one: "sekunti",
    other: "{{count}} sekuntia",
    futureTense: futureSeconds
  },
  halfAMinute: {
    one: "puoli minuuttia",
    other: "puoli minuuttia",
    futureTense: function futureTense(_text) {return "puolen minuutin";}
  },
  lessThanXMinutes: {
    one: "alle minuutti",
    other: "alle {{count}} minuuttia",
    futureTense: futureMinutes
  },
  xMinutes: {
    one: "minuutti",
    other: "{{count}} minuuttia",
    futureTense: futureMinutes
  },
  aboutXHours: {
    one: "noin tunti",
    other: "noin {{count}} tuntia",
    futureTense: futureHours
  },
  xHours: {
    one: "tunti",
    other: "{{count}} tuntia",
    futureTense: futureHours
  },
  xDays: {
    one: "päivä",
    other: "{{count}} päivää",
    futureTense: futureDays
  },
  aboutXWeeks: {
    one: "noin viikko",
    other: "noin {{count}} viikkoa",
    futureTense: futureWeeks
  },
  xWeeks: {
    one: "viikko",
    other: "{{count}} viikkoa",
    futureTense: futureWeeks
  },
  aboutXMonths: {
    one: "noin kuukausi",
    other: "noin {{count}} kuukautta",
    futureTense: futureMonths
  },
  xMonths: {
    one: "kuukausi",
    other: "{{count}} kuukautta",
    futureTense: futureMonths
  },
  aboutXYears: {
    one: "noin vuosi",
    other: "noin {{count}} vuotta",
    futureTense: futureYears
  },
  xYears: {
    one: "vuosi",
    other: "{{count}} vuotta",
    futureTense: futureYears
  },
  overXYears: {
    one: "yli vuosi",
    other: "yli {{count}} vuotta",
    futureTense: futureYears
  },
  almostXYears: {
    one: "lähes vuosi",
    other: "lähes {{count}} vuotta",
    futureTense: futureYears
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var tokenValue = formatDistanceLocale[token];
  var result = count === 1 ? tokenValue.one : tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return tokenValue.futureTense(result) + " kuluttua";else
  return result + " sitten";
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
      full: "eeee d. MMMM y",
      long: "d. MMMM y",
      medium: "d. MMM y",
      short: "d.M.y"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH.mm.ss zzzz",
      long: "HH.mm.ss z",
      medium: "HH.mm.ss",
      short: "HH.mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} 'klo' {{time}}",
      long: "{{date}} 'klo' {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/fi/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'viime' eeee 'klo' p",
  yesterday: "'eilen klo' p",
  today: "'tänään klo' p",
  tomorrow: "'huomenna klo' p",
  nextWeek: "'ensi' eeee 'klo' p",
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
//#region dist/date-fns/locale/fi/_lib/localize.js
var eraValues = {
  narrow: ["eaa.", "jaa."],
  abbreviated: ["eaa.", "jaa."],
  wide: ["ennen ajanlaskun alkua", "jälkeen ajanlaskun alun"]
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
  "1. kvartaali",
  "2. kvartaali",
  "3. kvartaali",
  "4. kvartaali"]

};
var monthValues = {
  narrow: [
  "T",
  "H",
  "M",
  "H",
  "T",
  "K",
  "H",
  "E",
  "S",
  "L",
  "M",
  "J"],

  abbreviated: [
  "tammi",
  "helmi",
  "maalis",
  "huhti",
  "touko",
  "kesä",
  "heinä",
  "elo",
  "syys",
  "loka",
  "marras",
  "joulu"],

  wide: [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu"]

};
var formattingMonthValues = {
  narrow: monthValues.narrow,
  abbreviated: monthValues.abbreviated,
  wide: [
  "tammikuuta",
  "helmikuuta",
  "maaliskuuta",
  "huhtikuuta",
  "toukokuuta",
  "kesäkuuta",
  "heinäkuuta",
  "elokuuta",
  "syyskuuta",
  "lokakuuta",
  "marraskuuta",
  "joulukuuta"]

};
var dayValues = {
  narrow: [
  "S",
  "M",
  "T",
  "K",
  "T",
  "P",
  "L"],

  short: [
  "su",
  "ma",
  "ti",
  "ke",
  "to",
  "pe",
  "la"],

  abbreviated: [
  "sunn.",
  "maan.",
  "tiis.",
  "kesk.",
  "torst.",
  "perj.",
  "la"],

  wide: [
  "sunnuntai",
  "maanantai",
  "tiistai",
  "keskiviikko",
  "torstai",
  "perjantai",
  "lauantai"]

};
var formattingDayValues = {
  narrow: dayValues.narrow,
  short: dayValues.short,
  abbreviated: dayValues.abbreviated,
  wide: [
  "sunnuntaina",
  "maanantaina",
  "tiistaina",
  "keskiviikkona",
  "torstaina",
  "perjantaina",
  "lauantaina"]

};
var dayPeriodValues = {
  narrow: {
    am: "ap",
    pm: "ip",
    midnight: "keskiyö",
    noon: "keskipäivä",
    morning: "ap",
    afternoon: "ip",
    evening: "illalla",
    night: "yöllä"
  },
  abbreviated: {
    am: "ap",
    pm: "ip",
    midnight: "keskiyö",
    noon: "keskipäivä",
    morning: "ap",
    afternoon: "ip",
    evening: "illalla",
    night: "yöllä"
  },
  wide: {
    am: "ap",
    pm: "ip",
    midnight: "keskiyöllä",
    noon: "keskipäivällä",
    morning: "aamupäivällä",
    afternoon: "iltapäivällä",
    evening: "illalla",
    night: "yöllä"
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
    defaultWidth: "wide",
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
    formattingValues: formattingDayValues,
    defaultFormattingWidth: "wide"
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
//#region dist/date-fns/locale/fi.js
/**
* @category Locales
* @summary Finnish locale.
* @language Finnish
* @iso-639-2 fin
* @author Pyry-Samuli Lahti [@Pyppe](https://github.com/Pyppe)
* @author Edo Rivai [@mikolajgrzyb](https://github.com/mikolajgrzyb)
* @author Samu Juvonen [@sjuvonen](https://github.com/sjuvonen)
*/
var fi = {
  code: "fi",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(\.)/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(e|j)/i,
        abbreviated: /^(eaa.|jaa.)/i,
        wide: /^(ennen ajanlaskun alkua|jälkeen ajanlaskun alun)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^e/i, /^j/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234]\.? kvartaali/i
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
        narrow: /^[thmkeslj]/i,
        abbreviated: /^(tammi|helmi|maalis|huhti|touko|kesä|heinä|elo|syys|loka|marras|joulu)/i,
        wide: /^(tammikuu|helmikuu|maaliskuu|huhtikuu|toukokuu|kesäkuu|heinäkuu|elokuu|syyskuu|lokakuu|marraskuu|joulukuu)(ta)?/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^t/i,
        /^h/i,
        /^m/i,
        /^h/i,
        /^t/i,
        /^k/i,
        /^h/i,
        /^e/i,
        /^s/i,
        /^l/i,
        /^m/i,
        /^j/i],

        any: [
        /^ta/i,
        /^hel/i,
        /^maa/i,
        /^hu/i,
        /^to/i,
        /^k/i,
        /^hei/i,
        /^e/i,
        /^s/i,
        /^l/i,
        /^mar/i,
        /^j/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[smtkpl]/i,
        short: /^(su|ma|ti|ke|to|pe|la)/i,
        abbreviated: /^(sunn.|maan.|tiis.|kesk.|torst.|perj.|la)/i,
        wide: /^(sunnuntai|maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai)(na)?/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^m/i,
        /^t/i,
        /^k/i,
        /^t/i,
        /^p/i,
        /^l/i],

        any: [
        /^s/i,
        /^m/i,
        /^ti/i,
        /^k/i,
        /^to/i,
        /^p/i,
        /^l/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(ap|ip|keskiyö|keskipäivä|aamupäivällä|iltapäivällä|illalla|yöllä)/i,
        any: /^(ap|ip|keskiyöllä|keskipäivällä|aamupäivällä|iltapäivällä|illalla|yöllä)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^ap/i,
          pm: /^ip/i,
          midnight: /^keskiyö/i,
          noon: /^keskipäivä/i,
          morning: /aamupäivällä/i,
          afternoon: /iltapäivällä/i,
          evening: /illalla/i,
          night: /yöllä/i
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
//#region dist/date-fns/_entries/locale/fi/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    fi: fi }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();