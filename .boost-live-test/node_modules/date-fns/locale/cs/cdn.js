(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/cs/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: {
      regular: "méně než 1 sekunda",
      past: "před méně než 1 sekundou",
      future: "za méně než 1 sekundu"
    },
    few: {
      regular: "méně než {{count}} sekundy",
      past: "před méně než {{count}} sekundami",
      future: "za méně než {{count}} sekundy"
    },
    many: {
      regular: "méně než {{count}} sekund",
      past: "před méně než {{count}} sekundami",
      future: "za méně než {{count}} sekund"
    }
  },
  xSeconds: {
    one: {
      regular: "1 sekunda",
      past: "před 1 sekundou",
      future: "za 1 sekundu"
    },
    few: {
      regular: "{{count}} sekundy",
      past: "před {{count}} sekundami",
      future: "za {{count}} sekundy"
    },
    many: {
      regular: "{{count}} sekund",
      past: "před {{count}} sekundami",
      future: "za {{count}} sekund"
    }
  },
  halfAMinute: {
    type: "other",
    other: {
      regular: "půl minuty",
      past: "před půl minutou",
      future: "za půl minuty"
    }
  },
  lessThanXMinutes: {
    one: {
      regular: "méně než 1 minuta",
      past: "před méně než 1 minutou",
      future: "za méně než 1 minutu"
    },
    few: {
      regular: "méně než {{count}} minuty",
      past: "před méně než {{count}} minutami",
      future: "za méně než {{count}} minuty"
    },
    many: {
      regular: "méně než {{count}} minut",
      past: "před méně než {{count}} minutami",
      future: "za méně než {{count}} minut"
    }
  },
  xMinutes: {
    one: {
      regular: "1 minuta",
      past: "před 1 minutou",
      future: "za 1 minutu"
    },
    few: {
      regular: "{{count}} minuty",
      past: "před {{count}} minutami",
      future: "za {{count}} minuty"
    },
    many: {
      regular: "{{count}} minut",
      past: "před {{count}} minutami",
      future: "za {{count}} minut"
    }
  },
  aboutXHours: {
    one: {
      regular: "přibližně 1 hodina",
      past: "přibližně před 1 hodinou",
      future: "přibližně za 1 hodinu"
    },
    few: {
      regular: "přibližně {{count}} hodiny",
      past: "přibližně před {{count}} hodinami",
      future: "přibližně za {{count}} hodiny"
    },
    many: {
      regular: "přibližně {{count}} hodin",
      past: "přibližně před {{count}} hodinami",
      future: "přibližně za {{count}} hodin"
    }
  },
  xHours: {
    one: {
      regular: "1 hodina",
      past: "před 1 hodinou",
      future: "za 1 hodinu"
    },
    few: {
      regular: "{{count}} hodiny",
      past: "před {{count}} hodinami",
      future: "za {{count}} hodiny"
    },
    many: {
      regular: "{{count}} hodin",
      past: "před {{count}} hodinami",
      future: "za {{count}} hodin"
    }
  },
  xDays: {
    one: {
      regular: "1 den",
      past: "před 1 dnem",
      future: "za 1 den"
    },
    few: {
      regular: "{{count}} dny",
      past: "před {{count}} dny",
      future: "za {{count}} dny"
    },
    many: {
      regular: "{{count}} dní",
      past: "před {{count}} dny",
      future: "za {{count}} dní"
    }
  },
  aboutXWeeks: {
    one: {
      regular: "přibližně 1 týden",
      past: "přibližně před 1 týdnem",
      future: "přibližně za 1 týden"
    },
    few: {
      regular: "přibližně {{count}} týdny",
      past: "přibližně před {{count}} týdny",
      future: "přibližně za {{count}} týdny"
    },
    many: {
      regular: "přibližně {{count}} týdnů",
      past: "přibližně před {{count}} týdny",
      future: "přibližně za {{count}} týdnů"
    }
  },
  xWeeks: {
    one: {
      regular: "1 týden",
      past: "před 1 týdnem",
      future: "za 1 týden"
    },
    few: {
      regular: "{{count}} týdny",
      past: "před {{count}} týdny",
      future: "za {{count}} týdny"
    },
    many: {
      regular: "{{count}} týdnů",
      past: "před {{count}} týdny",
      future: "za {{count}} týdnů"
    }
  },
  aboutXMonths: {
    one: {
      regular: "přibližně 1 měsíc",
      past: "přibližně před 1 měsícem",
      future: "přibližně za 1 měsíc"
    },
    few: {
      regular: "přibližně {{count}} měsíce",
      past: "přibližně před {{count}} měsíci",
      future: "přibližně za {{count}} měsíce"
    },
    many: {
      regular: "přibližně {{count}} měsíců",
      past: "přibližně před {{count}} měsíci",
      future: "přibližně za {{count}} měsíců"
    }
  },
  xMonths: {
    one: {
      regular: "1 měsíc",
      past: "před 1 měsícem",
      future: "za 1 měsíc"
    },
    few: {
      regular: "{{count}} měsíce",
      past: "před {{count}} měsíci",
      future: "za {{count}} měsíce"
    },
    many: {
      regular: "{{count}} měsíců",
      past: "před {{count}} měsíci",
      future: "za {{count}} měsíců"
    }
  },
  aboutXYears: {
    one: {
      regular: "přibližně 1 rok",
      past: "přibližně před 1 rokem",
      future: "přibližně za 1 rok"
    },
    few: {
      regular: "přibližně {{count}} roky",
      past: "přibližně před {{count}} roky",
      future: "přibližně za {{count}} roky"
    },
    many: {
      regular: "přibližně {{count}} roků",
      past: "přibližně před {{count}} roky",
      future: "přibližně za {{count}} roků"
    }
  },
  xYears: {
    one: {
      regular: "1 rok",
      past: "před 1 rokem",
      future: "za 1 rok"
    },
    few: {
      regular: "{{count}} roky",
      past: "před {{count}} roky",
      future: "za {{count}} roky"
    },
    many: {
      regular: "{{count}} roků",
      past: "před {{count}} roky",
      future: "za {{count}} roků"
    }
  },
  overXYears: {
    one: {
      regular: "více než 1 rok",
      past: "před více než 1 rokem",
      future: "za více než 1 rok"
    },
    few: {
      regular: "více než {{count}} roky",
      past: "před více než {{count}} roky",
      future: "za více než {{count}} roky"
    },
    many: {
      regular: "více než {{count}} roků",
      past: "před více než {{count}} roky",
      future: "za více než {{count}} roků"
    }
  },
  almostXYears: {
    one: {
      regular: "skoro 1 rok",
      past: "skoro před 1 rokem",
      future: "skoro za 1 rok"
    },
    few: {
      regular: "skoro {{count}} roky",
      past: "skoro před {{count}} roky",
      future: "skoro za {{count}} roky"
    },
    many: {
      regular: "skoro {{count}} roků",
      past: "skoro před {{count}} roky",
      future: "skoro za {{count}} roků"
    }
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var pluralResult;
  var tokenValue = formatDistanceLocale[token];
  if (tokenValue.type === "other") pluralResult = tokenValue.other;else
  if (count === 1) pluralResult = tokenValue.one;else
  if (count > 1 && count < 5) pluralResult = tokenValue.few;else
  pluralResult = tokenValue.many;
  var suffixExist = (options === null || options === void 0 ? void 0 : options.addSuffix) === true;
  var comparison = options === null || options === void 0 ? void 0 : options.comparison;
  var timeResult;
  if (suffixExist && comparison === -1) timeResult = pluralResult.past;else
  if (suffixExist && comparison === 1) timeResult = pluralResult.future;else
  timeResult = pluralResult.regular;
  return timeResult.replace("{{count}}", String(count));
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
      full: "EEEE, d. MMMM yyyy",
      long: "d. MMMM yyyy",
      medium: "d. M. yyyy",
      short: "dd.MM.yyyy"
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
      full: "{{date}} 'v' {{time}}",
      long: "{{date}} 'v' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/cs/_lib/formatRelative.js
var accusativeWeekdays = [
"neděli",
"pondělí",
"úterý",
"středu",
"čtvrtek",
"pátek",
"sobotu"];

var formatRelativeLocale = {
  lastWeek: "'poslední' eeee 've' p",
  yesterday: "'včera v' p",
  today: "'dnes v' p",
  tomorrow: "'zítra v' p",
  nextWeek: function nextWeek(date) {
    return "'v " + accusativeWeekdays[date.getDay()] + " o' p";
  },
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
//#region dist/date-fns/locale/cs/_lib/localize.js
var eraValues = {
  narrow: ["př. n. l.", "n. l."],
  abbreviated: ["př. n. l.", "n. l."],
  wide: ["před naším letopočtem", "našeho letopočtu"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "1. čtvrtletí",
  "2. čtvrtletí",
  "3. čtvrtletí",
  "4. čtvrtletí"],

  wide: [
  "1. čtvrtletí",
  "2. čtvrtletí",
  "3. čtvrtletí",
  "4. čtvrtletí"]

};
var monthValues = {
  narrow: [
  "L",
  "Ú",
  "B",
  "D",
  "K",
  "Č",
  "Č",
  "S",
  "Z",
  "Ř",
  "L",
  "P"],

  abbreviated: [
  "led",
  "úno",
  "bře",
  "dub",
  "kvě",
  "čvn",
  "čvc",
  "srp",
  "zář",
  "říj",
  "lis",
  "pro"],

  wide: [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec"]

};
var formattingMonthValues = {
  narrow: [
  "L",
  "Ú",
  "B",
  "D",
  "K",
  "Č",
  "Č",
  "S",
  "Z",
  "Ř",
  "L",
  "P"],

  abbreviated: [
  "led",
  "úno",
  "bře",
  "dub",
  "kvě",
  "čvn",
  "čvc",
  "srp",
  "zář",
  "říj",
  "lis",
  "pro"],

  wide: [
  "ledna",
  "února",
  "března",
  "dubna",
  "května",
  "června",
  "července",
  "srpna",
  "září",
  "října",
  "listopadu",
  "prosince"]

};
var dayValues = {
  narrow: [
  "ne",
  "po",
  "út",
  "st",
  "čt",
  "pá",
  "so"],

  short: [
  "ne",
  "po",
  "út",
  "st",
  "čt",
  "pá",
  "so"],

  abbreviated: [
  "ned",
  "pon",
  "úte",
  "stř",
  "čtv",
  "pát",
  "sob"],

  wide: [
  "neděle",
  "pondělí",
  "úterý",
  "středa",
  "čtvrtek",
  "pátek",
  "sobota"]

};
var dayPeriodValues = {
  narrow: {
    am: "dop.",
    pm: "odp.",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
  },
  abbreviated: {
    am: "dop.",
    pm: "odp.",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
  },
  wide: {
    am: "dopoledne",
    pm: "odpoledne",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "dop.",
    pm: "odp.",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
  },
  abbreviated: {
    am: "dop.",
    pm: "odp.",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
  },
  wide: {
    am: "dopoledne",
    pm: "odpoledne",
    midnight: "půlnoc",
    noon: "poledne",
    morning: "ráno",
    afternoon: "odpoledne",
    evening: "večer",
    night: "noc"
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
//#region dist/date-fns/locale/cs.js
/**
* @category Locales
* @summary Czech locale.
* @language Czech
* @iso-639-2 ces
* @author David Rus [@davidrus](https://github.com/davidrus)
* @author Pavel Hrách [@SilenY](https://github.com/SilenY)
* @author Jozef Bíroš [@JozefBiros](https://github.com/JozefBiros)
*/
var cs = {
  code: "cs",
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
        narrow: /^(p[řr](\.|ed) Kr\.|p[řr](\.|ed) n\. l\.|po Kr\.|n\. l\.)/i,
        abbreviated: /^(p[řr](\.|ed) Kr\.|p[řr](\.|ed) n\. l\.|po Kr\.|n\. l\.)/i,
        wide: /^(p[řr](\.|ed) Kristem|p[řr](\.|ed) na[šs][íi]m letopo[čc]tem|po Kristu|na[šs]eho letopo[čc]tu)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^p[řr]/i, /^(po|n)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^[1234]\. [čc]tvrtlet[íi]/i,
        wide: /^[1234]\. [čc]tvrtlet[íi]/i
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
        narrow: /^[lúubdkčcszřrlp]/i,
        abbreviated: /^(led|[úu]no|b[řr]e|dub|kv[ěe]|[čc]vn|[čc]vc|srp|z[áa][řr]|[řr][íi]j|lis|pro)/i,
        wide: /^(leden|ledna|[úu]nora?|b[řr]ezen|b[řr]ezna|duben|dubna|kv[ěe]ten|kv[ěe]tna|[čc]erven(ec|ce)?|[čc]ervna|srpen|srpna|z[áa][řr][íi]|[řr][íi]jen|[řr][íi]jna|listopad(a|u)?|prosinec|prosince)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^l/i,
        /^[úu]/i,
        /^b/i,
        /^d/i,
        /^k/i,
        /^[čc]/i,
        /^[čc]/i,
        /^s/i,
        /^z/i,
        /^[řr]/i,
        /^l/i,
        /^p/i],

        any: [
        /^led/i,
        /^[úu]n/i,
        /^b[řr]e/i,
        /^dub/i,
        /^kv[ěe]/i,
        /^[čc]vn|[čc]erven(?!\w)|[čc]ervna/i,
        /^[čc]vc|[čc]erven(ec|ce)/i,
        /^srp/i,
        /^z[áa][řr]/i,
        /^[řr][íi]j/i,
        /^lis/i,
        /^pro/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[npuúsčps]/i,
        short: /^(ne|po|[úu]t|st|[čc]t|p[áa]|so)/i,
        abbreviated: /^(ned|pon|[úu]te|st[rř]|[čc]tv|p[áa]t|sob)/i,
        wide: /^(ned[ěe]le|pond[ěe]l[íi]|[úu]ter[ýy]|st[řr]eda|[čc]tvrtek|p[áa]tek|sobota)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^n/i,
        /^p/i,
        /^[úu]/i,
        /^s/i,
        /^[čc]/i,
        /^p/i,
        /^s/i],

        any: [
        /^ne/i,
        /^po/i,
        /^[úu]t/i,
        /^st/i,
        /^[čc]t/i,
        /^p[áa]/i,
        /^so/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: { any: /^dopoledne|dop\.?|odpoledne|odp\.?|p[ůu]lnoc|poledne|r[áa]no|odpoledne|ve[čc]er|(v )?noci?/i },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^dop/i,
          pm: /^odp/i,
          midnight: /^p[ůu]lnoc/i,
          noon: /^poledne/i,
          morning: /r[áa]no/i,
          afternoon: /odpoledne/i,
          evening: /ve[čc]er/i,
          night: /noc/i
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
//#region dist/date-fns/_entries/locale/cs/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    cs: cs }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();