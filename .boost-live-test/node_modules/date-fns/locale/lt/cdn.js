(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/lt/_lib/formatDistance.js
var translations = {
  xseconds_other: "sekundė_sekundžių_sekundes",
  xminutes_one: "minutė_minutės_minutę",
  xminutes_other: "minutės_minučių_minutes",
  xhours_one: "valanda_valandos_valandą",
  xhours_other: "valandos_valandų_valandas",
  xdays_one: "diena_dienos_dieną",
  xdays_other: "dienos_dienų_dienas",
  xweeks_one: "savaitė_savaitės_savaitę",
  xweeks_other: "savaitės_savaičių_savaites",
  xmonths_one: "mėnuo_mėnesio_mėnesį",
  xmonths_other: "mėnesiai_mėnesių_mėnesius",
  xyears_one: "metai_metų_metus",
  xyears_other: "metai_metų_metus",
  about: "apie",
  over: "daugiau nei",
  almost: "beveik",
  lessthan: "mažiau nei"
};
var translateSeconds = function translateSeconds(_number, addSuffix, _key, isFuture) {
  if (!addSuffix) return "kelios sekundės";else
  return isFuture ? "kelių sekundžių" : "kelias sekundes";
};
var translateSingular = function translateSingular(_number, addSuffix, key, isFuture) {
  return !addSuffix ? forms(key)[0] : isFuture ? forms(key)[1] : forms(key)[2];
};
var translate = function translate(number, addSuffix, key, isFuture) {
  var result = number + " ";
  if (number === 1) return result + translateSingular(number, addSuffix, key, isFuture);else
  if (!addSuffix) return result + (special(number) ? forms(key)[1] : forms(key)[0]);else
  if (isFuture) return result + forms(key)[1];else
  return result + (special(number) ? forms(key)[1] : forms(key)[2]);
};
function special(number) {
  return number % 10 === 0 || number > 10 && number < 20;
}
function forms(key) {
  return translations[key].split("_");
}
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: translateSeconds,
    other: translate
  },
  xSeconds: {
    one: translateSeconds,
    other: translate
  },
  halfAMinute: "pusė minutės",
  lessThanXMinutes: {
    one: translateSingular,
    other: translate
  },
  xMinutes: {
    one: translateSingular,
    other: translate
  },
  aboutXHours: {
    one: translateSingular,
    other: translate
  },
  xHours: {
    one: translateSingular,
    other: translate
  },
  xDays: {
    one: translateSingular,
    other: translate
  },
  aboutXWeeks: {
    one: translateSingular,
    other: translate
  },
  xWeeks: {
    one: translateSingular,
    other: translate
  },
  aboutXMonths: {
    one: translateSingular,
    other: translate
  },
  xMonths: {
    one: translateSingular,
    other: translate
  },
  aboutXYears: {
    one: translateSingular,
    other: translate
  },
  xYears: {
    one: translateSingular,
    other: translate
  },
  overXYears: {
    one: translateSingular,
    other: translate
  },
  almostXYears: {
    one: translateSingular,
    other: translate
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var adverb = token.match(/about|over|almost|lessthan/i);
  var unit = adverb ? token.replace(adverb[0], "") : token;
  var isFuture = (options === null || options === void 0 ? void 0 : options.comparison) !== void 0 && options.comparison > 0;
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one(count, (options === null || options === void 0 ? void 0 : options.addSuffix) === true, unit.toLowerCase() + "_one", isFuture);else
  result = tokenValue.other(count, (options === null || options === void 0 ? void 0 : options.addSuffix) === true, unit.toLowerCase() + "_other", isFuture);
  if (adverb) result = translations[adverb[0].toLowerCase()] + " " + result;
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "po " + result;else
  return "prieš " + result;
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
      full: "y 'm'. MMMM d 'd'., EEEE",
      long: "y 'm'. MMMM d 'd'.",
      medium: "y-MM-dd",
      short: "y-MM-dd"
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
      full: "{{date}} {{time}}",
      long: "{{date}} {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/lt/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'Praėjusį' eeee p",
  yesterday: "'Vakar' p",
  today: "'Šiandien' p",
  tomorrow: "'Rytoj' p",
  nextWeek: "eeee p",
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
//#region dist/date-fns/locale/lt/_lib/localize.js
var eraValues = {
  narrow: ["pr. Kr.", "po Kr."],
  abbreviated: ["pr. Kr.", "po Kr."],
  wide: ["prieš Kristų", "po Kristaus"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "I ketv.",
  "II ketv.",
  "III ketv.",
  "IV ketv."],

  wide: [
  "I ketvirtis",
  "II ketvirtis",
  "III ketvirtis",
  "IV ketvirtis"]

};
var formattingQuarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "I k.",
  "II k.",
  "III k.",
  "IV k."],

  wide: [
  "I ketvirtis",
  "II ketvirtis",
  "III ketvirtis",
  "IV ketvirtis"]

};
var monthValues = {
  narrow: [
  "S",
  "V",
  "K",
  "B",
  "G",
  "B",
  "L",
  "R",
  "R",
  "S",
  "L",
  "G"],

  abbreviated: [
  "saus.",
  "vas.",
  "kov.",
  "bal.",
  "geg.",
  "birž.",
  "liep.",
  "rugp.",
  "rugs.",
  "spal.",
  "lapkr.",
  "gruod."],

  wide: [
  "sausis",
  "vasaris",
  "kovas",
  "balandis",
  "gegužė",
  "birželis",
  "liepa",
  "rugpjūtis",
  "rugsėjis",
  "spalis",
  "lapkritis",
  "gruodis"]

};
var formattingMonthValues = {
  narrow: [
  "S",
  "V",
  "K",
  "B",
  "G",
  "B",
  "L",
  "R",
  "R",
  "S",
  "L",
  "G"],

  abbreviated: [
  "saus.",
  "vas.",
  "kov.",
  "bal.",
  "geg.",
  "birž.",
  "liep.",
  "rugp.",
  "rugs.",
  "spal.",
  "lapkr.",
  "gruod."],

  wide: [
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio"]

};
var dayValues = {
  narrow: [
  "S",
  "P",
  "A",
  "T",
  "K",
  "P",
  "Š"],

  short: [
  "Sk",
  "Pr",
  "An",
  "Tr",
  "Kt",
  "Pn",
  "Št"],

  abbreviated: [
  "sk",
  "pr",
  "an",
  "tr",
  "kt",
  "pn",
  "št"],

  wide: [
  "sekmadienis",
  "pirmadienis",
  "antradienis",
  "trečiadienis",
  "ketvirtadienis",
  "penktadienis",
  "šeštadienis"]

};
var formattingDayValues = {
  narrow: [
  "S",
  "P",
  "A",
  "T",
  "K",
  "P",
  "Š"],

  short: [
  "Sk",
  "Pr",
  "An",
  "Tr",
  "Kt",
  "Pn",
  "Št"],

  abbreviated: [
  "sk",
  "pr",
  "an",
  "tr",
  "kt",
  "pn",
  "št"],

  wide: [
  "sekmadienį",
  "pirmadienį",
  "antradienį",
  "trečiadienį",
  "ketvirtadienį",
  "penktadienį",
  "šeštadienį"]

};
var dayPeriodValues = {
  narrow: {
    am: "pr. p.",
    pm: "pop.",
    midnight: "vidurnaktis",
    noon: "vidurdienis",
    morning: "rytas",
    afternoon: "diena",
    evening: "vakaras",
    night: "naktis"
  },
  abbreviated: {
    am: "priešpiet",
    pm: "popiet",
    midnight: "vidurnaktis",
    noon: "vidurdienis",
    morning: "rytas",
    afternoon: "diena",
    evening: "vakaras",
    night: "naktis"
  },
  wide: {
    am: "priešpiet",
    pm: "popiet",
    midnight: "vidurnaktis",
    noon: "vidurdienis",
    morning: "rytas",
    afternoon: "diena",
    evening: "vakaras",
    night: "naktis"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "pr. p.",
    pm: "pop.",
    midnight: "vidurnaktis",
    noon: "perpiet",
    morning: "rytas",
    afternoon: "popietė",
    evening: "vakaras",
    night: "naktis"
  },
  abbreviated: {
    am: "priešpiet",
    pm: "popiet",
    midnight: "vidurnaktis",
    noon: "perpiet",
    morning: "rytas",
    afternoon: "popietė",
    evening: "vakaras",
    night: "naktis"
  },
  wide: {
    am: "priešpiet",
    pm: "popiet",
    midnight: "vidurnaktis",
    noon: "perpiet",
    morning: "rytas",
    afternoon: "popietė",
    evening: "vakaras",
    night: "naktis"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return Number(dirtyNumber) + "-oji";
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
    formattingValues: formattingQuarterValues,
    defaultFormattingWidth: "wide",
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
//#region dist/date-fns/locale/lt.js
/**
* @category Locales
* @summary Lithuanian locale.
* @language Lithuanian
* @iso-639-2 lit
* @author Pavlo Shpak [@pshpak](https://github.com/pshpak)
* @author Eduardo Pardo [@eduardopsll](https://github.com/eduardopsll)
*/
var lt = {
  code: "lt",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(-oji)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^p(r|o)\.?\s?(kr\.?|me)/i,
        abbreviated: /^(pr\.\s?(kr\.|m\.\s?e\.)|po\s?kr\.|mūsų eroje)/i,
        wide: /^(prieš Kristų|prieš mūsų erą|po Kristaus|mūsų eroje)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        wide: [/prieš/i, /(po|mūsų)/i],
        any: [/^pr/i, /^(po|m)/i]
      },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^([1234])/i,
        abbreviated: /^(I|II|III|IV)\s?ketv?\.?/i,
        wide: /^(I|II|III|IV)\s?ketvirtis/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /1/i,
        /2/i,
        /3/i,
        /4/i],

        any: [
        /I$/i,
        /II$/i,
        /III/i,
        /IV/i]

      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^[svkbglr]/i,
        abbreviated: /^(saus\.|vas\.|kov\.|bal\.|geg\.|birž\.|liep\.|rugp\.|rugs\.|spal\.|lapkr\.|gruod\.)/i,
        wide: /^(sausi(s|o)|vasari(s|o)|kov(a|o)s|balandž?i(s|o)|gegužės?|birželi(s|o)|liep(a|os)|rugpjū(t|č)i(s|o)|rugsėj(is|o)|spali(s|o)|lapkri(t|č)i(s|o)|gruodž?i(s|o))/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^v/i,
        /^k/i,
        /^b/i,
        /^g/i,
        /^b/i,
        /^l/i,
        /^r/i,
        /^r/i,
        /^s/i,
        /^l/i,
        /^g/i],

        any: [
        /^saus/i,
        /^vas/i,
        /^kov/i,
        /^bal/i,
        /^geg/i,
        /^birž/i,
        /^liep/i,
        /^rugp/i,
        /^rugs/i,
        /^spal/i,
        /^lapkr/i,
        /^gruod/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[spatkš]/i,
        short: /^(sk|pr|an|tr|kt|pn|št)/i,
        abbreviated: /^(sk|pr|an|tr|kt|pn|št)/i,
        wide: /^(sekmadien(is|į)|pirmadien(is|į)|antradien(is|į)|trečiadien(is|į)|ketvirtadien(is|į)|penktadien(is|į)|šeštadien(is|į))/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^p/i,
        /^a/i,
        /^t/i,
        /^k/i,
        /^p/i,
        /^š/i],

        wide: [
        /^se/i,
        /^pi/i,
        /^an/i,
        /^tr/i,
        /^ke/i,
        /^pe/i,
        /^še/i],

        any: [
        /^sk/i,
        /^pr/i,
        /^an/i,
        /^tr/i,
        /^kt/i,
        /^pn/i,
        /^št/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(pr.\s?p.|pop.|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i,
        any: /^(priešpiet|popiet$|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: {
        narrow: {
          am: /^pr/i,
          pm: /^pop./i,
          midnight: /^vidurnaktis/i,
          noon: /^(vidurdienis|perp)/i,
          morning: /rytas/i,
          afternoon: /(die|popietė)/i,
          evening: /vakaras/i,
          night: /naktis/i
        },
        any: {
          am: /^pr/i,
          pm: /^popiet$/i,
          midnight: /^vidurnaktis/i,
          noon: /^(vidurdienis|perp)/i,
          morning: /rytas/i,
          afternoon: /(die|popietė)/i,
          evening: /vakaras/i,
          night: /naktis/i
        }
      },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/lt/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    lt: lt }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();