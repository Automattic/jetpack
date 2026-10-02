(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/he/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "פחות משנייה",
    two: "פחות משתי שניות",
    other: "פחות מ־{{count}} שניות"
  },
  xSeconds: {
    one: "שנייה",
    two: "שתי שניות",
    other: "{{count}} שניות"
  },
  halfAMinute: "חצי דקה",
  lessThanXMinutes: {
    one: "פחות מדקה",
    two: "פחות משתי דקות",
    other: "פחות מ־{{count}} דקות"
  },
  xMinutes: {
    one: "דקה",
    two: "שתי דקות",
    other: "{{count}} דקות"
  },
  aboutXHours: {
    one: "כשעה",
    two: "כשעתיים",
    other: "כ־{{count}} שעות"
  },
  xHours: {
    one: "שעה",
    two: "שעתיים",
    other: "{{count}} שעות"
  },
  xDays: {
    one: "יום",
    two: "יומיים",
    other: "{{count}} ימים"
  },
  aboutXWeeks: {
    one: "כשבוע",
    two: "כשבועיים",
    other: "כ־{{count}} שבועות"
  },
  xWeeks: {
    one: "שבוע",
    two: "שבועיים",
    other: "{{count}} שבועות"
  },
  aboutXMonths: {
    one: "כחודש",
    two: "כחודשיים",
    other: "כ־{{count}} חודשים"
  },
  xMonths: {
    one: "חודש",
    two: "חודשיים",
    other: "{{count}} חודשים"
  },
  aboutXYears: {
    one: "כשנה",
    two: "כשנתיים",
    other: "כ־{{count}} שנים"
  },
  xYears: {
    one: "שנה",
    two: "שנתיים",
    other: "{{count}} שנים"
  },
  overXYears: {
    one: "יותר משנה",
    two: "יותר משנתיים",
    other: "יותר מ־{{count}} שנים"
  },
  almostXYears: {
    one: "כמעט שנה",
    two: "כמעט שנתיים",
    other: "כמעט {{count}} שנים"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  if (token === "xDays" && options !== null && options !== void 0 && options.addSuffix && count <= 2) {
    if (options.comparison && options.comparison > 0) return count === 1 ? "מחר" : "מחרתיים";
    return count === 1 ? "אתמול" : "שלשום";
  }
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  if (count === 2) result = tokenValue.two;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "בעוד " + result;else
  return "לפני " + result;
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
      full: "EEEE, d בMMMM y",
      long: "d בMMMM y",
      medium: "d בMMM y",
      short: "d.M.y"
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
      full: "{{date}} 'בשעה' {{time}}",
      long: "{{date}} 'בשעה' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/he/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'שעבר בשעה' p",
  yesterday: "'אתמול בשעה' p",
  today: "'היום בשעה' p",
  tomorrow: "'מחר בשעה' p",
  nextWeek: "eeee 'בשעה' p",
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
//#region dist/date-fns/locale/he/_lib/localize.js
var eraValues = {
  narrow: ["לפנה״ס", "לספירה"],
  abbreviated: ["לפנה״ס", "לספירה"],
  wide: ["לפני הספירה", "לספירה"]
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
  "רבעון 1",
  "רבעון 2",
  "רבעון 3",
  "רבעון 4"]

};
var monthValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12"],

  abbreviated: [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳"],

  wide: [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר"]

};
var dayValues = {
  narrow: [
  "א׳",
  "ב׳",
  "ג׳",
  "ד׳",
  "ה׳",
  "ו׳",
  "ש׳"],

  short: [
  "א׳",
  "ב׳",
  "ג׳",
  "ד׳",
  "ה׳",
  "ו׳",
  "ש׳"],

  abbreviated: [
  "יום א׳",
  "יום ב׳",
  "יום ג׳",
  "יום ד׳",
  "יום ה׳",
  "יום ו׳",
  "שבת"],

  wide: [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "יום שבת"]

};
var dayPeriodValues = {
  narrow: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בוקר",
    afternoon: "אחר הצהריים",
    evening: "ערב",
    night: "לילה"
  },
  abbreviated: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בוקר",
    afternoon: "אחר הצהריים",
    evening: "ערב",
    night: "לילה"
  },
  wide: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בוקר",
    afternoon: "אחר הצהריים",
    evening: "ערב",
    night: "לילה"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בבוקר",
    afternoon: "בצהריים",
    evening: "בערב",
    night: "בלילה"
  },
  abbreviated: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בבוקר",
    afternoon: "אחר הצהריים",
    evening: "בערב",
    night: "בלילה"
  },
  wide: {
    am: "לפנה״צ",
    pm: "אחה״צ",
    midnight: "חצות",
    noon: "צהריים",
    morning: "בבוקר",
    afternoon: "אחר הצהריים",
    evening: "בערב",
    night: "בלילה"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  if (number <= 0 || number > 10) return String(number);
  var unit = String(options === null || options === void 0 ? void 0 : options.unit);
  var isFemale = [
  "year",
  "hour",
  "minute",
  "second"].
  indexOf(unit) >= 0;
  var male = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שביעי",
  "שמיני",
  "תשיעי",
  "עשירי"];

  var female = [
  "ראשונה",
  "שנייה",
  "שלישית",
  "רביעית",
  "חמישית",
  "שישית",
  "שביעית",
  "שמינית",
  "תשיעית",
  "עשירית"];

  var index = number - 1;
  return isFemale ? female[index] : male[index];
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
//#region dist/date-fns/locale/he/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+|(ראשון|שני|שלישי|רביעי|חמישי|שישי|שביעי|שמיני|תשיעי|עשירי|ראשונה|שנייה|שלישית|רביעית|חמישית|שישית|שביעית|שמינית|תשיעית|עשירית))/i;
var parseOrdinalNumberPattern = /^(\d+|רא|שנ|של|רב|ח|שי|שב|שמ|ת|ע)/i;
var matchEraPatterns = {
  narrow: /^ל(ספירה|פנה״ס)/i,
  abbreviated: /^ל(ספירה|פנה״ס)/i,
  wide: /^ל(פני ה)?ספירה/i
};
var parseEraPatterns = { any: [/^לפ/i, /^לס/i] };
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^רבעון [1234]/i
};
var parseQuarterPatterns = { any: [
  /1/i,
  /2/i,
  /3/i,
  /4/i]
};
var matchMonthPatterns = {
  narrow: /^\d+/i,
  abbreviated: /^(ינו|פבר|מרץ|אפר|מאי|יוני|יולי|אוג|ספט|אוק|נוב|דצמ)׳?/i,
  wide: /^(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)/i
};
var parseMonthPatterns = {
  narrow: [
  /^1$/i,
  /^2/i,
  /^3/i,
  /^4/i,
  /^5/i,
  /^6/i,
  /^7/i,
  /^8/i,
  /^9/i,
  /^10/i,
  /^11/i,
  /^12/i],

  any: [
  /^ינ/i,
  /^פ/i,
  /^מר/i,
  /^אפ/i,
  /^מא/i,
  /^יונ/i,
  /^יול/i,
  /^אוג/i,
  /^ס/i,
  /^אוק/i,
  /^נ/i,
  /^ד/i]

};
var matchDayPatterns = {
  narrow: /^[אבגדהוש]׳/i,
  short: /^[אבגדהוש]׳/i,
  abbreviated: /^(שבת|יום (א|ב|ג|ד|ה|ו)׳)/i,
  wide: /^יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/i
};
var parseDayPatterns = {
  abbreviated: [
  /א׳$/i,
  /ב׳$/i,
  /ג׳$/i,
  /ד׳$/i,
  /ה׳$/i,
  /ו׳$/i,
  /^ש/i],

  wide: [
  /ן$/i,
  /ני$/i,
  /לישי$/i,
  /עי$/i,
  /מישי$/i,
  /שישי$/i,
  /ת$/i],

  any: [
  /^א/i,
  /^ב/i,
  /^ג/i,
  /^ד/i,
  /^ה/i,
  /^ו/i,
  /^ש/i]

};
var matchDayPeriodPatterns = { any: /^(אחר ה|ב)?(חצות|צהריים|בוקר|ערב|לילה|אחה״צ|לפנה״צ)/i };
var parseDayPeriodPatterns = { any: {
    am: /^לפ/i,
    pm: /^אחה/i,
    midnight: /^ח/i,
    noon: /^צ/i,
    morning: /בוקר/i,
    afternoon: /בצ|אחר/i,
    evening: /ערב/i,
    night: /לילה/i
  } };
var ordinalName = [
"רא",
"שנ",
"של",
"רב",
"ח",
"שי",
"שב",
"שמ",
"ת",
"ע"];

//#endregion
//#region dist/date-fns/locale/he.js
/**
* @category Locales
* @summary Hebrew locale.
* @language Hebrew
* @iso-639-2 heb
* @author Nir Lahad [@nirlah](https://github.com/nirlah)
*/
var he = {
  code: "he",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: matchOrdinalNumberPattern,
      parsePattern: parseOrdinalNumberPattern,
      valueCallback: function valueCallback(value) {
        var number = parseInt(value, 10);
        return isNaN(number) ? ordinalName.indexOf(value) + 1 : number;
      }
    }),
    era: buildMatchFn({
      matchPatterns: matchEraPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseEraPatterns,
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: matchQuarterPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseQuarterPatterns,
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: matchMonthPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseMonthPatterns,
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: matchDayPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseDayPatterns,
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: matchDayPeriodPatterns,
      defaultMatchWidth: "any",
      parsePatterns: parseDayPeriodPatterns,
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/he/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    he: he }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();