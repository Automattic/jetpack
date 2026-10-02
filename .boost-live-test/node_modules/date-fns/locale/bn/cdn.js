(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/_lib/buildLocalizeFn.js
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
//#region dist/date-fns/locale/bn/_lib/localize.js
var numberValues = {
  locale: {
    1: "১",
    2: "২",
    3: "৩",
    4: "৪",
    5: "৫",
    6: "৬",
    7: "৭",
    8: "৮",
    9: "৯",
    0: "০"
  },
  number: {
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
    "০": "0"
  }
};
var eraValues = {
  narrow: ["খ্রিঃপূঃ", "খ্রিঃ"],
  abbreviated: ["খ্রিঃপূর্ব", "খ্রিঃ"],
  wide: ["খ্রিস্টপূর্ব", "খ্রিস্টাব্দ"]
};
var quarterValues = {
  narrow: [
  "১",
  "২",
  "৩",
  "৪"],

  abbreviated: [
  "১ত্রৈ",
  "২ত্রৈ",
  "৩ত্রৈ",
  "৪ত্রৈ"],

  wide: [
  "১ম ত্রৈমাসিক",
  "২য় ত্রৈমাসিক",
  "৩য় ত্রৈমাসিক",
  "৪র্থ ত্রৈমাসিক"]

};
var monthValues = {
  narrow: [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্ট",
  "অক্টো",
  "নভে",
  "ডিসে"],

  abbreviated: [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্ট",
  "অক্টো",
  "নভে",
  "ডিসে"],

  wide: [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর"]

};
var dayValues = {
  narrow: [
  "র",
  "সো",
  "ম",
  "বু",
  "বৃ",
  "শু",
  "শ"],

  short: [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহ",
  "শুক্র",
  "শনি"],

  abbreviated: [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহ",
  "শুক্র",
  "শনি"],

  wide: [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার ",
  "শুক্রবার",
  "শনিবার"]

};
var dayPeriodValues = {
  narrow: {
    am: "পূ",
    pm: "অপ",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  },
  abbreviated: {
    am: "পূর্বাহ্ন",
    pm: "অপরাহ্ন",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  },
  wide: {
    am: "পূর্বাহ্ন",
    pm: "অপরাহ্ন",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "পূ",
    pm: "অপ",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  },
  abbreviated: {
    am: "পূর্বাহ্ন",
    pm: "অপরাহ্ন",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  },
  wide: {
    am: "পূর্বাহ্ন",
    pm: "অপরাহ্ন",
    midnight: "মধ্যরাত",
    noon: "মধ্যাহ্ন",
    morning: "সকাল",
    afternoon: "বিকাল",
    evening: "সন্ধ্যা",
    night: "রাত"
  }
};
function dateOrdinalNumber(number, localeNumber) {
  if (number > 18 && number <= 31) return localeNumber + "শে";else
  switch (number) {
    case 1:return localeNumber + "লা";
    case 2:
    case 3:return localeNumber + "রা";
    case 4:return localeNumber + "ঠা";
    default:return localeNumber + "ই";
  }
}
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  var localeNumber = numberToLocale(number);
  if ((options === null || options === void 0 ? void 0 : options.unit) === "date") return dateOrdinalNumber(number, localeNumber);
  if (number > 10 || number === 0) return localeNumber + "তম";
  switch (number % 10) {
    case 2:
    case 3:return localeNumber + "য়";
    case 4:return localeNumber + "র্থ";
    case 6:return localeNumber + "ষ্ঠ";
    default:return localeNumber + "ম";
  }
};
function numberToLocale(enNumber) {
  return enNumber.toString().replace(/\d/g, function (match) {
    return numberValues.locale[match];
  });
}
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
//#region dist/date-fns/locale/bn/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "প্রায় ১ সেকেন্ড",
    other: "প্রায় {{count}} সেকেন্ড"
  },
  xSeconds: {
    one: "১ সেকেন্ড",
    other: "{{count}} সেকেন্ড"
  },
  halfAMinute: "আধ মিনিট",
  lessThanXMinutes: {
    one: "প্রায় ১ মিনিট",
    other: "প্রায় {{count}} মিনিট"
  },
  xMinutes: {
    one: "১ মিনিট",
    other: "{{count}} মিনিট"
  },
  aboutXHours: {
    one: "প্রায় ১ ঘন্টা",
    other: "প্রায় {{count}} ঘন্টা"
  },
  xHours: {
    one: "১ ঘন্টা",
    other: "{{count}} ঘন্টা"
  },
  xDays: {
    one: "১ দিন",
    other: "{{count}} দিন"
  },
  aboutXWeeks: {
    one: "প্রায় ১ সপ্তাহ",
    other: "প্রায় {{count}} সপ্তাহ"
  },
  xWeeks: {
    one: "১ সপ্তাহ",
    other: "{{count}} সপ্তাহ"
  },
  aboutXMonths: {
    one: "প্রায় ১ মাস",
    other: "প্রায় {{count}} মাস"
  },
  xMonths: {
    one: "১ মাস",
    other: "{{count}} মাস"
  },
  aboutXYears: {
    one: "প্রায় ১ বছর",
    other: "প্রায় {{count}} বছর"
  },
  xYears: {
    one: "১ বছর",
    other: "{{count}} বছর"
  },
  overXYears: {
    one: "১ বছরের বেশি",
    other: "{{count}} বছরের বেশি"
  },
  almostXYears: {
    one: "প্রায় ১ বছর",
    other: "প্রায় {{count}} বছর"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", numberToLocale(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + " এর মধ্যে";else
  return result + " আগে";
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
      full: "EEEE, MMMM do, y",
      long: "MMMM do, y",
      medium: "MMM d, y",
      short: "MM/dd/yyyy"
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
      full: "{{date}} {{time}} 'সময়'",
      long: "{{date}} {{time}} 'সময়'",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/bn/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'গত' eeee 'সময়' p",
  yesterday: "'গতকাল' 'সময়' p",
  today: "'আজ' 'সময়' p",
  tomorrow: "'আগামীকাল' 'সময়' p",
  nextWeek: "eeee 'সময়' p",
  other: "P"
};
var formatRelative = function formatRelative(token, _date, _baseDate, _options) {return formatRelativeLocale[token];};
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
//#region dist/date-fns/locale/bn.js
/**
* @category Locales
* @summary Bengali locale.
* @language Bengali
* @iso-639-2 ben
* @author Touhidur Rahman [@touhidrahman](https://github.com/touhidrahman)
* @author Farhad Yasir [@nutboltu](https://github.com/nutboltu)
*/
var bn = {
  code: "bn",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(ম|য়|র্থ|ষ্ঠ|শে|ই|তম)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(খ্রিঃপূঃ|খ্রিঃ)/i,
        abbreviated: /^(খ্রিঃপূর্ব|খ্রিঃ)/i,
        wide: /^(খ্রিস্টপূর্ব|খ্রিস্টাব্দ)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [/^খ্রিঃপূঃ/i, /^খ্রিঃ/i],
        abbreviated: [/^খ্রিঃপূর্ব/i, /^খ্রিঃ/i],
        wide: [/^খ্রিস্টপূর্ব/i, /^খ্রিস্টাব্দ/i]
      },
      defaultParseWidth: "wide"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[১২৩৪]/i,
        abbreviated: /^[১২৩৪]ত্রৈ/i,
        wide: /^[১২৩৪](ম|য়|র্থ)? ত্রৈমাসিক/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /১/i,
        /২/i,
        /৩/i,
        /৪/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
        abbreviated: /^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
        wide: /^(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^জানু/i,
        /^ফেব্রু/i,
        /^মার্চ/i,
        /^এপ্রিল/i,
        /^মে/i,
        /^জুন/i,
        /^জুলাই/i,
        /^আগস্ট/i,
        /^সেপ্ট/i,
        /^অক্টো/i,
        /^নভে/i,
        /^ডিসে/i]
      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(র|সো|ম|বু|বৃ|শু|শ)+/i,
        short: /^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
        abbreviated: /^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
        wide: /^(রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার |শুক্রবার|শনিবার)+/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^র/i,
        /^সো/i,
        /^ম/i,
        /^বু/i,
        /^বৃ/i,
        /^শু/i,
        /^শ/i],

        short: [
        /^রবি/i,
        /^সোম/i,
        /^মঙ্গল/i,
        /^বুধ/i,
        /^বৃহ/i,
        /^শুক্র/i,
        /^শনি/i],

        abbreviated: [
        /^রবি/i,
        /^সোম/i,
        /^মঙ্গল/i,
        /^বুধ/i,
        /^বৃহ/i,
        /^শুক্র/i,
        /^শনি/i],

        wide: [
        /^রবিবার/i,
        /^সোমবার/i,
        /^মঙ্গলবার/i,
        /^বুধবার/i,
        /^বৃহস্পতিবার /i,
        /^শুক্রবার/i,
        /^শনিবার/i]

      },
      defaultParseWidth: "wide"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(পূ|অপ|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
        abbreviated: /^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
        wide: /^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: {
          am: /^পূ/i,
          pm: /^অপ/i,
          midnight: /^মধ্যরাত/i,
          noon: /^মধ্যাহ্ন/i,
          morning: /সকাল/i,
          afternoon: /বিকাল/i,
          evening: /সন্ধ্যা/i,
          night: /রাত/i
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
//#region dist/date-fns/_entries/locale/bn/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    bn: bn }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();