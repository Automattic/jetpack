(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/hu/_lib/formatDistance.js
var translations = {
  about: "körülbelül",
  over: "több mint",
  almost: "majdnem",
  lessthan: "kevesebb mint"
};
var withoutSuffixes = {
  xseconds: " másodperc",
  halfaminute: "fél perc",
  xminutes: " perc",
  xhours: " óra",
  xdays: " nap",
  xweeks: " hét",
  xmonths: " hónap",
  xyears: " év"
};
var withSuffixes = {
  xseconds: {
    "-1": " másodperccel ezelőtt",
    1: " másodperc múlva",
    0: " másodperce"
  },
  halfaminute: {
    "-1": "fél perccel ezelőtt",
    1: "fél perc múlva",
    0: "fél perce"
  },
  xminutes: {
    "-1": " perccel ezelőtt",
    1: " perc múlva",
    0: " perce"
  },
  xhours: {
    "-1": " órával ezelőtt",
    1: " óra múlva",
    0: " órája"
  },
  xdays: {
    "-1": " nappal ezelőtt",
    1: " nap múlva",
    0: " napja"
  },
  xweeks: {
    "-1": " héttel ezelőtt",
    1: " hét múlva",
    0: " hete"
  },
  xmonths: {
    "-1": " hónappal ezelőtt",
    1: " hónap múlva",
    0: " hónapja"
  },
  xyears: {
    "-1": " évvel ezelőtt",
    1: " év múlva",
    0: " éve"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var adverb = token.match(/about|over|almost|lessthan/i);
  var unit = adverb ? token.replace(adverb[0], "") : token;
  var addSuffix = (options === null || options === void 0 ? void 0 : options.addSuffix) === true;
  var key = unit.toLowerCase();
  var comparison = (options === null || options === void 0 ? void 0 : options.comparison) || 0;
  var translated = addSuffix ? withSuffixes[key][comparison] : withoutSuffixes[key];
  var result = key === "halfaminute" ? translated : count + translated;
  if (adverb) result = translations[adverb[0].toLowerCase()] + " " + result;
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
      full: "y. MMMM d., EEEE",
      long: "y. MMMM d.",
      medium: "y. MMM d.",
      short: "y. MM. dd."
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "H:mm:ss zzzz",
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
//#region dist/date-fns/locale/hu/_lib/formatRelative.js
var accusativeWeekdays = [
"vasárnap",
"hétfőn",
"kedden",
"szerdán",
"csütörtökön",
"pénteken",
"szombaton"];

function week(isFuture) {
  return function (date) {
    var weekday = accusativeWeekdays[date.getDay()];
    return "".concat(isFuture ? "" : "'múlt' ", "'").concat(weekday, "' p'-kor'");
  };
}
var formatRelativeLocale = {
  lastWeek: week(false),
  yesterday: "'tegnap' p'-kor'",
  today: "'ma' p'-kor'",
  tomorrow: "'holnap' p'-kor'",
  nextWeek: week(true),
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
//#region dist/date-fns/locale/hu/_lib/localize.js
var eraValues = {
  narrow: ["ie.", "isz."],
  abbreviated: ["i. e.", "i. sz."],
  wide: ["Krisztus előtt", "időszámításunk szerint"]
};
var quarterValues = {
  narrow: [
  "1.",
  "2.",
  "3.",
  "4."],

  abbreviated: [
  "1. n.év",
  "2. n.év",
  "3. n.év",
  "4. n.év"],

  wide: [
  "1. negyedév",
  "2. negyedév",
  "3. negyedév",
  "4. negyedév"]

};
var formattingQuarterValues = {
  narrow: [
  "I.",
  "II.",
  "III.",
  "IV."],

  abbreviated: [
  "I. n.év",
  "II. n.év",
  "III. n.év",
  "IV. n.év"],

  wide: [
  "I. negyedév",
  "II. negyedév",
  "III. negyedév",
  "IV. negyedév"]

};
var monthValues = {
  narrow: [
  "J",
  "F",
  "M",
  "Á",
  "M",
  "J",
  "J",
  "A",
  "Sz",
  "O",
  "N",
  "D"],

  abbreviated: [
  "jan.",
  "febr.",
  "márc.",
  "ápr.",
  "máj.",
  "jún.",
  "júl.",
  "aug.",
  "szept.",
  "okt.",
  "nov.",
  "dec."],

  wide: [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december"]

};
var dayValues = {
  narrow: [
  "V",
  "H",
  "K",
  "Sz",
  "Cs",
  "P",
  "Sz"],

  short: [
  "V",
  "H",
  "K",
  "Sze",
  "Cs",
  "P",
  "Szo"],

  abbreviated: [
  "V",
  "H",
  "K",
  "Sze",
  "Cs",
  "P",
  "Szo"],

  wide: [
  "vasárnap",
  "hétfő",
  "kedd",
  "szerda",
  "csütörtök",
  "péntek",
  "szombat"]

};
var dayPeriodValues = {
  narrow: {
    am: "de.",
    pm: "du.",
    midnight: "éjfél",
    noon: "dél",
    morning: "reggel",
    afternoon: "du.",
    evening: "este",
    night: "éjjel"
  },
  abbreviated: {
    am: "de.",
    pm: "du.",
    midnight: "éjfél",
    noon: "dél",
    morning: "reggel",
    afternoon: "du.",
    evening: "este",
    night: "éjjel"
  },
  wide: {
    am: "de.",
    pm: "du.",
    midnight: "éjfél",
    noon: "dél",
    morning: "reggel",
    afternoon: "délután",
    evening: "este",
    night: "éjjel"
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
    argumentCallback: function argumentCallback(quarter) {return quarter - 1;},
    formattingValues: formattingQuarterValues,
    defaultFormattingWidth: "wide"
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
//#region dist/date-fns/locale/hu.js
/**
* @category Locales
* @summary Hungarian locale.
* @language Hungarian
* @iso-639-2 hun
* @author Pavlo Shpak [@pshpak](https://github.com/pshpak)
* @author Eduardo Pardo [@eduardopsll](https://github.com/eduardopsll)
* @author Zoltan Szepesi [@twodcube](https://github.com/twodcube)
*/
var hu = {
  code: "hu",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)\.?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(ie\.|isz\.)/i,
        abbreviated: /^(i\.\s?e\.?|b?\s?c\s?e|i\.\s?sz\.?)/i,
        wide: /^(Krisztus előtt|időszámításunk előtt|időszámításunk szerint|i\. sz\.)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [/ie/i, /isz/i],
        abbreviated: [/^(i\.?\s?e\.?|b\s?ce)/i, /^(i\.?\s?sz\.?|c\s?e)/i],
        any: [/előtt/i, /(szerint|i. sz.)/i]
      },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]\.?/i,
        abbreviated: /^[1234]?\.?\s?n\.év/i,
        wide: /^([1234]|I|II|III|IV)?\.?\s?negyedév/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /1|I$/i,
        /2|II$/i,
        /3|III/i,
        /4|IV/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^[jfmaásond]|sz/i,
        abbreviated: /^(jan\.?|febr\.?|márc\.?|ápr\.?|máj\.?|jún\.?|júl\.?|aug\.?|szept\.?|okt\.?|nov\.?|dec\.?)/i,
        wide: /^(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^j/i,
        /^f/i,
        /^m/i,
        /^a|á/i,
        /^m/i,
        /^j/i,
        /^j/i,
        /^a/i,
        /^s|sz/i,
        /^o/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^f/i,
        /^már/i,
        /^áp/i,
        /^máj/i,
        /^jún/i,
        /^júl/i,
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
        narrow: /^([vhkpc]|sz|cs|sz)/i,
        short: /^([vhkp]|sze|cs|szo)/i,
        abbreviated: /^([vhkp]|sze|cs|szo)/i,
        wide: /^(vasárnap|hétfő|kedd|szerda|csütörtök|péntek|szombat)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^v/i,
        /^h/i,
        /^k/i,
        /^sz/i,
        /^c/i,
        /^p/i,
        /^sz/i],

        any: [
        /^v/i,
        /^h/i,
        /^k/i,
        /^sze/i,
        /^c/i,
        /^p/i,
        /^szo/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^((de|du)\.?|éjfél|délután|dél|reggel|este|éjjel)/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^de\.?/i,
          pm: /^du\.?/i,
          midnight: /^éjf/i,
          noon: /^dé/i,
          morning: /reg/i,
          afternoon: /^délu\.?/i,
          evening: /es/i,
          night: /éjj/i
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
//#region dist/date-fns/_entries/locale/hu/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    hu: hu }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();